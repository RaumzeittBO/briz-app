import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, reload } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const adminAppSdk = require('firebase-admin/app');
const adminAuthSdk = require('firebase-admin/auth');
const adminFirestoreSdk = require('firebase-admin/firestore');
const projectId = 'demo-briz-security';
const firebaseConfig = { apiKey: 'demo-key', authDomain: 'demo-briz-security.local', projectId, appId: 'demo-app' };
const adminApp = adminAppSdk.initializeApp({ projectId }, `test-admin-${Date.now()}`);
const adminDb = adminFirestoreSdk.getFirestore(adminApp);
const adminAuth = adminAuthSdk.getAuth(adminApp);
const clients: Array<{ app: ReturnType<typeof initializeApp>; auth: ReturnType<typeof getAuth>; functions: ReturnType<typeof getFunctions> }> = [];

function pass(label: string): void { console.log(`PASS ${label}`); }

async function client(email: string, password: string) {
    const app = initializeApp(firebaseConfig, `client-${clients.length}-${Date.now()}`);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    clients.push({ app, auth, functions });
    return { app, auth, functions, uid: credential.user.uid };
}

async function verifyEmail(auth: ReturnType<typeof getAuth>, uid: string): Promise<void> {
    await adminAuth.updateUser(uid, { emailVerified: true });
    if (auth.currentUser) {
        await reload(auth.currentUser);
        await auth.currentUser.getIdToken(true);
    }
}

async function call<T>(functions: ReturnType<typeof getFunctions>, name: string, data?: unknown): Promise<T> {
    const callable = httpsCallable<unknown, T>(functions, name);
    const result = await callable(data);
    return result.data;
}

function tomorrowBolivia(): string {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(date);
}

try {
    const userA = await client('rider-a@example.test', 'TestPass#123');
    const beginProfile = await call<{ verificationRequired: boolean }>(userA.functions, 'beginCustomerRegistration', {
        name: 'Rider A', phone: '+59170000001', ci: 'TEST-1001',
    });
    assert.equal(beginProfile.verificationRequired, true);
    await assert.rejects(() => call(userA.functions, 'createCustomerProfile'), /verify|verifica/i);
    await verifyEmail(userA.auth, userA.uid);
    const createdProfile = await call<{ profile: { authUid: string; email: string } }>(userA.functions, 'createCustomerProfile');
    assert.equal(createdProfile.profile.authUid, userA.uid);
    assert.equal(createdProfile.profile.email, 'rider-a@example.test');
    const customerDirectoryRecord = await adminDb.collection('customers').doc(userA.uid).get();
    assert.equal(customerDirectoryRecord.get('authUid'), userA.uid);
    assert.equal(customerDirectoryRecord.get('password'), undefined);
    await adminDb.collection('adminUsers').doc(userA.uid).set({ uid: userA.uid, role: 'admin', active: true, store: 'all' });
    await assert.rejects(
        () => call(userA.functions, 'provisionAdminUser', { uid: userA.uid, role: 'admin', active: false }),
        /desactivar|degradar/i,
    );
    await adminDb.collection('customers').doc('legacy-with-secret').set({
        id: 'legacy-with-secret', name: 'Legacy Customer', password: 'pbkdf2$secret',
        autofotoUrl: 'private/selfie.jpg', documentoUrl: 'private/id-front.jpg', email: 'legacy@example.test',
    });
    const safeCustomers = await call<{ customers: Array<Record<string, unknown>>; nextCursor: string | null }>(userA.functions, 'getAdminCustomers', {});
    const sanitizedLegacy = safeCustomers.customers.find((record) => record.id === 'legacy-with-secret');
    assert.ok(sanitizedLegacy);
    assert.equal('password' in sanitizedLegacy, false);
    assert.equal('autofotoUrl' in sanitizedLegacy, false);
    assert.equal('documentoUrl' in sanitizedLegacy, false);
    pass('Verified profile creation writes a credential-free directory record; admin customer reads are sanitized');

    await adminDb.collection('inventory').doc('bike-emulator').set({
        id: 'bike-emulator', itemType: 'bike', name: 'Emulator Bike', active: true,
        availableForRental: true, hasWheelSizes: true,
        wheelSizes: [{ size: '26', stock: 2, maintenanceStock: 0 }],
        pricePerHour: 20, price1Hour: 20, price24Hours: 70, pricePerDay: 70,
    });
    await adminDb.collection('inventory').doc('acc-emulator').set({
        id: 'acc-emulator', itemType: 'accessory', name: 'Emulator Lock', active: true,
        availableForRental: true, hasWheelSizes: false, stock: 3,
        addonFlatPrice: 7,
    });
    await adminDb.collection('inventory').doc('bike-race-emulator').set({
        id: 'bike-race-emulator', itemType: 'bike', name: 'Last Bike', active: true,
        availableForRental: true, hasWheelSizes: false, stock: 1,
        pricePerHour: 15, price1Hour: 15, price24Hours: 50, pricePerDay: 50,
    });
    await adminDb.collection('combos').doc('combo-emulator').set({
        id: 'combo-emulator', name: 'Emulator Combo', active: true, availableForRental: true,
        components: [{ inventoryItemId: 'bike-emulator', quantity: 1, requiresWheelSize: true }],
        pricePerHour: 30, price1Hour: 30, price24Hours: 90, pricePerDay: 90,
    });
    pass('Emulator catalog seeded with fictional inventory only');

    const key = `request_${crypto.randomUUID()}`;
    const booking = {
        idempotencyKey: key,
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }],
        date: tomorrowBolivia(), pickupTime: '10:00', duration: '1 hora',
        paymentMethod: 'Efectivo', total: 0,
    };
    const first = await call<{ reservationCode: string; total: number; duplicate: boolean }>(userA.functions, 'createRentalGroup', booking);
    assert.equal(first.total, 27, 'Server uses current catalog rates and ignores submitted total.');
    assert.equal(first.duplicate, false);
    const retry = await call<{ reservationCode: string; total: number; duplicate: boolean }>(userA.functions, 'createRentalGroup', booking);
    assert.equal(retry.reservationCode, first.reservationCode);
    assert.equal(retry.duplicate, true);
    const group = await adminDb.collection('rentals').where('reservationCode', '==', first.reservationCode).get();
    assert.equal(group.size, 2);
    const outbox = await adminDb.collection('telegramOutbox').where('reservationCode', '==', first.reservationCode).get();
    assert.equal(outbox.size, 1);
    const projection = await adminDb.collection('rentals_busy_slots').where('availabilityGroupId', '==', group.docs[0].data().availabilityGroupId).get();
    assert.equal(projection.size, 2);
    assert.ok(projection.docs.every((slot) => !('customerName' in slot.data()) && !('customerPhone' in slot.data()) && !('customerCI' in slot.data())));
    const ownHistory = await call<{ rentals: Array<Record<string, unknown>> }>(userA.functions, 'getMyRentals');
    assert.ok(ownHistory.rentals.some((rental) => rental.reservationCode === first.reservationCode));
    pass('Booking is priced on server, atomic, idempotent and emits private outbox/public sanitized slots');

    const comboBooking = {
        idempotencyKey: `combo_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    };
    const comboResult = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', comboBooking);
    assert.equal(comboResult.total, 30);
    const comboDoc = await adminDb.collection('rentals').where('reservationCode', '==', comboResult.reservationCode).get();
    assert.equal(comboDoc.size, 1);
    assert.deepEqual(comboDoc.docs[0].data().componentSelections, [{ inventoryItemId: 'bike-emulator', wheelSize: '26' }]);
    pass('Combo booking validates server-owned components and selected wheel size');

    const manualBooking = {
        adminManual: true,
        adminCustomer: { name: 'Counter Customer', phone: '+59170000009', ci: 'TEST-1009', email: 'counter@example.test' },
        adminPaymentStatus: 'paid',
        adminNotes: 'Created by a staff callable',
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)),
        pickupTime: '12:00', duration: '1 hora', paymentMethod: 'Efectivo',
        idempotencyKey: `manual_${crypto.randomUUID()}`,
    };
    const manualResult = await call<{ reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }>(userA.functions, 'createRentalGroup', manualBooking);
    const manualRental = await adminDb.collection('rentals').doc(manualResult.rentalIds[0]).get();
    assert.equal(manualRental.get('source'), 'manual');
    assert.equal(manualRental.get('customerName'), 'Counter Customer');
    assert.equal(manualRental.get('paymentStatus'), 'paid');
    assert.equal((await adminDb.collection('customers').where('ci', '==', 'TEST-1009').get()).size, 1);
    const manualRetry = await call<{ reservationCode: string; rentalIds: string[]; duplicate: boolean }>(userA.functions, 'createRentalGroup', manualBooking);
    assert.equal(manualRetry.duplicate, true);
    assert.equal(manualRetry.rentalIds[0], manualResult.rentalIds[0]);
    pass('Administrative manual booking validates role, creates customer and rental atomically, and retries idempotently');

    const userB = await client('rider-b@example.test', 'TestPass#123');
    await call(userB.functions, 'beginCustomerRegistration', { name: 'Rider B', phone: '+59170000002', ci: 'TEST-1002' });
    await verifyEmail(userB.auth, userB.uid);
    await call(userB.functions, 'createCustomerProfile');
    const raceDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const raceBooking = (idempotencyKey: string) => ({
        idempotencyKey,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(raceDate),
        pickupTime: '11:00', duration: '1 hora', paymentMethod: 'QR',
    });
    const [raceA, raceB] = await Promise.allSettled([
        call(userA.functions, 'createRentalGroup', raceBooking(`race_${crypto.randomUUID()}`)),
        call(userB.functions, 'createRentalGroup', raceBooking(`race_${crypto.randomUUID()}`)),
    ]);
    assert.equal([raceA, raceB].filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal([raceA, raceB].filter((item) => item.status === 'rejected').length, 1);
    pass('Two simultaneous reservations cannot both claim the last bike');

    const before = await adminDb.collection('rentals').where('reservationCode', '>=', 'BRIZ-').get();
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `short_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 2 }],
        date: tomorrowBolivia(), pickupTime: '14:00', duration: '1 hora', paymentMethod: 'Efectivo',
    }));
    const after = await adminDb.collection('rentals').where('reservationCode', '>=', 'BRIZ-').get();
    assert.equal(after.size, before.size, 'Failed transaction must leave no partial rental rows.');
    pass('Insufficient stock rejects without partial reservation documents');
} finally {
    clients.forEach(({ app }) => void import('firebase/app').then(({ deleteApp }) => deleteApp(app)));
    await adminApp.delete();
}
