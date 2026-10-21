import { createHash } from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldPath, FieldValue, Timestamp, getFirestore, type DocumentData, type DocumentSnapshot, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import { onCall, onRequest, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
    aggregateDemands,
    accessoryUnitPrice,
    calculatePrice,
    getRentalWindow,
    isBlocking,
    isHolding,
    isInsideDeliveryZone,
    parseDateTime,
    parseDurationHours,
    rentalDemands,
    shippingFee,
    type CatalogItem,
    type Combo,
    type Demand,
    type RentalLike,
} from './domain';

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = defineSecret('TELEGRAM_CHAT_ID');

type BookingLine = {
    productId: string;
    productType: 'single' | 'combo';
    quantity: number;
    wheelSize?: string;
    componentSelections?: Array<{ inventoryItemId: string; wheelSize?: string }>;
};
type BookingRequest = {
    idempotencyKey: string;
    lines: BookingLine[];
    accessories?: Array<{ itemId: string; quantity: number }>;
    date: string;
    pickupTime: string;
    endTime?: string;
    duration: string;
    paymentMethod: 'QR' | 'Transferencia' | 'Efectivo';
    discountCode?: string;
    transport?: { delivery: boolean; pickup: boolean; address: string; lat: number; lng: number };
};

const ACTIVE_STATUSES = ['pending', 'Pendiente', 'confirmed', 'Confirmado', 'delivered', 'Entregado'];
const MAX_REQUEST_BYTES = 24_000;

function callable(options: { enforceAppCheck?: boolean } = {}) {
    return { region: 'us-central1', maxInstances: 10, enforceAppCheck: options.enforceAppCheck ?? false } as const;
}

function cleanString(value: unknown, max: number): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, max);
}

function requireAuth(request: CallableRequest<unknown>, requireVerifiedEmail = false): { uid: string; email: string } {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
    const email = typeof request.auth.token.email === 'string' ? request.auth.token.email.toLowerCase().trim() : '';
    if (requireVerifiedEmail && request.auth.token.email_verified !== true) {
        throw new HttpsError('failed-precondition', 'Verifica tu correo electrónico antes de continuar.');
    }
    return { uid: request.auth.uid, email };
}

function digest(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

function exactObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function coordinatesFromMapUrl(value: unknown): { lat: number; lng: number } | null {
    const url = cleanString(value, 500);
    const match = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i)
        || url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]); const lng = Number(match[2]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function validateBooking(data: unknown): BookingRequest {
    if (!exactObject(data) || Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_REQUEST_BYTES) {
        throw new HttpsError('invalid-argument', 'La solicitud de reserva no es válida.');
    }
    const lines = data.lines;
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) {
        throw new HttpsError('invalid-argument', 'Agrega entre 1 y 20 productos.');
    }
    const cleanLines: BookingLine[] = lines.map((line) => {
        if (!exactObject(line)
            || typeof line.productId !== 'string'
            || !['single', 'combo'].includes(String(line.productType))
            || !Number.isInteger(line.quantity)
            || Number(line.quantity) < 1
            || Number(line.quantity) > 20
            || (line.wheelSize !== undefined && typeof line.wheelSize !== 'string')) {
            throw new HttpsError('invalid-argument', 'Un producto tiene datos inválidos.');
        }
        return {
            productId: cleanString(line.productId, 100),
            productType: line.productType as BookingLine['productType'],
            quantity: Number(line.quantity),
            ...(line.wheelSize ? { wheelSize: cleanString(line.wheelSize, 20) } : {}),
            ...(Array.isArray(line.componentSelections) ? {
                componentSelections: line.componentSelections.map((selection) => {
                    if (!exactObject(selection) || typeof selection.inventoryItemId !== 'string'
                        || (selection.wheelSize !== undefined && typeof selection.wheelSize !== 'string')) {
                        throw new HttpsError('invalid-argument', 'La selección de aro de un combo no es válida.');
                    }
                    return {
                        inventoryItemId: cleanString(selection.inventoryItemId, 100),
                        ...(selection.wheelSize ? { wheelSize: cleanString(selection.wheelSize, 20) } : {}),
                    };
                }),
            } : {}),
        };
    });
    const accessoriesInput = data.accessories === undefined ? [] : data.accessories;
    if (!Array.isArray(accessoriesInput) || accessoriesInput.length > 30) {
        throw new HttpsError('invalid-argument', 'La lista de accesorios no es válida.');
    }
    const accessories = accessoriesInput.map((item) => {
        if (!exactObject(item) || typeof item.itemId !== 'string'
            || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
            throw new HttpsError('invalid-argument', 'Un accesorio tiene datos inválidos.');
        }
        return { itemId: cleanString(item.itemId, 100), quantity: Number(item.quantity) };
    });
    const date = cleanString(data.date, 10);
    const pickupTime = cleanString(data.pickupTime, 5);
    const duration = cleanString(data.duration, 60);
    const idempotencyKey = cleanString(data.idempotencyKey, 80);
    if (!/^[a-zA-Z0-9_-]{16,80}$/.test(idempotencyKey)
        || !duration || parseDurationHours(duration) > 720
        || !['QR', 'Transferencia', 'Efectivo'].includes(String(data.paymentMethod))) {
        throw new HttpsError('invalid-argument', 'La solicitud de reserva no es válida.');
    }
    let transport: BookingRequest['transport'];
    if (data.transport !== undefined) {
        if (!exactObject(data.transport)
            || typeof data.transport.delivery !== 'boolean'
            || typeof data.transport.pickup !== 'boolean'
            || typeof data.transport.address !== 'string'
            || typeof data.transport.lat !== 'number'
            || typeof data.transport.lng !== 'number'
            || !Number.isFinite(data.transport.lat)
            || !Number.isFinite(data.transport.lng)) {
            throw new HttpsError('invalid-argument', 'Los datos de entrega no son válidos.');
        }
        transport = {
            delivery: data.transport.delivery,
            pickup: data.transport.pickup,
            address: cleanString(data.transport.address, 500),
            lat: data.transport.lat,
            lng: data.transport.lng,
        };
    }
    try {
        const start = parseDateTime(date, pickupTime);
        let end = start + parseDurationHours(duration) * 3_600_000;
        if (data.endTime && parseDurationHours(duration) < 24) {
            const candidateEnd = parseDateTime(date, cleanString(data.endTime, 5));
            if (candidateEnd > start) end = candidateEnd;
        }
        if (end <= start) throw new Error('invalid window');
        const localToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
        if (date < localToday || start < Date.now()) throw new Error('past date');
    } catch {
        throw new HttpsError('invalid-argument', 'La fecha o el horario no son válidos.');
    }
    const paymentMethod = data.paymentMethod as BookingRequest['paymentMethod'];
    return {
        idempotencyKey,
        lines: cleanLines,
        accessories,
        date,
        pickupTime,
        ...(data.endTime ? { endTime: cleanString(data.endTime, 5) } : {}),
        duration,
        paymentMethod,
        discountCode: cleanString(data.discountCode, 40).toUpperCase(),
        ...(transport ? { transport } : {}),
    };
}

function stockFor(item: CatalogItem, wheelSize?: string): number {
    if (item.hasWheelSizes && item.wheelSizes) {
        const wheel = wheelSize ? item.wheelSizes.find((entry) => entry.size === wheelSize) : undefined;
        if (wheelSize && !wheel) return 0;
        return wheel ? Math.max(0, Number(wheel.stock) || 0) : item.wheelSizes.reduce((sum, entry) => sum + Math.max(0, Number(entry.stock) || 0), 0);
    }
    return Math.max(0, Number(item.stock) || 0);
}

function resourceKey(demand: Demand): string {
    return digest(`${demand.itemId}\0${demand.wheelSize || ''}`);
}

function sumLinePrice(item: CatalogItem | Combo | undefined, duration: string, quantity: number): number {
    return calculatePrice(item, duration, quantity);
}

function normalizeLegacyRental(doc: QueryDocumentSnapshot<DocumentData>): RentalLike | null {
    const value = doc.data();
    if (typeof value.productId !== 'string' || !ACTIVE_STATUSES.includes(String(value.status))) return null;
    return {
        productType: value.productType === 'combo' ? 'combo' : 'single',
        productId: value.productId,
        quantity: Number(value.quantity) || 0,
        selectedWheelSize: typeof value.selectedWheelSize === 'string' ? value.selectedWheelSize : undefined,
        componentSelections: Array.isArray(value.componentSelections) ? value.componentSelections : undefined,
        selectedAccessories: Array.isArray(value.selectedAccessories) ? value.selectedAccessories : undefined,
        status: String(value.status),
        date: String(value.date || ''),
        pickupTime: String(value.pickupTime || '09:00'),
        endTime: typeof value.endTime === 'string' ? value.endTime : undefined,
        duration: typeof value.duration === 'string' || typeof value.duration === 'number' ? value.duration : '1 Hora',
        startTimestamp: typeof value.startTimestamp === 'number' ? value.startTimestamp : undefined,
        endTimestamp: typeof value.endTimestamp === 'number' ? value.endTimestamp : undefined,
    };
}

function mergeDemandsByResource(demands: Demand[]): Map<string, number> {
    const result = new Map<string, number>();
    for (const demand of demands) {
        const key = resourceKey(demand);
        result.set(key, (result.get(key) || 0) + demand.quantity);
    }
    return result;
}

function validateProfile(data: unknown): { name: string; phone: string; ci: string; address?: string; nacionalidad?: string; departamento?: string; comoNosConociste?: string } {
    if (!exactObject(data)) throw new HttpsError('invalid-argument', 'Los datos del cliente no son válidos.');
    const name = cleanString(data.name, 120);
    const phone = cleanString(data.phone, 40);
    const ci = cleanString(data.ci, 40);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 7 || ci.length < 3) {
        throw new HttpsError('invalid-argument', 'Completa nombre, teléfono y documento de identidad.');
    }
    return {
        name,
        phone,
        ci,
        ...(data.address ? { address: cleanString(data.address, 250) } : {}),
        ...(data.nacionalidad ? { nacionalidad: cleanString(data.nacionalidad, 80) } : {}),
        ...(data.departamento ? { departamento: cleanString(data.departamento, 80) } : {}),
        ...(data.comoNosConociste ? { comoNosConociste: cleanString(data.comoNosConociste, 80) } : {}),
    };
}

export const createCustomerProfile = onCall(callable(), async (request) => {
    const { uid, email } = requireAuth(request, true);
    if (!email) throw new HttpsError('failed-precondition', 'La cuenta necesita un correo electrónico.');
    const profileRef = db.doc(`customerProfiles/${uid}`);
    const existing = await profileRef.get();
    if (existing.exists) return { profile: existing.data(), alreadyExists: true };
    const pendingRef = db.doc(`pendingCustomerRegistrations/${uid}`);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists || Number(pendingSnap.data()?.expiresAt) < Date.now()) {
        throw new HttpsError('failed-precondition', 'El registro expiró. Inicia nuevamente el registro.');
    }
    const profileInput = validateProfile(pendingSnap.data());
    const privatePaths = ['autofotoPath', 'documentoPath', 'documentoReversoPath'].reduce<Record<string, string>>((result, field) => {
        const path = cleanString(pendingSnap.data()?.[field], 300);
        if (path && path.startsWith(`customerUploads/${uid}/`) && !path.includes('..')) result[field] = path;
        return result;
    }, {});

    // A legacy record is linked only after the account owner verified control of the same email.
    let legacy: QueryDocumentSnapshot<DocumentData> | undefined;
    if (request.auth?.token.email_verified === true) {
        const matches = await db.collection('customers').where('email', '==', email).limit(2).get();
        if (matches.size > 1) throw new HttpsError('failed-precondition', 'Hay varias cuentas antiguas con este correo. Contacta a BRIZ para verificarlas.');
        legacy = matches.docs[0];
    }
    if (legacy) {
        const old = legacy.data();
        const linkedProfile = {
            id: uid,
            authUid: uid,
            email,
            name: cleanString(old.name, 120) || profileInput.name,
            phone: cleanString(old.phone, 40) || profileInput.phone,
            ci: cleanString(old.ci, 40) || profileInput.ci,
            nacionalidad: cleanString(old.nacionalidad, 80),
            departamento: cleanString(old.departamento, 80),
            comoNosConociste: cleanString(old.comoNosConociste, 80),
            legacyCustomerId: legacy.id,
            rentalsCount: Number(old.rentalsCount) || 0,
            purchasesCount: Number(old.purchasesCount) || 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        await db.runTransaction(async (tx) => {
            const latest = await tx.get(profileRef);
            if (latest.exists) return;
            tx.create(profileRef, linkedProfile);
            if (Object.keys(privatePaths).length) tx.set(db.doc(`customerPrivate/${uid}`), { ...privatePaths, updatedAt: FieldValue.serverTimestamp() });
            tx.update(legacy!.ref, {
                authUid: uid,
                password: FieldValue.delete(),
                linkedAt: FieldValue.serverTimestamp(),
            });
            tx.delete(pendingRef);
        });
        const saved = await profileRef.get();
        return { profile: saved.data(), linkedLegacyAccount: true };
    }

    const newProfile = {
        id: uid,
        authUid: uid,
        email,
        ...profileInput,
        rentalsCount: 0,
        purchasesCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    await db.runTransaction(async (tx) => {
        const latestProfile = await tx.get(profileRef);
        const latestPending = await tx.get(pendingRef);
        if (latestProfile.exists) return;
        if (!latestPending.exists) throw new HttpsError('failed-precondition', 'El registro expiró.');
        tx.create(profileRef, newProfile);
        tx.set(db.doc(`customers/${uid}`), {
            id: uid, authUid: uid, email, ...profileInput,
            rentalsCount: 0, purchasesCount: 0,
            firstVisit: new Date().toISOString(), lastVisit: new Date().toISOString(), notes: '',
            createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        });
        if (Object.keys(privatePaths).length) tx.set(db.doc(`customerPrivate/${uid}`), { ...privatePaths, updatedAt: FieldValue.serverTimestamp() });
        tx.delete(pendingRef);
    });
    return { profile: newProfile, linkedLegacyAccount: false };
});

export const beginCustomerRegistration = onCall(callable(), async (request) => {
    const { uid, email } = requireAuth(request);
    if (!email) throw new HttpsError('failed-precondition', 'La cuenta necesita un correo electrónico.');
    const profile = validateProfile(request.data);
    const privatePaths = ['autofotoPath', 'documentoPath', 'documentoReversoPath'].reduce<Record<string, string>>((result, field) => {
        const path = cleanString((request.data as Record<string, unknown>)[field], 300);
        if (path) {
            if (!path.startsWith(`customerUploads/${uid}/`) || path.includes('..')) {
                throw new HttpsError('invalid-argument', 'La ruta del archivo no corresponde a esta cuenta.');
            }
            result[field] = path;
        }
        return result;
    }, {});
    await db.doc(`pendingCustomerRegistrations/${uid}`).set({
        ...profile,
        ...privatePaths,
        email,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, verificationRequired: true };
});

export const getMyRentals = onCall(callable(), async (request) => {
    const { uid, email } = requireAuth(request, true);
    const profile = (await db.doc(`customerProfiles/${uid}`).get()).data();
    const legacyCustomerId = cleanString(profile?.legacyCustomerId, 120);
    const legacyRecord = legacyCustomerId ? (await db.doc(`customers/${legacyCustomerId}`).get()).data() : undefined;
    const emails = [...new Set([email, cleanString(legacyRecord?.email, 200)].filter(Boolean))];
    const queries = [db.collection('rentals').where('customerUid', '==', uid).limit(100).get()];
    emails.forEach((value) => queries.push(db.collection('rentals').where('customerEmail', '==', value).limit(100).get()));
    if (legacyCustomerId) queries.push(db.collection('rentals').where('customerId', '==', legacyCustomerId).limit(100).get());
    const results = await Promise.all(queries);
    const docs = new Map<string, QueryDocumentSnapshot<DocumentData>>();
    results.flatMap((result) => result.docs).forEach((snapshot) => docs.set(snapshot.id, snapshot));
    return { rentals: [...docs.values()].map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })) };
});

export const getAdminCustomers = onCall(callable(), async (request) => {
    const { uid } = requireAuth(request);
    const roleSnap = await db.doc(`adminUsers/${uid}`).get();
    const role = roleSnap.data();
    if (!roleSnap.exists || role?.active !== true || !['admin', 'manager'].includes(String(role.role))) {
        throw new HttpsError('permission-denied', 'No tienes permiso para consultar clientes.');
    }
    const cursor = exactObject(request.data) ? cleanString(request.data.cursor, 150) : '';
    let query = db.collection('customers').orderBy(FieldPath.documentId()).limit(200);
    if (role.role !== 'admin' && role.store !== 'all') query = query.where('store', '==', role.store).orderBy(FieldPath.documentId()).limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    const customers = page.docs.map((snapshot) => {
        const data = snapshot.data();
        for (const field of ['password', 'passwordHash', 'autofotoUrl', 'documentoUrl', 'documentoReversoUrl', 'autofotoPath', 'documentoPath', 'documentoReversoPath']) delete data[field];
        return { ...data, id: snapshot.id };
    });
    return { customers, nextCursor: page.size === 200 ? page.docs.at(-1)?.id || null : null };
});

export const createRentalGroup = onCall(callable(), async (request) => {
    const { uid, email } = requireAuth(request, true);
    if (!exactObject(request.data)) throw new HttpsError('invalid-argument', 'Solicitud inválida.');
    const adminManual = request.data.adminManual === true;
    const actorRoleRef = db.doc(`adminUsers/${uid}`);
    const actorRoleSnap = adminManual ? await actorRoleRef.get() : null;
    const actorRole = actorRoleSnap?.data();
    if (adminManual && (!actorRoleSnap?.exists || actorRole?.active !== true || !['admin', 'manager'].includes(String(actorRole.role)))) {
        throw new HttpsError('permission-denied', 'Solo un administrador o manager puede registrar alquileres manuales.');
    }
    const manualInput = adminManual && exactObject(request.data.adminCustomer) ? request.data.adminCustomer : null;
    if (adminManual && !manualInput) throw new HttpsError('invalid-argument', 'Selecciona un cliente para el alquiler.');
    const newManualCustomer = Boolean(manualInput && !cleanString(manualInput.id, 120));
    const manualCustomerRef = manualInput
        ? db.doc(`customers/${newManualCustomer ? db.collection('customers').doc().id : cleanString(manualInput.id, 120)}`)
        : null;
    const manualProfile = newManualCustomer && manualInput
        ? { ...validateProfile(manualInput), email: cleanString(manualInput.email, 200).toLowerCase() }
        : null;
    const manualNotes = adminManual ? cleanString(request.data.adminNotes, 1000) : '';
    const manualPaymentStatus = adminManual && request.data.adminPaymentStatus === 'paid' ? 'paid' : undefined;
    const manualDelivery = adminManual && request.data.adminDeliveryService === true;
    const manualPickup = adminManual && request.data.adminPickupService === true;
    const manualMapsLink = adminManual && typeof request.data.adminMapsLink === 'string'
        && /^https:\/\/www\.google\.com\/maps\//.test(request.data.adminMapsLink)
        ? cleanString(request.data.adminMapsLink, 500) : '';
    const input = validateBooking(request.data);
    const payloadFingerprint = digest(JSON.stringify({
        booking: { ...input, idempotencyKey: undefined },
        adminManual,
        adminCustomerId: newManualCustomer ? '' : manualCustomerRef?.id || '',
        manualProfile,
        manualNotes,
        manualPaymentStatus,
        manualDelivery,
        manualPickup,
        manualMapsLink,
    }));
    const idempotencyRef = db.doc(`_reservationRequests/${digest(`${uid}:${input.idempotencyKey}`)}`);
    const profileRef = db.doc(`customerProfiles/${uid}`);
    const counterRef = db.doc('settings/rental_counter');
    const currentYear = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/La_Paz', year: 'numeric' }).format(new Date()));
    const window: RentalLike = {
        productType: 'single', productId: 'srv_request', quantity: 1, status: 'pending',
        date: input.date, pickupTime: input.pickupTime, endTime: input.endTime, duration: input.duration,
    };
    const interval = getRentalWindow(window);
    const idempotencyDoc = await idempotencyRef.get();
    if (idempotencyDoc.exists) {
        const old = idempotencyDoc.data()!;
        if (old.payloadFingerprint !== payloadFingerprint) {
            throw new HttpsError('already-exists', 'Esta solicitud ya fue utilizada con otro contenido. Actualiza la página e inténtalo nuevamente.');
        }
        return { reservationCode: old.reservationCode, rentalIds: Array.isArray(old.rentalIds) ? old.rentalIds : [], total: old.total, duplicate: true };
    }
    const rateRef = db.doc(`_requestLimits/reservations_${digest(uid)}`);
    const directItemIds = new Set<string>();
    const comboIds = new Set<string>();
    input.lines.forEach((line) => line.productType === 'combo' ? comboIds.add(line.productId) : directItemIds.add(line.productId));
    input.accessories?.forEach((item) => directItemIds.add(item.itemId));

    const result = await db.runTransaction(async (tx) => {
        let transactionRole: DocumentData | undefined;
        const [profileSnap, idemSnap, rateSnap, counterSnap, inventorySnap, comboSnap, allRentalSnap, codeSnap] = await Promise.all([
            tx.get(profileRef), tx.get(idempotencyRef), tx.get(rateRef), tx.get(counterRef),
            tx.get(db.collection('inventory')), tx.get(db.collection('combos')),
            tx.get(db.collection('rentals').where('status', 'in', ACTIVE_STATUSES)),
            tx.get(db.collection('rentals').where('reservationCode', '>=', `BRIZ-${currentYear}-`).where('reservationCode', '<', `BRIZ-${currentYear}-\uf8ff`)),
        ]);
        let adminCustomerSnap: DocumentSnapshot<DocumentData> | null = null;
        if (adminManual) {
            const roleSnap = await tx.get(actorRoleRef);
            if (!roleSnap.exists || roleSnap.data()?.active !== true || !['admin', 'manager'].includes(String(roleSnap.data()?.role))) {
                throw new HttpsError('permission-denied', 'Tu rol ya no permite registrar alquileres manuales.');
            }
            transactionRole = roleSnap.data();
            if (manualCustomerRef) adminCustomerSnap = await tx.get(manualCustomerRef);
            if (!newManualCustomer && !adminCustomerSnap?.exists) throw new HttpsError('not-found', 'No se encontró el cliente seleccionado.');
            const customerStore = String(adminCustomerSnap?.data()?.store || '');
            if (roleSnap.data()?.role === 'manager' && roleSnap.data()?.store !== 'all'
                && customerStore !== roleSnap.data()?.store) {
                throw new HttpsError('permission-denied', 'El cliente pertenece a otra tienda.');
            }
        } else {
            if (!profileSnap.exists) throw new HttpsError('failed-precondition', 'Completa el registro del cliente antes de reservar.');
            const profile = profileSnap.data()!;
            if (profile.authUid !== uid) throw new HttpsError('permission-denied', 'La cuenta del cliente no está autorizada.');
        }
        if (idemSnap.exists) {
            const old = idemSnap.data()!;
            if (old.payloadFingerprint !== payloadFingerprint) throw new HttpsError('already-exists', 'La clave de solicitud ya se usó para otra reserva.');
            return { reservationCode: old.reservationCode as string, rentalIds: Array.isArray(old.rentalIds) ? old.rentalIds as string[] : [], total: old.total as number, duplicate: true };
        }
        const limitData = rateSnap.data() || {};
        const windowStart = Math.floor(Date.now() / 60_000);
        const count = limitData.windowStart === windowStart ? Number(limitData.count) || 0 : 0;
        if (count >= 5) throw new HttpsError('resource-exhausted', 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.');

        const inventory = inventorySnap.docs.map((item) => ({ id: item.id, ...item.data() } as CatalogItem));
        const combos = comboSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Combo));
        const inventoryById = new Map(inventory.map((item) => [item.id, item]));
        const comboById = new Map(combos.map((item) => [item.id, item]));
        if (adminManual && transactionRole?.role === 'manager' && transactionRole.store !== 'all') {
            const productStoreIds = [
                ...input.lines.map((line) => line.productType === 'combo' ? comboById.get(line.productId)?.store : inventoryById.get(line.productId)?.store),
                ...(input.accessories || []).map((accessory) => inventoryById.get(accessory.itemId)?.store),
            ];
            if (productStoreIds.some((store) => store && store !== transactionRole?.store)) {
                throw new HttpsError('permission-denied', 'El inventario pertenece a otra tienda.');
            }
        }
        for (const line of input.lines) {
            if (line.productType === 'combo') {
                const combo = comboById.get(line.productId);
                if (!combo || !combo.active || !combo.availableForRental) throw new HttpsError('failed-precondition', 'Uno de los combos ya no está disponible.');
                if (!combo.components.length) throw new HttpsError('failed-precondition', 'El combo no tiene componentes configurados.');
                const componentIds = new Set(combo.components.map((component) => component.inventoryItemId));
                const selections = line.componentSelections || [];
                if (selections.some((selection) => !componentIds.has(selection.inventoryItemId))
                    || new Set(selections.map((selection) => selection.inventoryItemId)).size !== selections.length) {
                    throw new HttpsError('invalid-argument', 'Las selecciones no coinciden con los componentes del combo.');
                }
                for (const component of combo.components) {
                    const componentItem = inventoryById.get(component.inventoryItemId);
                    const selectedWheel = selections.find((selection) => selection.inventoryItemId === component.inventoryItemId)?.wheelSize || line.wheelSize;
                    if (!componentItem || !componentItem.active || !componentItem.availableForRental) {
                        throw new HttpsError('failed-precondition', 'Un componente del combo ya no está disponible.');
                    }
                    if ((component.requiresWheelSize || componentItem.hasWheelSizes)
                        && componentItem.hasWheelSizes
                        && componentItem.wheelSizes && componentItem.wheelSizes.length > 1
                        && !selectedWheel) {
                        throw new HttpsError('invalid-argument', 'Selecciona el aro para los componentes del combo.');
                    }
                    if (selectedWheel && componentItem.hasWheelSizes
                        && !componentItem.wheelSizes?.some((wheel) => wheel.size === selectedWheel)) {
                        throw new HttpsError('invalid-argument', 'El aro seleccionado no está disponible en un componente del combo.');
                    }
                }
            } else {
                const item = inventoryById.get(line.productId);
                if (!item || !item.active || !item.availableForRental || item.itemType === 'accessory') throw new HttpsError('failed-precondition', 'Uno de los productos ya no está disponible para alquiler.');
                if (item.hasWheelSizes && (!line.wheelSize || !item.wheelSizes?.some((wheel) => wheel.size === line.wheelSize))) {
                    throw new HttpsError('invalid-argument', 'Selecciona un aro disponible para cada bicicleta.');
                }
            }
        }
        for (const accessory of input.accessories || []) {
            const item = inventoryById.get(accessory.itemId);
            if (!item || !item.active || !item.availableForRental || item.itemType !== 'accessory') throw new HttpsError('failed-precondition', 'Uno de los accesorios ya no está disponible.');
        }

        const rentalLines: Array<Record<string, unknown>> = [];
        const requestedDemands: Demand[] = [];
        let bikes = 0;
        let subtotal = 0;
        for (const line of input.lines) {
            const product = line.productType === 'combo' ? comboById.get(line.productId) : inventoryById.get(line.productId);
            const lineTotal = sumLinePrice(product, input.duration, line.quantity);
            const combo = line.productType === 'combo' ? comboById.get(line.productId) : undefined;
            const componentSelections = combo?.components.map((component) => {
                const componentItem = inventoryById.get(component.inventoryItemId);
                const needsWheel = component.requiresWheelSize || Boolean(componentItem?.hasWheelSizes);
                const selectedWheel = line.componentSelections?.find((selection) => selection.inventoryItemId === component.inventoryItemId)?.wheelSize || line.wheelSize;
                return { inventoryItemId: component.inventoryItemId, ...(needsWheel && selectedWheel ? { wheelSize: selectedWheel } : {}) };
            });
            const rental = {
                productType: line.productType,
                productId: line.productId,
                quantity: line.quantity,
                ...(line.wheelSize ? { selectedWheelSize: line.wheelSize } : {}),
                ...(componentSelections ? { componentSelections } : {}),
            };
            requestedDemands.push(...rentalDemands({ ...rental, selectedAccessories: [] }, inventory, combos));
            rentalLines.push({ ...rental, productName: product!.name, productNameSnapshot: product!.name, total: lineTotal });
            subtotal += lineTotal;
            if (line.productType === 'combo' || inventoryById.get(line.productId)?.itemType === 'bike') bikes += line.quantity;
        }
        for (const accessory of input.accessories || []) {
            const item = inventoryById.get(accessory.itemId)!;
            const lineTotal = accessoryUnitPrice(item, input.duration) * accessory.quantity;
            requestedDemands.push({ itemId: item.id, quantity: accessory.quantity });
            rentalLines.push({
                productType: 'single', productId: item.id, productName: item.name,
                productNameSnapshot: item.name, quantity: accessory.quantity,
                selectedWheelSize: '', total: lineTotal, notes: 'Accesorio adicional de alquiler',
            });
            subtotal += lineTotal;
        }
        const deliveryZone = input.transport && isInsideDeliveryZone(input.transport.lat, input.transport.lng);
        const transportFee = deliveryZone ? shippingFee(bikes) : 0;
        if (input.transport?.delivery) {
            rentalLines.push({ productType: 'single', productId: 'srv_delivery', productName: 'Servicio de entrega', productNameSnapshot: 'Servicio de entrega', quantity: 1, selectedWheelSize: '', total: transportFee, deliveryService: true });
            subtotal += transportFee;
        }
        if (input.transport?.pickup) {
            rentalLines.push({ productType: 'single', productId: 'srv_pickup', productName: 'Servicio de recojo', productNameSnapshot: 'Servicio de recojo', quantity: 1, selectedWheelSize: '', total: transportFee, pickupService: true });
            subtotal += transportFee;
        }
        const discountRate = ['BRIZ10', 'DESCUENTO'].includes(input.discountCode || '') ? 0.1 : 0;
        if (input.discountCode && !discountRate) throw new HttpsError('invalid-argument', 'El código de descuento no es válido.');
        const total = Number((subtotal * (1 - discountRate)).toFixed(2));
        if (discountRate) rentalLines.forEach((line) => { line.total = Number((Number(line.total) * 0.9).toFixed(2)); });

        const requestedByKey = mergeDemandsByResource(aggregateDemands(requestedDemands));
        // Touch one lock document per physical inventory resource. Concurrent
        // bookings that share a bike/component/accessory are serialized here.
        const lockRefs = [...requestedByKey.keys()].map((key) => db.doc(`_availabilityLocks/${key}`));
        const lockSnaps = await Promise.all(lockRefs.map((reference) => tx.get(reference)));
        // All current and future reservations still participate, including legacy documents.
        const existing = allRentalSnap.docs.map(normalizeLegacyRental).filter((rental): rental is RentalLike => rental !== null);
        const reqStart = interval.startMs;
        const reqEnd = interval.endMs;
        const todayStart = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date()) + 'T00:00:00-04:00').getTime();
        const requestIsToday = reqStart < todayStart + 86_400_000;
        const existingDemands = existing.map((rental) => ({ rental, demands: rentalDemands(rental, inventory, combos) }));
        for (const demand of aggregateDemands(requestedDemands)) {
            const item = inventoryById.get(demand.itemId);
            if (!item) throw new HttpsError('failed-precondition', 'No se pudo verificar el inventario.');
            const relevant = existingDemands.flatMap(({ rental, demands }) => {
                const match = demands.find((value) => value.itemId === demand.itemId
                    && (value.wheelSize || '') === (demand.wheelSize || ''));
                if (!match) return [];
                return [{ rental, demand: match }];
            });
            const heldUnits = relevant.filter(({ rental }) => isHolding(rental.status)).reduce((sum, entry) => sum + entry.demand.quantity, 0);
            const overlappingUnits = relevant.filter(({ rental }) => {
                if (!isBlocking(rental.status)) return false;
                let existingWindow: { startMs: number; endMs: number };
                try { existingWindow = getRentalWindow(rental); } catch { return true; }
                const overlaps = existingWindow.startMs < reqEnd && reqStart < existingWindow.endMs;
                const overdueStillOut = isHolding(rental.status) && requestIsToday && existingWindow.endMs <= reqStart;
                return overlaps || overdueStillOut;
            }).reduce((sum, entry) => sum + entry.demand.quantity, 0);
            const available = Math.max(0, stockFor(item, demand.wheelSize) + heldUnits - overlappingUnits);
            if (demand.quantity > available) {
                throw new HttpsError('failed-precondition', `${item.name}${demand.wheelSize ? ` aro ${demand.wheelSize}` : ''}: solo quedan ${available} unidad(es) para ese horario.`);
            }
        }

        let legacyMax = 0;
        codeSnap.docs.forEach((snapshot) => {
            const code = String(snapshot.data().reservationCode || '');
            const seq = Number(code.split('-').at(-1));
            if (Number.isSafeInteger(seq)) legacyMax = Math.max(legacyMax, seq);
        });
        const counterData = counterSnap.data() || {};
        const storedSeq = Number(counterData.year) === currentYear ? Number(counterData.seq) || 0 : 0;
        const seq = Math.max(storedSeq, legacyMax) + 1;
        const reservationCode = `BRIZ-${currentYear}-${String(seq).padStart(4, '0')}`;
        const now = Timestamp.now();
        const manualCustomerData = adminManual
            ? (newManualCustomer ? manualProfile : adminCustomerSnap!.data())!
            : profileSnap.data()!;
        const customerFields = {
            customerUid: adminManual ? '' : uid,
            customerId: adminManual ? manualCustomerRef!.id : cleanString((manualCustomerData as Record<string, unknown>).legacyCustomerId, 120) || uid,
            customerName: cleanString(manualCustomerData.name, 120),
            customerPhone: cleanString(manualCustomerData.phone, 40),
            customerCI: cleanString(manualCustomerData.ci, 40),
            customerEmail: adminManual ? cleanString((manualCustomerData as Record<string, unknown>).email, 200).toLowerCase() : email,
        };
        const availabilityGroupId = digest(`${uid}:${input.idempotencyKey}`);
        const groupDocs = rentalLines.map((line, index) => {
            const id = `${reservationCode}_${String(index + 1).padStart(2, '0')}`;
            const product = line.productType === 'combo' ? comboById.get(String(line.productId)) : inventoryById.get(String(line.productId));
            const notes = [line.notes, input.transport?.address ? `Dirección: ${input.transport.address}` : '', manualNotes ? `[Manual] ${manualNotes}` : '', discountRate ? 'Descuento aplicado: 10%' : ''].filter(Boolean).join(' ');
            return {
                id,
                reservationCode,
                availabilityGroupId,
                ...customerFields,
                ...line,
                productName: String(line.productName || ''),
                productNameSnapshot: String(line.productNameSnapshot || ''),
                ...(product?.store ? { store: product.store } : transactionRole?.role === 'manager' && transactionRole.store !== 'all' ? { store: transactionRole.store } : {}),
                duration: input.duration,
                date: input.date,
                pickupTime: input.pickupTime,
                endTime: input.endTime || '',
                startTimestamp: reqStart,
                endTimestamp: reqEnd,
                quantity: Number(line.quantity),
                total: Number(line.total),
                paymentMethod: input.paymentMethod,
                paymentStatus: manualPaymentStatus || (input.paymentMethod === 'QR' || input.paymentMethod === 'Transferencia' ? 'pending_review' : 'unpaid'),
                status: 'pending',
                source: adminManual ? 'manual' : 'web',
                ...(adminManual ? { createdBy: uid, deliveryService: manualDelivery, pickupService: manualPickup, ...(manualMapsLink ? { mapsLink: manualMapsLink } : {}) } : {}),
                notes,
                ...(input.transport ? { deliveryService: input.transport.delivery, pickupService: input.transport.pickup,
                    mapsLink: `https://www.google.com/maps/?q=${input.transport.lat},${input.transport.lng}` } : {}),
                createdAt: now.toDate().toISOString(),
                createdDate: now.toDate().toISOString(),
                updatedAt: now.toDate().toISOString(),
                stockDeducted: false,
            };
        });
        if (groupDocs.length > 450) throw new HttpsError('invalid-argument', 'La reserva contiene demasiados elementos.');
        tx.set(counterRef, { year: currentYear, seq, updatedAt: now.toDate().toISOString() });
        const rentalIds = groupDocs.map((rental) => String(rental.id));
        tx.set(idempotencyRef, { uid, payloadFingerprint, reservationCode, total, rentalIds, createdAt: now });
        tx.set(rateRef, { windowStart, count: count + 1, updatedAt: now });
        if (adminManual && newManualCustomer && manualCustomerRef) {
            tx.create(manualCustomerRef, {
                id: manualCustomerRef.id,
                ...manualProfile,
                ...(transactionRole?.role === 'manager' && transactionRole.store !== 'all' ? { store: transactionRole.store } : {}),
                rentalsCount: 1, purchasesCount: 0,
                firstVisit: now.toDate().toISOString(), lastVisit: now.toDate().toISOString(),
                notes: 'Registrado manualmente en alquiler administrativo',
                createdAt: now, updatedAt: now,
            });
        } else if (adminManual && manualCustomerRef) {
            tx.update(manualCustomerRef, { rentalsCount: FieldValue.increment(1), lastVisit: now.toDate().toISOString() });
        }
        lockRefs.forEach((reference, index) => tx.set(reference, {
            revision: (Number(lockSnaps[index].data()?.revision) || 0) + 1,
            updatedAt: now,
        }));
        groupDocs.forEach((rental) => tx.create(db.doc(`rentals/${rental.id}`), rental));
        const outboxRef = db.doc(`telegramOutbox/${digest(`${uid}:${input.idempotencyKey}`)}`);
        tx.create(outboxRef, {
            reservationCode,
            status: 'pending',
            attemptCount: 0,
            createdAt: now,
            payload: {
                total,
                customerName: customerFields.customerName,
                customerPhone: customerFields.customerPhone,
                customerCI: customerFields.customerCI,
                date: input.date,
                pickupTime: input.pickupTime,
                duration: input.duration,
                paymentMethod: input.paymentMethod,
                items: groupDocs.map((rental) => ({ name: rental.productNameSnapshot, quantity: rental.quantity, total: rental.total, notes: rental.notes })),
            },
        });
        // The public projection contains only the resource, interval, quantity and status.
        aggregateDemands(requestedDemands).forEach((demand, index) => {
            const slotId = digest(`${reservationCode}:${index}:${resourceKey(demand)}`);
            tx.create(db.doc(`rentals_busy_slots/${slotId}`), {
                resourceKey: resourceKey(demand),
                availabilityGroupId,
                itemId: demand.itemId,
                ...(demand.wheelSize ? { wheelSize: demand.wheelSize } : {}),
                quantity: demand.quantity,
                startMs: reqStart,
                endMs: reqEnd,
                status: 'pending',
            });
        });
        return { reservationCode, total, rentalIds, duplicate: false };
    });
    return result;
});

export const syncRentalAvailabilityProjection = onDocumentWritten('rentals/{rentalId}', async (event) => {
    const groupId = String(event.data?.after.data()?.availabilityGroupId || event.data?.before.data()?.availabilityGroupId || '');
    if (!groupId) return; // Historical rows need a controlled, read-only audit before projection.
    const lockRef = db.doc(`_projectionLocks/${groupId}`);
    await db.runTransaction(async (tx) => {
        const [lockSnap, rentalsSnap, inventorySnap, combosSnap, slotsSnap] = await Promise.all([
            tx.get(lockRef),
            tx.get(db.collection('rentals').where('availabilityGroupId', '==', groupId)),
            tx.get(db.collection('inventory')),
            tx.get(db.collection('combos')),
            tx.get(db.collection('rentals_busy_slots').where('availabilityGroupId', '==', groupId)),
        ]);
        const active = rentalsSnap.docs.map((rental) => rental.data()).filter((rental) => isBlocking(String(rental.status || '')));
        const inventory = inventorySnap.docs.map((item) => ({ id: item.id, ...item.data() } as CatalogItem));
        const combos = combosSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Combo));
        const aggregated = aggregateDemands(active.flatMap((rental) => rentalDemands(rental as unknown as RentalLike, inventory, combos)));
        const now = Timestamp.now();
        const keep = new Set<string>();
        const first = active[0];
        const status = active.some((rental) => ['delivered', 'Entregado'].includes(String(rental.status)))
            ? 'delivered'
            : active.some((rental) => ['confirmed', 'Confirmado'].includes(String(rental.status))) ? 'confirmed' : 'pending';
        if (first) {
            const startMs = Number(first.startTimestamp) || getRentalWindow(first as unknown as RentalLike).startMs;
            const endMs = Number(first.endTimestamp) || getRentalWindow(first as unknown as RentalLike).endMs;
            aggregated.forEach((demand) => {
                const slotId = `${groupId}_${resourceKey(demand)}`;
                keep.add(slotId);
                tx.set(db.doc(`rentals_busy_slots/${slotId}`), {
                    availabilityGroupId: groupId,
                    resourceKey: resourceKey(demand),
                    itemId: demand.itemId,
                    ...(demand.wheelSize ? { wheelSize: demand.wheelSize } : {}),
                    quantity: demand.quantity,
                    startMs,
                    endMs,
                    status,
                    updatedAt: now,
                });
            });
        }
        slotsSnap.docs.forEach((slot) => {
            if (!keep.has(slot.id)) tx.delete(slot.ref);
        });
        tx.set(lockRef, { revision: (Number(lockSnap.data()?.revision) || 0) + 1, updatedAt: now });
    });
});

// Administrative rental mutations are deliberately server-only: the browser
// submits intent, while role, store scope, current state and stock are checked
// again inside the Firestore transaction.
type AdminRentalAction = 'confirm' | 'deliver' | 'return' | 'cancel' | 'expire' | 'payment';
const LEGACY_PENDING = ['pending', 'Pendiente'];
const LEGACY_CONFIRMED = ['confirmed', 'Confirmado'];
const LEGACY_DELIVERED = ['delivered', 'Entregado'];

function requireRentalAdmin(role: DocumentData | undefined): void {
    if (!role || role.active !== true || !['admin', 'manager'].includes(String(role.role))) {
        throw new HttpsError('permission-denied', 'Se requiere el rol de administrador o manager.');
    }
}

function rentalLinesDemands(rows: DocumentData[], inventory: CatalogItem[], combos: Combo[]): Demand[] {
    return aggregateDemands(rows.flatMap((row) => rentalDemands({
        productType: row.productType === 'combo' ? 'combo' : 'single', productId: String(row.productId || ''),
        quantity: Number(row.quantity) || 0, selectedWheelSize: row.selectedWheelSize,
        componentSelections: Array.isArray(row.componentSelections) ? row.componentSelections : undefined,
        selectedAccessories: Array.isArray(row.selectedAccessories) ? row.selectedAccessories : undefined,
    }, inventory, combos)));
}

function assertComboSelections(rows: DocumentData[], inventory: CatalogItem[], combos: Combo[]): void {
    const inventoryById = new Map(inventory.map((item) => [item.id, item]));
    const combosById = new Map(combos.map((combo) => [combo.id, combo]));
    for (const row of rows) {
        if (row.productType !== 'combo') continue;
        const combo = combosById.get(String(row.productId));
        if (!combo) throw new HttpsError('failed-precondition', `No se puede validar el combo histórico ${String(row.productName || row.productId)}.`);
        for (const component of combo.components) {
            const item = inventoryById.get(component.inventoryItemId);
            if (!item?.hasWheelSizes || (item.wheelSizes || []).length < 2) continue;
            const selection = Array.isArray(row.componentSelections) ? row.componentSelections.find((entry: { inventoryItemId?: string }) => entry.inventoryItemId === component.inventoryItemId) : undefined;
            const wheelSize = selection?.wheelSize || (combo.components.length === 1 ? row.selectedWheelSize : undefined);
            if (!wheelSize || !item.wheelSizes?.some((wheel) => wheel.size === wheelSize)) {
                throw new HttpsError('failed-precondition', `El alquiler histórico no identifica el aro del componente ${item.name}; requiere revisión antes de cambiar stock.`);
            }
        }
    }
}

function alterStock(item: CatalogItem, wheelSize: string | undefined, delta: number): CatalogItem {
    const next = structuredClone(item);
    if (next.hasWheelSizes && next.wheelSizes?.length) {
        const idx = next.wheelSizes.findIndex((wheel) => wheel.size === (wheelSize || (next.wheelSizes?.length === 1 ? next.wheelSizes[0].size : '')));
        if (idx < 0) throw new HttpsError('failed-precondition', `Selecciona un aro válido para ${next.name}.`);
        const stock = Number(next.wheelSizes[idx].stock) || 0;
        if (stock + delta < 0) throw new HttpsError('failed-precondition', `Stock insuficiente para ${next.name} aro ${next.wheelSizes[idx].size}.`);
        next.wheelSizes[idx].stock = stock + delta;
    } else {
        const stock = Number(next.stock) || 0;
        if (stock + delta < 0) throw new HttpsError('failed-precondition', `Stock insuficiente para ${next.name}.`);
        next.stock = stock + delta;
    }
    return next;
}

function appendRentalAudit(row: DocumentData, uid: string, action: string, before: unknown, after: unknown, now: string): Record<string, unknown> {
    const history = Array.isArray(row.auditLog) ? row.auditLog.slice(-49) : [];
    return { auditLog: [...history, { action, actorUid: uid, at: now, before, after }] };
}

export const adminRentalAction = onCall(callable(), async (request) => {
    const { uid } = requireAuth(request);
    if (!exactObject(request.data)) throw new HttpsError('invalid-argument', 'Solicitud inválida.');
    const action = String(request.data.action) as AdminRentalAction;
    if (!['confirm', 'deliver', 'return', 'cancel', 'expire', 'payment'].includes(action)) throw new HttpsError('invalid-argument', 'Acción inválida.');
    const ids = Array.isArray(request.data.rentalIds) ? [...new Set(request.data.rentalIds.map((id) => cleanString(id, 150)).filter(Boolean))] : [];
    if (!ids.length || ids.length > 100) throw new HttpsError('invalid-argument', 'El grupo de alquiler no es válido.');
    const roleRef = db.doc(`adminUsers/${uid}`);
    await db.runTransaction(async (tx) => {
        const roleSnap = await tx.get(roleRef);
        const rentalSnaps = await Promise.all(ids.map((id) => tx.get(db.doc(`rentals/${id}`))));
        const role = roleSnap.data();
        requireRentalAdmin(role);
        const refs = rentalSnaps.filter((snap) => snap.exists).map((snap) => snap.ref);
        const rows: DocumentData[] = rentalSnaps.filter((snap) => snap.exists).map((snap) => ({ ...snap.data()!, id: snap.id } as DocumentData));
        if (!rows.length || rows.length !== ids.length) throw new HttpsError('not-found', 'No se encontró el grupo completo.');
        if (new Set(rows.map((row) => String(row.reservationCode || row.id))).size !== 1) throw new HttpsError('failed-precondition', 'La operación debe incluir líneas de un solo pedido.');
        if (role?.role === 'manager' && role.store !== 'all' && rows.some((row) => !row.store || row.store !== role.store)) {
            throw new HttpsError('permission-denied', 'El alquiler pertenece a otra tienda.');
        }
        const now = new Date().toISOString();
        const target = action === 'confirm' ? 'confirmed' : action === 'deliver' ? 'delivered' : action === 'return' ? 'returned'
            : action === 'cancel' ? 'cancelled' : action === 'expire' ? 'expired' : '';
        if (action === 'payment') {
            const paymentStatus = String(request.data.paymentStatus);
            if (!['paid', 'unpaid', 'pending_review'].includes(paymentStatus)) throw new HttpsError('invalid-argument', 'Estado de pago inválido.');
            rows.forEach((row, index) => tx.update(refs[index], {
                paymentStatus, updatedAt: now, lastUpdatedBy: uid,
                ...appendRentalAudit(row, uid, 'payment', row.paymentStatus || 'unpaid', paymentStatus, now),
            } as DocumentData));
            return;
        }
        const allowed = action === 'confirm' ? rows.every((row) => LEGACY_PENDING.includes(String(row.status)))
            : action === 'deliver' ? rows.every((row) => LEGACY_CONFIRMED.includes(String(row.status)))
            : action === 'return' ? rows.every((row) => LEGACY_DELIVERED.includes(String(row.status)))
            : action === 'expire' ? rows.every((row) => LEGACY_PENDING.includes(String(row.status)))
            : rows.every((row) => LEGACY_PENDING.includes(String(row.status)) || LEGACY_CONFIRMED.includes(String(row.status)));
        if (!allowed) throw new HttpsError('failed-precondition', 'La acción no es válida para el estado actual del grupo.');
        const inventorySnap = await tx.get(db.collection('inventory'));
        const comboSnap = await tx.get(db.collection('combos'));
        const activeRentalsSnap = action === 'confirm' ? await tx.get(db.collection('rentals').where('status', 'in', ACTIVE_STATUSES)) : null;
        const inventory = inventorySnap.docs.map((snap) => ({ id: snap.id, ...snap.data() } as CatalogItem));
        const combos = comboSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() } as Combo));
        assertComboSelections(rows, inventory, combos);
        const invMap = new Map(inventory.map((item) => [item.id, item]));
        const demands = rentalLinesDemands(rows, inventory, combos);
        const maintenanceTouched = new Set<string>();
        if (action === 'confirm' && activeRentalsSnap) {
            const currentIds = new Set(rows.map((row) => String(row.id)));
            const otherRows = activeRentalsSnap.docs.filter((snap) => !currentIds.has(snap.id)).map((snap) => snap.data()).filter((row) => isBlocking(String(row.status || '')));
            for (const requested of demands) {
                const item = invMap.get(requested.itemId);
                if (!item) throw new HttpsError('failed-precondition', `No existe el inventario ${requested.itemId}.`);
                const relevant = otherRows.flatMap((row) => rentalDemands(row as unknown as RentalLike, inventory, combos)
                    .filter((demand) => demand.itemId === requested.itemId && (demand.wheelSize || '') === (requested.wheelSize || ''))
                    .map((demand) => ({ row, demand })));
                const held = relevant.filter(({ row }) => isHolding(String(row.status))).reduce((sum, entry) => sum + entry.demand.quantity, 0);
                let interval: { startMs: number; endMs: number };
                try { interval = getRentalWindow(rows[0] as unknown as RentalLike); }
                catch { throw new HttpsError('failed-precondition', 'La fecha u horario del grupo no se pueden validar.'); }
                if (interval.startMs < Date.now()) throw new HttpsError('failed-precondition', 'No se puede confirmar un alquiler con fecha u hora ya vencida.');
                const todayStart = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date()) + 'T00:00:00-04:00').getTime();
                const overlap = relevant.filter(({ row }) => {
                    try {
                        const window = getRentalWindow(row as unknown as RentalLike);
                        return window.startMs < interval.endMs && interval.startMs < window.endMs
                            || isHolding(String(row.status)) && interval.startMs < todayStart + 86_400_000 && window.endMs <= interval.startMs;
                    } catch { return true; }
                }).reduce((sum, entry) => sum + entry.demand.quantity, 0);
                const available = Math.max(0, stockFor(item, requested.wheelSize) + held - overlap);
                if (requested.quantity > available) throw new HttpsError('failed-precondition', `${item.name}: disponibilidad insuficiente para confirmar este horario; quedan ${available}.`);
            }
        }
        const stockDelta = new Map<string, Demand>();
        const addDelta = (demand: Demand, delta: number) => {
            const key = `${demand.itemId}\0${demand.wheelSize || ''}`;
            const old = stockDelta.get(key);
            stockDelta.set(key, { ...demand, quantity: (old?.quantity || 0) + delta });
        };
        if (action === 'confirm') {
            const docsToDeduct = rows.filter((row) => row.stockDeducted !== true);
            if (docsToDeduct.length) {
                const delta = rentalLinesDemands(docsToDeduct, inventory, combos);
                delta.forEach((demand) => addDelta(demand, -demand.quantity));
            }
        } else if (action === 'cancel' || action === 'return') {
            const restoreRows = rows.filter((row) => row.stockDeducted === true || (row.stockDeducted === undefined && [...LEGACY_CONFIRMED, ...LEGACY_DELIVERED].includes(String(row.status))));
            rentalLinesDemands(restoreRows, inventory, combos).forEach((demand) => addDelta(demand, demand.quantity));
            if (action === 'return') {
                const damaged = Number(request.data.damagedUnits) || 0;
                const restoredDemands = rentalLinesDemands(restoreRows, inventory, combos);
                const bikeUnits = restoredDemands.filter((demand) => {
                    const item = invMap.get(demand.itemId);
                    return Boolean(item) && item?.itemType !== 'accessory';
                }).reduce((sum, demand) => sum + demand.quantity, 0);
                if (!Number.isInteger(damaged) || damaged < 0 || damaged > bikeUnits) throw new HttpsError('invalid-argument', 'La cantidad dañada supera las bicicletas entregadas.');
                // Damaged bikes move to maintenance; accessories and healthy units return to shelf stock.
                let remaining = damaged;
                for (const demand of restoredDemands) {
                    if (remaining <= 0) break;
                    const item = invMap.get(demand.itemId);
                    if (item?.itemType !== 'bike') continue;
                    const qty = Math.min(remaining, demand.quantity);
                    remaining -= qty;
                    const key = `${item.id}\0${String(demand.wheelSize || '')}`;
                    const prior = stockDelta.get(key);
                    if (prior) prior.quantity -= qty;
                    const updated = invMap.get(item.id)!;
                    maintenanceTouched.add(item.id);
                    if (updated.hasWheelSizes && updated.wheelSizes) {
                        const idx = updated.wheelSizes.findIndex((wheel) => wheel.size === (demand.wheelSize || updated.wheelSizes?.[0]?.size));
                        if (idx >= 0) updated.wheelSizes[idx].maintenanceStock = (updated.wheelSizes[idx].maintenanceStock || 0) + qty;
                    }
                    updated.maintenanceStock = (updated.maintenanceStock || 0) + qty;
                }
            }
        }
        for (const demand of stockDelta.values()) {
            if (!demand.quantity) continue;
            const item = invMap.get(demand.itemId);
            if (!item) throw new HttpsError('failed-precondition', `No existe el inventario ${demand.itemId}.`);
            invMap.set(item.id, alterStock(item, demand.wheelSize, demand.quantity));
        }
        for (const [itemId, item] of invMap) {
            if (maintenanceTouched.has(itemId) || [...stockDelta.values()].some((demand) => demand.itemId === itemId && demand.quantity !== 0)) {
                tx.update(db.doc(`inventory/${itemId}`), { ...(item.hasWheelSizes ? { wheelSizes: item.wheelSizes } : { stock: item.stock }), ...(typeof item.maintenanceStock === 'number' ? { maintenanceStock: item.maintenanceStock } : {}) });
            }
        }
        rows.forEach((row, index) => {
            const status = target || row.status;
            const patch: Record<string, unknown> = { status, updatedAt: now, lastUpdatedBy: uid,
                ...appendRentalAudit(row, uid, action, row.status, status, now) };
            if (action === 'confirm') patch.stockDeducted = true;
            if (action === 'cancel' || action === 'return') patch.stockDeducted = false;
            if (action === 'deliver') patch.deliveredAt = now;
            if (action === 'return') {
                patch.returnedAt = now;
                patch.returnCondition = Number(request.data.damagedUnits) > 0 ? 'damaged' : 'ok';
                patch.damagedOnReturn = Number(request.data.damagedUnits) > 0;
                patch.damagedUnits = Number(request.data.damagedUnits) || 0;
                if (request.data.conditionNotes) patch.returnConditionNotes = cleanString(request.data.conditionNotes, 500);
            }
            tx.update(refs[index], patch as DocumentData);
        });
    });
    return { ok: true };
});

export const updateRentalGroup = onCall(callable(), async (request) => {
    const { uid } = requireAuth(request);
    if (!exactObject(request.data) || !Array.isArray(request.data.items) || request.data.items.length < 1 || request.data.items.length > 30) {
        throw new HttpsError('invalid-argument', 'El pedido debe tener entre 1 y 30 líneas.');
    }
    const code = cleanString(request.data.reservationCode, 120);
    const requestedIds = Array.isArray(request.data.rentalIds) ? [...new Set(request.data.rentalIds.map((id) => cleanString(id, 150)).filter(Boolean))] : [];
    if (!code && !requestedIds.length) throw new HttpsError('invalid-argument', 'El pedido no tiene identificadores válidos.');
    const date = cleanString(request.data.date, 10);
    const pickupTime = cleanString(request.data.pickupTime, 5);
    const duration = cleanString(request.data.duration, 60);
    const interval = getRentalWindow({ productType: 'single', productId: 'srv_edit', quantity: 1, status: 'pending', date, pickupTime, duration });
    const desired = request.data.items.map((raw) => {
        if (!exactObject(raw) || !['single', 'combo'].includes(String(raw.productType)) || !Number.isInteger(raw.quantity) || Number(raw.quantity) < 1 || Number(raw.quantity) > 20) {
            throw new HttpsError('invalid-argument', 'Una línea del pedido no es válida.');
        }
        return { id: cleanString(raw.id, 150), productId: cleanString(raw.productId, 100), productType: raw.productType as 'single' | 'combo', quantity: Number(raw.quantity), selectedWheelSize: cleanString(raw.selectedWheelSize, 20) };
    });
    const roleRef = db.doc(`adminUsers/${uid}`);
    await db.runTransaction(async (tx) => {
        const roleSnap = await tx.get(roleRef);
        requireRentalAdmin(roleSnap.data());
        const role = roleSnap.data()!;
        const groupSnap = code ? await tx.get(db.collection('rentals').where('reservationCode', '==', code)) : null;
        let groupDocs: DocumentSnapshot<DocumentData>[] = groupSnap?.docs || [];
        if (!groupDocs.length && requestedIds.length) groupDocs = await Promise.all(requestedIds.map((id) => tx.get(db.doc(`rentals/${id}`)))).then((snaps) => snaps.filter((snap) => snap.exists));
        const oldRows: DocumentData[] = groupDocs.map((snap) => ({ ...snap.data(), id: snap.id } as DocumentData));
        if (!oldRows.length) throw new HttpsError('not-found', 'No se encontró el grupo que deseas editar.');
        const groupCode = String(oldRows[0].reservationCode || oldRows[0].id);
        if (oldRows.some((row) => String(row.reservationCode || row.id) !== groupCode)) throw new HttpsError('failed-precondition', 'Las líneas no pertenecen al mismo pedido.');
        if (role.role === 'manager' && role.store !== 'all' && oldRows.some((row) => !row.store || row.store !== role.store)) throw new HttpsError('permission-denied', 'No se puede validar la tienda de una línea histórica de este grupo.');
        const statuses = new Set(oldRows.map((row) => String(row.status)));
        if (statuses.size !== 1 || ![...LEGACY_PENDING, ...LEGACY_CONFIRMED, ...LEGACY_DELIVERED].includes([...statuses][0])) throw new HttpsError('failed-precondition', 'Solo se pueden editar pedidos pendientes, confirmados o entregados de forma coherente.');
        const delivered = LEGACY_DELIVERED.includes([...statuses][0]);
        if (!delivered && interval.startMs < Date.now()) throw new HttpsError('failed-precondition', 'La nueva fecha u hora del pedido debe estar en el futuro.');
        const hasPaid = oldRows.some((row) => row.paymentStatus === 'paid');
        const previousDelivery = oldRows.some((row) => row.deliveryService === true || row.productId === 'srv_delivery');
        const previousPickup = oldRows.some((row) => row.pickupService === true || row.productId === 'srv_pickup');
        if (hasPaid && (previousDelivery !== (request.data.deliveryService === true) || previousPickup !== (request.data.pickupService === true))) throw new HttpsError('failed-precondition', 'El pedido ya tiene un pago registrado. Ajusta el importe del servicio por separado.');
        if (delivered && (previousDelivery !== (request.data.deliveryService === true) || previousPickup !== (request.data.pickupService === true))) throw new HttpsError('failed-precondition', 'No se pueden cambiar entrega o recojo después de entregar el alquiler.');
        if (hasPaid && oldRows.some((row) => !desired.some((line) => line.id === String(row.id)))) throw new HttpsError('failed-precondition', 'No se pueden eliminar líneas de un pedido pagado; registra el ajuste del importe por separado.');
        if (delivered && (date !== oldRows[0].date || pickupTime !== oldRows[0].pickupTime || duration !== oldRows[0].duration)) throw new HttpsError('failed-precondition', 'No se puede cambiar fecha, hora o duración después de entregar el alquiler.');
        const [inventorySnap, comboSnap, allRentalsSnap] = await Promise.all([
            tx.get(db.collection('inventory')), tx.get(db.collection('combos')),
            tx.get(db.collection('rentals').where('status', 'in', ACTIVE_STATUSES)),
        ]);
        const inventory = inventorySnap.docs.map((snap) => ({ id: snap.id, ...snap.data() } as CatalogItem));
        const combos = comboSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() } as Combo));
        assertComboSelections(oldRows, inventory, combos);
        const inventoryById = new Map(inventory.map((item) => [item.id, item]));
        const combosById = new Map(combos.map((item) => [item.id, item]));
        const existingById = new Map(oldRows.map((row) => [String(row.id), row]));
        const nextRows: Array<{ ref: FirebaseFirestore.DocumentReference; data: DocumentData }> = [];
        for (const line of desired) {
            const existing = line.id ? existingById.get(line.id) : undefined;
            const product = line.productType === 'combo' ? combosById.get(line.productId) : inventoryById.get(line.productId);
            if (line.productId.startsWith('srv_')) {
                if (!existing || !line.id) throw new HttpsError('invalid-argument', 'No se pueden agregar servicios manuales desde la edición.');
                if (line.productId === 'srv_delivery' && request.data.deliveryService !== true) continue;
                if (line.productId === 'srv_pickup' && request.data.pickupService !== true) continue;
                nextRows.push({ ref: db.doc(`rentals/${line.id}`), data: { ...existing, date, pickupTime, duration } });
                continue;
            }
            if (!product || product.active !== true || product.availableForRental !== true) throw new HttpsError('failed-precondition', 'Uno de los productos ya no está disponible.');
            if (role.role === 'manager' && role.store !== 'all' && product.store && product.store !== role.store) throw new HttpsError('permission-denied', 'El producto pertenece a otra tienda.');
            const item = line.productType === 'single' ? inventoryById.get(line.productId) : undefined;
            if (item?.hasWheelSizes && !line.selectedWheelSize) throw new HttpsError('invalid-argument', `Selecciona el aro para ${item.name}.`);
            const combo = line.productType === 'combo' ? combosById.get(line.productId) : undefined;
            const componentSelections = combo?.components.map((component) => {
                const componentItem = inventoryById.get(component.inventoryItemId);
                if ((component.requiresWheelSize || componentItem?.hasWheelSizes) && componentItem?.hasWheelSizes && componentItem.wheelSizes && componentItem.wheelSizes.length > 1 && !line.selectedWheelSize) throw new HttpsError('invalid-argument', 'Selecciona el aro del combo.');
                return { inventoryItemId: component.inventoryItemId, ...(componentItem?.hasWheelSizes && line.selectedWheelSize ? { wheelSize: line.selectedWheelSize } : {}) };
            });
            const computed = item?.itemType === 'accessory' ? accessoryUnitPrice(item, duration) * line.quantity : sumLinePrice(product, duration, line.quantity);
            if (hasPaid && (!existing || existing.productId !== line.productId || existing.productType !== line.productType || Number(existing.quantity) !== line.quantity)) throw new HttpsError('failed-precondition', 'El pedido ya tiene un pago registrado. Cambiar productos o cantidades requiere registrar el ajuste de pago por separado.');
            const data: DocumentData = {
                ...oldRows[0], ...(existing || {}), id: line.id || db.collection('rentals').doc().id,
                reservationCode: groupCode, availabilityGroupId: oldRows[0].availabilityGroupId || digest(`legacy:${groupCode}`),
                productId: line.productId, productType: line.productType, productName: product.name, productNameSnapshot: product.name,
                quantity: line.quantity, selectedWheelSize: line.selectedWheelSize || '', ...(componentSelections ? { componentSelections } : {}),
                total: existing && hasPaid ? existing.total : computed, date, pickupTime, duration,
                startTimestamp: interval.startMs, endTimestamp: interval.endMs,
                deliveryService: request.data.deliveryService === true, pickupService: request.data.pickupService === true,
                mapsLink: cleanString(request.data.mapsLink, 500), notes: cleanString(request.data.notes, 1000),
                updatedAt: new Date().toISOString(), lastUpdatedBy: uid,
            };
            nextRows.push({ ref: db.doc(`rentals/${data.id}`), data });
        }
        const bikeCount = nextRows.reduce((sum, { data }) => {
            if (String(data.productId || '').startsWith('srv_')) return sum;
            if (data.productType === 'combo') return sum + (Number(data.quantity) || 0);
            const item = inventoryById.get(String(data.productId));
            return item?.itemType === 'accessory' ? sum : sum + (Number(data.quantity) || 0);
        }, 0);
        const mapCoordinates = coordinatesFromMapUrl(request.data.mapsLink);
        const deliveryFee = mapCoordinates && isInsideDeliveryZone(mapCoordinates.lat, mapCoordinates.lng) ? shippingFee(bikeCount) : 0;
        if (mapCoordinates && !hasPaid) nextRows.forEach(({ data }) => {
            if (data.productId === 'srv_delivery' || data.productId === 'srv_pickup') data.total = deliveryFee;
        });
        for (const service of [
            { enabled: request.data.deliveryService === true, productId: 'srv_delivery', name: 'Servicio de entrega', fee: deliveryFee },
            { enabled: request.data.pickupService === true, productId: 'srv_pickup', name: 'Servicio de recojo', fee: deliveryFee },
        ]) {
            if (!service.enabled || nextRows.some(({ data }) => data.productId === service.productId)) continue;
            const oldService = oldRows.find((row) => row.productId === service.productId);
            if (oldService) {
                nextRows.push({ ref: db.doc(`rentals/${String(oldService.id)}`), data: { ...oldService, date, pickupTime, duration } });
                continue;
            }
            if (!mapCoordinates) throw new HttpsError('failed-precondition', 'Para agregar entrega o recojo, registra un enlace de Maps que incluya las coordenadas; no se estimará una tarifa sin ubicación.');
            if (hasPaid) throw new HttpsError('failed-precondition', 'El pedido ya tiene un pago registrado. Ajusta el importe por separado antes de agregar un servicio.');
            const id = db.collection('rentals').doc().id;
            nextRows.push({ ref: db.doc(`rentals/${id}`), data: {
                ...oldRows[0], id, reservationCode: groupCode,
                availabilityGroupId: oldRows[0].availabilityGroupId || digest(`legacy:${groupCode}`),
                productType: 'single', productId: service.productId, productName: service.name,
                productNameSnapshot: service.name, quantity: 1, selectedWheelSize: '', total: service.fee,
                date, pickupTime, duration, startTimestamp: interval.startMs, endTimestamp: interval.endMs,
                deliveryService: service.productId === 'srv_delivery', pickupService: service.productId === 'srv_pickup',
                mapsLink: cleanString(request.data.mapsLink, 500), notes: cleanString(request.data.notes, 1000),
                updatedAt: new Date().toISOString(), lastUpdatedBy: uid,
            } });
        }
        if (!nextRows.some(({ data }) => !String(data.productId || '').startsWith('srv_'))) throw new HttpsError('failed-precondition', 'El alquiler debe conservar al menos una bicicleta, combo o accesorio.');
        const nextIds = new Set(nextRows.map(({ ref }) => ref.id));
        const nextDemand = rentalLinesDemands(nextRows.map(({ data }) => data), inventory, combos);
        const oldDemand = rentalLinesDemands(oldRows, inventory, combos);
        if (delivered && JSON.stringify(oldDemand) !== JSON.stringify(nextDemand)) throw new HttpsError('failed-precondition', 'No se pueden cambiar productos o cantidades después de entregar el alquiler.');
        const oldKeys = new Map(oldDemand.map((demand) => [`${demand.itemId}\0${demand.wheelSize || ''}`, demand]));
        const nextKeys = new Map(nextDemand.map((demand) => [`${demand.itemId}\0${demand.wheelSize || ''}`, demand]));
        const deltas = new Map<string, Demand>();
        for (const key of new Set([...oldKeys.keys(), ...nextKeys.keys()])) {
            const before = oldKeys.get(key); const after = nextKeys.get(key);
            deltas.set(key, { ...(after || before)!, quantity: (before?.quantity || 0) - (after?.quantity || 0) });
        }
        const holding = oldRows.some((row) => row.stockDeducted === true || (row.stockDeducted === undefined && [...LEGACY_CONFIRMED, ...LEGACY_DELIVERED].includes(String(row.status))));
        if (holding) {
            for (const delta of deltas.values()) {
                if (!delta.quantity) continue;
                const item = inventoryById.get(delta.itemId);
                if (!item) throw new HttpsError('failed-precondition', `No existe el inventario ${delta.itemId}.`);
                inventoryById.set(item.id, alterStock(item, delta.wheelSize, delta.quantity));
            }
        }
        const currentDate = oldRows[0].date; const currentTime = oldRows[0].pickupTime || '09:00';
        const scheduleChanged = date !== currentDate || pickupTime !== currentTime || duration !== String(oldRows[0].duration);
        if (scheduleChanged || !delivered) {
            const excluding = new Set(oldRows.map((row) => String(row.id)));
            const otherRows = allRentalsSnap.docs.filter((snap) => !excluding.has(snap.id)).map((snap) => snap.data()).filter((row) => isBlocking(String(row.status || '')));
            const todayStart = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date()) + 'T00:00:00-04:00').getTime();
            const requestIsToday = interval.startMs < todayStart + 86_400_000;
            for (const demand of nextDemand) {
                const item = inventoryById.get(demand.itemId)!;
                const relevant = otherRows.flatMap((row) => rentalDemands(row as unknown as RentalLike, inventory, combos).filter((other) => other.itemId === demand.itemId && (other.wheelSize || '') === (demand.wheelSize || '')).map((other) => ({ row, other })));
                const held = relevant.filter(({ row }) => isHolding(String(row.status))).reduce((sum, value) => sum + value.other.quantity, 0);
                const overlap = relevant.filter(({ row }) => { try { const window = getRentalWindow(row as unknown as RentalLike); return window.startMs < interval.endMs && interval.startMs < window.endMs || isHolding(String(row.status)) && requestIsToday && window.endMs <= interval.startMs; } catch { return true; } }).reduce((sum, value) => sum + value.other.quantity, 0);
                if (demand.quantity > Math.max(0, stockFor(item, demand.wheelSize) + held - overlap)) throw new HttpsError('failed-precondition', `${item.name}: no hay stock disponible para el nuevo horario.`);
            }
        }
        const lockKeys = new Set([...oldDemand, ...nextDemand].map(resourceKey));
        const lockRefs = [...lockKeys].map((key) => db.doc(`_availabilityLocks/${key}`));
        const locks = await Promise.all(lockRefs.map((ref) => tx.get(ref)));
        lockRefs.forEach((ref, index) => tx.set(ref, { revision: (Number(locks[index].data()?.revision) || 0) + 1, updatedAt: Timestamp.now() }));
        if (holding) for (const [itemId, item] of inventoryById) if (deltas.size && [...deltas.values()].some((delta) => delta.itemId === itemId && delta.quantity !== 0)) tx.update(db.doc(`inventory/${itemId}`), { ...(item.hasWheelSizes ? { wheelSizes: item.wheelSizes } : { stock: item.stock }) });
        const now = new Date().toISOString();
        for (const row of oldRows) if (!nextIds.has(String(row.id))) tx.delete(db.doc(`rentals/${row.id}`));
        for (const { ref, data } of nextRows) {
            const before = existingById.get(ref.id);
            const auditLog = Array.isArray(before?.auditLog) ? before.auditLog.slice(-49) : [];
            tx.set(ref, { ...data, updatedAt: now, lastUpdatedBy: uid, auditLog: [...auditLog, { action: 'edit', actorUid: uid, at: now, before: before ? { quantity: before.quantity, date: before.date, pickupTime: before.pickupTime, duration: before.duration, total: before.total } : null, after: { quantity: data.quantity, date: data.date, pickupTime: data.pickupTime, duration: data.duration, total: data.total } }], ...(holding ? { stockDeducted: true } : {}) } as DocumentData);
        }
    });
    return { ok: true };
});

export const provisionAdminUser = onCall(callable(), async (request) => {
    const actor = requireAuth(request);
    if (!exactObject(request.data)) throw new HttpsError('invalid-argument', 'Los datos del usuario no son válidos.');
    const uid = cleanString(request.data.uid, 128);
    const role = request.data.role;
    const store = cleanString(request.data.store || 'all', 80);
    if (!uid || !['admin', 'manager', 'mechanic', 'viewer'].includes(String(role))) {
        throw new HttpsError('invalid-argument', 'UID o rol inválido.');
    }
    const authUser = await getAuth().getUser(uid).catch(() => null);
    if (!authUser) throw new HttpsError('not-found', 'No existe la cuenta de autenticación indicada.');
    const actorRef = db.doc(`adminUsers/${actor.uid}`);
    const targetRef = db.doc(`adminUsers/${uid}`);
    const nextActive = request.data.active !== false;
    await db.runTransaction(async (tx) => {
        const [actorSnap, targetSnap, activeAdmins] = await Promise.all([
            tx.get(actorRef), tx.get(targetRef),
            tx.get(db.collection('adminUsers').where('role', '==', 'admin').where('active', '==', true)),
        ]);
        if (!actorSnap.exists || actorSnap.data()?.active !== true || actorSnap.data()?.role !== 'admin') {
            throw new HttpsError('permission-denied', 'Solo un administrador activo puede asignar roles.');
        }
        if (uid === actor.uid && (!nextActive || role !== 'admin')) {
            throw new HttpsError('failed-precondition', 'No puedes desactivar ni degradar tu propia cuenta.');
        }
        const currentTarget = targetSnap.data();
        const removesLastAdmin = currentTarget?.role === 'admin' && currentTarget.active === true
            && (!nextActive || role !== 'admin') && activeAdmins.size <= 1;
        if (removesLastAdmin) throw new HttpsError('failed-precondition', 'Debe quedar al menos un administrador activo.');
        tx.set(targetRef, {
            uid,
            email: authUser.email || '',
            name: cleanString(request.data.name, 120) || authUser.displayName || '',
            role,
            store,
            active: nextActive,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: actor.uid,
        }, { merge: true });
    });
    return { ok: true };
});

export const createServiceOrder = onCall(callable(), async (request) => {
    const sourceIp = request.rawRequest.ip || 'unknown';
    const key = digest(`service:${sourceIp}`);
    const limitRef = db.doc(`_requestLimits/${key}`);
    const input = request.data;
    if (!exactObject(input)) throw new HttpsError('invalid-argument', 'Solicitud inválida.');
    const fields = {
        customer: cleanString(input.customer, 120),
        phone: cleanString(input.phone, 40),
        bikeType: cleanString(input.bikeType, 120),
        issue: cleanString(input.issue, 1000),
        notes: cleanString(input.notes, 1000),
        estimatedDelivery: cleanString(input.estimatedDelivery, 80),
        costEstimate: 0,
        status: 'Recibido',
    };
    if (Object.values(fields).some((value) => !value) || fields.phone.replace(/\D/g, '').length < 7) {
        throw new HttpsError('invalid-argument', 'Completa los datos requeridos.');
    }
    const id = db.collection('serviceOrders').doc().id;
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(limitRef);
        const minute = Math.floor(Date.now() / 60_000);
        const count = snap.data()?.windowStart === minute ? Number(snap.data()?.count) || 0 : 0;
        if (count >= 3) throw new HttpsError('resource-exhausted', 'Demasiadas solicitudes. Intenta de nuevo más tarde.');
        tx.set(limitRef, { windowStart: minute, count: count + 1, updatedAt: FieldValue.serverTimestamp() });
        tx.create(db.doc(`serviceOrders/${id}`), { id, ...fields, date: new Date().toISOString(), source: 'public-web' });
    });
    return { ok: true, id };
});

export const sendReservationNotification = onDocumentCreated({
    document: 'telegramOutbox/{outboxId}',
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    retry: true,
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const ref = snapshot.ref;
    const claim = await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (!current.exists || current.data()?.status === 'sent' || current.data()?.status === 'sending') return false;
        tx.update(ref, { status: 'sending', attemptCount: FieldValue.increment(1), lastAttemptAt: FieldValue.serverTimestamp() });
        return true;
    });
    if (!claim) return;
    let token = '';
    let chatId = '';
    if (process.env.FUNCTIONS_EMULATOR !== 'true') {
        try { token = TELEGRAM_BOT_TOKEN.value(); chatId = TELEGRAM_CHAT_ID.value(); } catch { /* Secret configuration is handled as an outbox state, not a booking failure. */ }
    }
    if (!token || !chatId) {
        await ref.update({ status: 'skipped_unconfigured', updatedAt: FieldValue.serverTimestamp() });
        return;
    }
    const data = snapshot.data();
    const payload = data.payload || {};
    const escape = (value: unknown) => String(value || '').replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]!);
    const lines = Array.isArray(payload.items) ? payload.items.map((item: Record<string, unknown>) => `• ${item.quantity}x ${escape(item.name)} — Bs. ${Number(item.total) || 0}`).join('\n') : '';
    const message = `🚲 <b>NUEVA RESERVA</b>\nCódigo: <code>${escape(data.reservationCode)}</code>\nCliente: ${escape(payload.customerName)}\nTeléfono: ${escape(payload.customerPhone)}\nCI: <code>${escape(payload.customerCI)}</code>\nFecha: ${escape(payload.date)} ${escape(payload.pickupTime)}\nDuración: ${escape(payload.duration)}\nTotal: Bs. ${Number(payload.total) || 0}\n${lines}`;
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const telegramResult = await response.json() as { ok?: boolean; error_code?: number };
    if (!response.ok || telegramResult.ok !== true) {
        await ref.update({ status: 'failed', lastError: `Telegram HTTP ${response.status}`, updatedAt: FieldValue.serverTimestamp() });
        throw new Error(`Telegram notification failed (${response.status}; ${telegramResult.error_code || 'api-error'})`);
    }
    await ref.update({ status: 'sent', sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastError: FieldValue.delete() });
});

// Minimal health endpoint for emulator smoke checks only; it exposes no project data.
export const backendHealth = onRequest({ region: 'us-central1', maxInstances: 2 }, (_request, response) => {
    response.status(200).json({ ok: true, service: 'briz-functions' });
});
