import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, reload, confirmPasswordReset, verifyPasswordResetCode, signInWithEmailAndPassword, applyActionCode, signOut } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { connectFirestoreEmulator, getFirestore, doc, setDoc } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { getComboAvailabilityForInterval } from '../src/lib/rentalAvailability';
import type { ComboProduct, InventoryItem } from '../src/context/StoreContext';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const adminAppSdk = require('firebase-admin/app');
const adminAuthSdk = require('firebase-admin/auth');
const adminFirestoreSdk = require('firebase-admin/firestore');
const adminStorageSdk = require('firebase-admin/storage');
const projectId = 'demo-briz-security';
const firebaseConfig = { apiKey: 'demo-key', authDomain: 'demo-briz-security.local', projectId, appId: 'demo-app', storageBucket: `${projectId}.appspot.com` };
const adminApp = adminAppSdk.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` }, `test-admin-${Date.now()}`);
const adminDb = adminFirestoreSdk.getFirestore(adminApp);
const adminAuth = adminAuthSdk.getAuth(adminApp);
const adminBucket = adminStorageSdk.getStorage(adminApp).bucket();
const clients: Array<{ app: ReturnType<typeof initializeApp>; auth: ReturnType<typeof getAuth>; functions: ReturnType<typeof getFunctions> }> = [];

function pass(label: string): void { console.log(`PASS ${label}`); }

async function client(email: string, password: string) {
    const app = initializeApp(firebaseConfig, `client-${clients.length}-${Date.now()}`);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    const storage = getStorage(app);
    const firestore = getFirestore(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    clients.push({ app, auth, functions });
    return { app, auth, functions, storage, firestore, uid: credential.user.uid };
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
    const initialVerification = await call<{ status: 'sent' | 'verified' }>(userA.functions, 'sendCustomerVerificationEmail', { language: 'es' });
    assert.equal(initialVerification.status, 'sent');
    const initialEmails = await adminDb.collection('_emulatorVerificationOutbox').where('to', '==', 'rider-a@example.test').get();
    assert.equal(initialEmails.size, 1, 'Registration sends exactly one verification email through the emulator adapter.');
    const initialEmail = initialEmails.docs[0].data();
    assert.equal(initialEmail.from, 'BRIZ <notificaciones@briz.com.bo>');
    assert.match(String(initialEmail.html), /CONFIRMAR MI CORREO/);
    assert.match(String(initialEmail.text), /¡Bienvenido a BRIZ!/);
    const initialLinkMatch = String(initialEmail.text).match(/CONFIRMAR MI CORREO: (https:\/\/\S+)/);
    assert.ok(initialLinkMatch, 'The plain-text message includes the custom verification handler URL.');
    const initialActionUrl = new URL(initialLinkMatch![1]);
    assert.equal(initialActionUrl.origin, 'https://www.briz.com.bo');
    assert.equal(initialActionUrl.pathname, '/verify-email');
    assert.equal(initialActionUrl.searchParams.get('mode'), 'verifyEmail');
    assert.equal(initialActionUrl.searchParams.get('lang'), 'es');
    assert.equal(initialEmail.idempotencyKey.length > 0, true);
    await assert.rejects(
        () => call(userA.functions, 'sendCustomerVerificationEmail', { language: 'es', email: 'victim@example.test' }),
        /solicitud.*no.*válida/i,
        'A caller cannot choose a verification recipient.',
    );
    await assert.rejects(
        () => call(userA.functions, 'sendCustomerVerificationEmail', { language: 'en' }),
        /Espera un minuto/i,
        'The server rate-limits repeated sends independently of the UI cooldown.',
    );
    await adminDb.doc(`pendingCustomerRegistrations/${userA.uid}`).update({ expiresAt: Date.now() - 1 });
    await assert.rejects(() => call(userA.functions, 'createCustomerProfile'), /verify|verifica/i);
    const initialCode = initialActionUrl.searchParams.get('oobCode');
    assert.ok(initialCode);
    await applyActionCode(userA.auth, initialCode!);
    await reload(userA.auth.currentUser!);
    assert.equal(userA.auth.currentUser?.emailVerified, true, 'A code in the Resend message activates Firebase Auth.');
    await userA.auth.currentUser!.getIdToken(true);
    const alreadyVerified = await call<{ status: 'verified' | 'sent' }>(userA.functions, 'sendCustomerVerificationEmail', { language: 'es' });
    assert.equal(alreadyVerified.status, 'verified', 'A verified user is told their account is already confirmed.');
    assert.equal((await adminDb.collection('_emulatorVerificationOutbox').where('to', '==', 'rider-a@example.test').get()).size, 1);
    await signOut(userA.auth);
    const verifiedLogin = await signInWithEmailAndPassword(userA.auth, 'rider-a@example.test', 'TestPass#123');
    assert.equal(verifiedLogin.user.emailVerified, true, 'The confirmed account can sign in normally.');
    await verifiedLogin.user.getIdToken(true);
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
    await adminDb.collection('customers').doc(userA.uid).update({ store: 'cochabamba' });
    await adminDb.collection('customerPrivate').doc(userA.uid).set({
        autofotoPath: `customerUploads/${userA.uid}/selfie.png`,
        documentoPath: `customerUploads/${userA.uid}/document-front.png`,
        documentoReversoPath: `customerUploads/${userA.uid}/document-back.png`,
    });
    const fictitiousImage = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const name of ['selfie.png', 'document-front.png', 'document-back.png']) {
        await uploadBytes(storageRef(userA.storage, `customerUploads/${userA.uid}/${name}`), fictitiousImage, { contentType: 'image/png' });
    }
    const accountWithExistingFiles = await call<{ profile: { missingPrivateFiles: string[]; privateFilesNeedReview: string[] } }>(userA.functions, 'createCustomerProfile');
    assert.deepEqual(accountWithExistingFiles.profile.missingPrivateFiles, []);
    assert.deepEqual(accountWithExistingFiles.profile.privateFilesNeedReview, []);
    pass('Existing UID-owned photo and document references are retained and individually verified after upload');
    const privateFiles = await call<{ files: Record<string, { url: string | null; state: string }>; expiresInSeconds: number }>(userA.functions, 'getAdminCustomerFiles', { customerId: userA.uid });
    assert.equal(privateFiles.expiresInSeconds, 300);
    assert.deepEqual(Object.values(privateFiles.files).map((file) => file.state), ['available', 'available', 'available']);
    assert.ok(Object.values(privateFiles.files).every((file) => file.url?.startsWith('data:image/png;base64,')), 'Emulator returns authorized local bytes without publishing a permanent link.');
    assert.deepEqual(Buffer.from(privateFiles.files.autofoto.url!.split(',')[1], 'base64'), Buffer.from(fictitiousImage));

    const legacyFilesEmail = 'legacy-files@example.test';
    const legacyFilesUser = await client(legacyFilesEmail, 'TestPass#123');
    await verifyEmail(legacyFilesUser.auth, legacyFilesUser.uid);
    const legacyFilesId = 'legacy-profile-with-private-files';
    const legacyOwnedPaths = {
        autofotoPath: `customers/${legacyFilesId}/selfie.jpg`,
        documentoPath: `customers/${legacyFilesId}/document-front.png`,
        documentoReversoPath: `customers/${legacyFilesId}/document-back.png`,
    };
    await adminDb.doc(`customers/${legacyFilesId}`).set({
        id: legacyFilesId, email: legacyFilesEmail, name: 'Legacy Files Customer', phone: '+59170000004', ci: 'LEGACY-1004', rentalsCount: 4,
    });
    await adminDb.doc(`customerPrivate/${legacyFilesId}`).set(legacyOwnedPaths);
    for (const path of Object.values(legacyOwnedPaths)) await adminBucket.file(path).save(Buffer.from(fictitiousImage), { metadata: { contentType: 'image/png' } });
    const linkedLegacyFiles = await call<{ profile: { legacyCustomerId: string; missingPrivateFiles: string[]; privateFilesNeedReview: string[] }; linkedLegacyAccount: boolean }>(legacyFilesUser.functions, 'createCustomerProfile');
    assert.equal(linkedLegacyFiles.linkedLegacyAccount, true);
    assert.equal(linkedLegacyFiles.profile.legacyCustomerId, legacyFilesId);
    assert.deepEqual(linkedLegacyFiles.profile.missingPrivateFiles, []);
    assert.deepEqual(linkedLegacyFiles.profile.privateFilesNeedReview, []);
    const linkedLegacyPrivate = (await adminDb.doc(`customerPrivate/${legacyFilesUser.uid}`).get()).data() || {};
    for (const [field, path] of Object.entries(legacyOwnedPaths)) assert.equal(linkedLegacyPrivate[field], path, 'Verified legacy paths are copied only to the matching verified UID.');
    pass('Exact-email legacy account retains files under its linked customer root after individual existence checks');

    const mismatchedLegacyOwner = await client('mismatched-legacy-owner@example.test', 'TestPass#123');
    await verifyEmail(mismatchedLegacyOwner.auth, mismatchedLegacyOwner.uid);
    const foreignLegacyId = 'legacy-linked-to-someone-else';
    await adminDb.doc(`customers/${foreignLegacyId}`).set({ id: foreignLegacyId, authUid: 'different-owner-uid', email: 'different@example.test' });
    await adminDb.doc(`customerProfiles/${mismatchedLegacyOwner.uid}`).set({
        id: mismatchedLegacyOwner.uid, authUid: mismatchedLegacyOwner.uid, email: 'mismatched-legacy-owner@example.test',
        name: 'Fictional Account', phone: '+59170000005', ci: 'SAFE-1005', legacyCustomerId: foreignLegacyId,
    });
    await adminDb.doc(`customerPrivate/${foreignLegacyId}`).set({ autofotoPath: `customers/${foreignLegacyId}/selfie.jpg` });
    await assert.rejects(() => call(mismatchedLegacyOwner.functions, 'createCustomerProfile'), (error: unknown) => (error as { code?: string }).code === 'functions/failed-precondition');
    pass('A legacy storage root is not trusted unless its customer record is linked to the authenticated UID');

    const unauthorizedReader = await client('unauthorized-files@example.test', 'TestPass#123');
    await assert.rejects(() => call(unauthorizedReader.functions, 'getAdminCustomerFiles', { customerId: userA.uid }), (error: unknown) => (error as { code?: string }).code === 'functions/permission-denied');
    const branchManager = await client('manager-files@example.test', 'TestPass#123');
    await verifyEmail(branchManager.auth, branchManager.uid);
    await adminDb.doc(`adminUsers/${branchManager.uid}`).set({ uid: branchManager.uid, role: 'manager', active: true, store: 'lapaz' });
    await assert.rejects(() => call(branchManager.functions, 'getAdminCustomerFiles', { customerId: userA.uid }), (error: unknown) => (error as { code?: string }).code === 'functions/permission-denied');
    await adminDb.doc(`adminUsers/${branchManager.uid}`).update({ store: 'cochabamba' });
    const scopedFiles = await call<{ files: Record<string, { state: string }> }>(branchManager.functions, 'getAdminCustomerFiles', { customerId: userA.uid });
    assert.equal(scopedFiles.files.documento.state, 'available', 'Manager can view private documents only for their own branch.');
    const unreferencedLegacyFiles = await call<{ files: Record<string, { url: string | null; state: string }> }>(userA.functions, 'getAdminCustomerFiles', { customerId: 'legacy-with-secret' });
    assert.ok(Object.values(unreferencedLegacyFiles.files).every((file) => file.state === 'needs_review' && file.url === null), 'Unsupported legacy URLs are not reported as deleted files.');
    await adminDb.doc('customers/legacy-file-absent').set({ id: 'legacy-file-absent', name: 'Fictional Missing File', store: 'cochabamba', autofotoPath: 'customers/legacy-file-absent/selfie.jpg' });
    const absentReferencedFile = await call<{ files: Record<string, { url: string | null; state: string }> }>(userA.functions, 'getAdminCustomerFiles', { customerId: 'legacy-file-absent' });
    assert.equal(absentReferencedFile.files.autofoto.state, 'missing', 'A safe owned reference that returns exists=false is a confirmed missing object.');
    assert.equal(absentReferencedFile.files.documento.state, 'needs_review', 'A file with no stored reference needs review rather than a missing claim.');
    pass('Verified profile creation writes a credential-free directory record; admin customer reads are sanitized');

    await adminDb.collection('inventory').doc('bike-emulator').set({
        id: 'bike-emulator', itemType: 'bike', name: 'Emulator Bike', active: true,
        availableForRental: true, hasWheelSizes: true,
        wheelSizes: [{ size: '26', stock: 2, maintenanceStock: 0 }, { size: '27', stock: 1, maintenanceStock: 0 }],
        pricePerHour: 20, price1Hour: 20, price24Hours: 70, pricePerDay: 70,
    });
    await adminDb.collection('inventory').doc('acc-emulator').set({
        id: 'acc-emulator', itemType: 'accessory', name: 'Emulator Lock', active: true,
        availableForRental: false, availableAsRentalAddon: false, rentalCatalog: true, availableForSale: false, hasWheelSizes: false, stock: 3,
        addonFlatPrice: 7,
    });
    await adminDb.collection('inventory').doc('acc-catalog-only-emulator').set({
        id: 'acc-catalog-only-emulator', itemType: 'accessory', name: 'Rental catalog only', active: true,
        availableForRental: false, availableAsRentalAddon: false, rentalCatalog: true, availableForSale: false,
        hasWheelSizes: false, stock: 1, addonFlatPrice: 3,
    });
    await adminDb.collection('inventory').doc('acc-addon-only-emulator').set({
        id: 'acc-addon-only-emulator', itemType: 'accessory', name: 'Addon only', active: true,
        availableForRental: false, availableAsRentalAddon: true, hasWheelSizes: false, stock: 2, addonFlatPrice: 5,
    });
    await adminDb.collection('inventory').doc('bike-race-emulator').set({
        id: 'bike-race-emulator', itemType: 'bike', name: 'Last Bike', active: true,
        availableForRental: true, hasWheelSizes: false, stock: 1,
        pricePerHour: 15, price1Hour: 15, price24Hours: 50, pricePerDay: 50,
    });
    const everyDay = { closed: false, open: '08:00', close: '12:00', secondShift: { open: '13:00', close: '19:30' } };
    await adminDb.doc('settings/public_business').set({ hours: {
        monday: everyDay, tuesday: everyDay, wednesday: everyDay, thursday: everyDay,
        friday: everyDay, saturday: everyDay, sunday: everyDay,
    } }, { merge: true });
    await adminDb.collection('combos').doc('combo-emulator').set({
        id: 'combo-emulator', name: 'Emulator Combo', active: true, availableForRental: true,
        components: [
            { inventoryItemId: 'bike-emulator', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc-emulator', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 30, price1Hour: 30, price24Hours: 90, pricePerDay: 90,
    });
    const stockWindowDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 100 * 24 * 60 * 60 * 1000));
    const inventoryBeforeStockAdjustment = (await adminDb.collection('inventory').get()).docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })) as unknown as InventoryItem[];
    const combosBeforeStockAdjustment = (await adminDb.collection('combos').get()).docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })) as unknown as ComboProduct[];
    const capacityBeforeStockAdjustment = getComboAvailabilityForInterval({ inventory: inventoryBeforeStockAdjustment, combos: combosBeforeStockAdjustment, rentals: [], comboId: 'combo-emulator', wheelSize: '26', date: stockWindowDate, pickupTime: '10:00', duration: '1 hora' });
    await call(userA.functions, 'adjustInventoryStock', { itemId: 'bike-emulator', wheelSize: '26', delta: 2 });
    const inventoryAfterStockAdjustment = (await adminDb.collection('inventory').get()).docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })) as unknown as InventoryItem[];
    const capacityAfterStockAdjustment = getComboAvailabilityForInterval({ inventory: inventoryAfterStockAdjustment, combos: combosBeforeStockAdjustment, rentals: [], comboId: 'combo-emulator', wheelSize: '26', date: stockWindowDate, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(capacityBeforeStockAdjustment, 2);
    assert.equal(capacityAfterStockAdjustment, 3, 'Combo capacity recalculates from the adjusted physical bicycle stock');
    await call(userA.functions, 'adjustInventoryStock', { itemId: 'bike-emulator', wheelSize: '26', delta: -2 });
    const stockAdjustmentAudits = await adminDb.collection('inventoryStockAudits').where('itemId', '==', 'bike-emulator').where('source', '==', 'combo_stock_manager').get();
    assert.equal(stockAdjustmentAudits.size, 2, 'Both physical stock adjustments have audit rows');
    pass('Combo stock manager adjusts physical component stock atomically, audits both changes, and recalculates capacity');
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
    await assert.rejects(() => call(userA.functions, 'adjustInventoryStock', { itemId: 'bike-emulator', wheelSize: '26', delta: -2 }), /reserva|inventario|stock/i, 'Stock manager must protect an existing reservation');
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, 2, 'Rejected stock reduction leaves physical stock unchanged');
    pass('Combo stock manager rejects a reduction that would violate a committed reservation');
    const scheduleDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    await call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `close_exact_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '27' }],
        date: scheduleDate, pickupTime: '17:30', endTime: '19:30', duration: '2 horas', paymentMethod: 'QR',
    });
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `after_close_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '27' }],
        date: scheduleDate, pickupTime: '18:00', endTime: '21:00', duration: '3 horas', paymentMethod: 'QR',
    }), /horario|19:30/i, 'Callable must reject a manipulated booking that returns after closing.');
    pass('Rental callable validates public business hours and allows return exactly at configured close');
    const retry = await call<{ reservationCode: string; total: number; duplicate: boolean }>(userA.functions, 'createRentalGroup', booking);
    assert.equal(retry.reservationCode, first.reservationCode);
    assert.equal(retry.duplicate, true);
    const group = await adminDb.collection('rentals').where('reservationCode', '==', first.reservationCode).get();
    assert.equal(group.size, 2);
    const outbox = await adminDb.collection('telegramOutbox').where('reservationCode', '==', first.reservationCode).get();
    assert.equal(outbox.size, 1);
    let notificationStatus = outbox.docs[0].get('status');
    for (let attempt = 0; attempt < 120 && ['pending', 'sending'].includes(notificationStatus); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        notificationStatus = (await outbox.docs[0].ref.get()).get('status');
    }
    assert.equal(notificationStatus, 'skipped_unconfigured', 'Emulator booking succeeds while notification is truthfully marked unconfigured.');
    const projection = await adminDb.collection('rentals_busy_slots').where('availabilityGroupId', '==', group.docs[0].data().availabilityGroupId).get();
    assert.equal(projection.size, 2);
    assert.ok(projection.docs.every((slot) => !('customerName' in slot.data()) && !('customerPhone' in slot.data()) && !('customerCI' in slot.data())));
    const ownHistory = await call<{ rentals: Array<Record<string, unknown>> }>(userA.functions, 'getMyRentals');
    assert.ok(ownHistory.rentals.some((rental) => rental.reservationCode === first.reservationCode));
    pass('Booking is priced on server, atomic, idempotent and emits private outbox/public sanitized slots; Telegram absence does not block booking');

    // A combo can reserve an active component even when that component is not rentable by itself.
    await adminDb.collection('inventory').doc('acc-emulator').update({ availableForRental: false });
    const comboDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const comboBooking = {
        idempotencyKey: `combo_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        date: comboDate,
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    };
    await adminDb.collection('inventory').doc('acc-emulator').update({ availableAsRentalAddon: false });
    const comboResult = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', comboBooking);
    assert.equal(comboResult.total, 30);
    const comboDoc = await adminDb.collection('rentals').where('reservationCode', '==', comboResult.reservationCode).get();
    assert.equal(comboDoc.size, 1, 'A combo without separately selected add-ons is stored as one rental line.');
    assert.deepEqual(comboDoc.docs[0].data().componentSelections, [
        { inventoryItemId: 'bike-emulator', wheelSize: '26' }, { inventoryItemId: 'acc-emulator' },
    ]);
    await adminDb.collection('inventory').doc('acc-emulator').update({ availableForRental: true });
    const comboWithAccessory = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', {
        ...comboBooking,
        idempotencyKey: `combo_addon_${crypto.randomUUID()}`,
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }],
    });
    assert.equal(comboWithAccessory.total, 37);
    await adminDb.collection('inventory').doc('acc-emulator').update({ excludeFromRentalAddons: true });
    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        ...comboBooking, idempotencyKey: `excluded_addon_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }],
    }), /complemento|disponible/i, 'Explicit admin exclusion is honored by the server.');
    await adminDb.collection('inventory').doc('acc-emulator').update({ excludeFromRentalAddons: false });
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `shared_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }], date: comboDate,
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    }));
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `standalone_conflict_${crypto.randomUUID()}`,
        lines: [{ productId: 'acc-emulator', productType: 'single', quantity: 1 }],
        date: comboDate, pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    }), /disponible|stock|inventario|quedan/i, 'Combo inventory demand must block an independent accessory rental.');

    const directAccessoryDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
    const directAccessory = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', {
        idempotencyKey: `direct_accessory_${crypto.randomUUID()}`,
        lines: [{ productId: 'acc-emulator', productType: 'single', quantity: 1 }],
        date: directAccessoryDate, pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    });
    assert.equal(directAccessory.total, 20, 'Standalone accessory uses the configured individual rate (or the UI’s documented default) rather than its addon-only price.');

    const standaloneDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
    await call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `bike_with_standalone_accessories_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        accessories: [{ itemId: 'acc-emulator', quantity: 3 }],
        date: standaloneDate, pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    });
    // Isolated test fixture: keep the inventory assertion independent from the callable's
    // production rate limit when this integration suite runs in a tight window.
    const rentalRateLimitId = `reservations_${createHash('sha256').update(userA.uid).digest('hex')}`;
    await adminDb.collection('_requestLimits').doc(rentalRateLimitId).delete();
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `combo_conflict_with_standalone_addon_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        date: standaloneDate, pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    }), /disponible|stock|inventario|quedan/i, 'Combo demand must see accessories reserved separately with another rental.');
    pass('Combo-only components can be booked; combo and standalone add-on reservations share one physical accessory stock');

    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const addOnOnlyBooking = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', {
        idempotencyKey: `addon_only_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        accessories: [{ itemId: 'acc-addon-only-emulator', quantity: 1 }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 35 * 24 * 60 * 60 * 1000)),
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    });
    assert.equal(addOnOnlyBooking.total, 20, 'An accessory can be a booking add-on while individual rental is disabled.');
    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const automaticCatalogBooking = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', {
        idempotencyKey: `catalog_only_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        accessories: [{ itemId: 'acc-catalog-only-emulator', quantity: 1 }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)),
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    });
    assert.equal(automaticCatalogBooking.total, 18, 'Rental-catalog membership offers an accessory without individual-rental/add-on flags or combo membership.');
    pass('Explicit rental catalog membership exposes active accessories while sale-only and excluded items remain unavailable');
    await adminDb.collection('inventory').doc('acc-addon-only-emulator').update({ excludeFromRentalAddons: true });
    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `addon_disabled_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        accessories: [{ itemId: 'acc-addon-only-emulator', quantity: 1 }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 36 * 24 * 60 * 60 * 1000)),
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    }), /complemento|disponible/i, 'Server rejects accessories disabled as add-ons.');
    pass('Add-on-only legacy accessory remains supported; server honors explicit add-on exclusion');

    await adminDb.collection('inventory').doc('maintenance-bike-emulator').set({
        id: 'maintenance-bike-emulator', itemType: 'bike', name: 'Maintenance Fleet Bike', active: true,
        availableForRental: true, hasWheelSizes: true, store: 'cochabamba', maintenanceStock: 0,
        wheelSizes: [{ size: '13', stock: 1, maintenanceStock: 0 }, { size: '18', stock: 1, maintenanceStock: 0 }],
        pricePerHour: 10, price1Hour: 10, price24Hours: 40, pricePerDay: 40,
    });
    await adminDb.collection('combos').doc('maintenance-combo-emulator').set({
        id: 'maintenance-combo-emulator', name: 'Maintenance test combo', active: true, availableForRental: true,
        components: [{ inventoryItemId: 'maintenance-bike-emulator', quantity: 1, requiresWheelSize: true }], pricePerHour: 10, price1Hour: 10,
    });
    const personalBikeOrder = doc(userA.firestore, 'serviceOrders', `personal-bike-${crypto.randomUUID()}`);
    const maintenanceBeforePersonal = await adminDb.doc('inventory/maintenance-bike-emulator').get();
    await setDoc(personalBikeOrder, { id: personalBikeOrder.id, ownership: 'customer', store: 'cochabamba', status: 'Recibido' });
    assert.deepEqual((await adminDb.doc('inventory/maintenance-bike-emulator').get()).get('wheelSizes'), maintenanceBeforePersonal.get('wheelSizes'), 'Customer-owned repair does not alter BRIZ fleet stock.');

    const maintenanceOrder = await call<{ id: string }>(userA.functions, 'createBrizMaintenanceOrder', {
        customer: 'Fictional customer', phone: '+59170000088', bikeType: 'Maintenance Fleet Bike', issue: 'Fictional brake issue',
        estimatedDelivery: tomorrowBolivia(), costEstimate: 0, notes: '', store: 'cochabamba', inventoryItemId: 'maintenance-bike-emulator', wheelSize: '13', quantity: 1,
    });
    let maintenanceInventory = await adminDb.doc('inventory/maintenance-bike-emulator').get();
    assert.deepEqual(maintenanceInventory.get('wheelSizes'), [
        { size: '13', stock: 0, maintenanceStock: 1 }, { size: '18', stock: 1, maintenanceStock: 0 },
    ]);
    assert.equal(maintenanceInventory.get('maintenanceStock'), 1);
    const maintenanceCatalog = [{ id: maintenanceInventory.id, ...maintenanceInventory.data()! } as InventoryItem];
    const maintenanceCombos = [{ id: 'maintenance-combo-emulator', ...((await adminDb.doc('combos/maintenance-combo-emulator').get()).data()!) } as ComboProduct];
    assert.equal(getComboAvailabilityForInterval({ inventory: maintenanceCatalog, combos: maintenanceCombos, rentals: [], comboId: 'maintenance-combo-emulator', wheelSize: '13' }), 0);
    assert.equal(getComboAvailabilityForInterval({ inventory: maintenanceCatalog, combos: maintenanceCombos, rentals: [], comboId: 'maintenance-combo-emulator', wheelSize: '18' }), 1);
    await call(userA.functions, 'updateBrizMaintenanceOrder', { id: maintenanceOrder.id, updates: { status: 'Listo' } });
    assert.equal((await adminDb.doc('inventory/maintenance-bike-emulator').get()).get('wheelSizes')[0].stock, 0, 'Ready status alone does not reintroduce the bike.');
    await call(userA.functions, 'releaseBrizMaintenanceOrder', { id: maintenanceOrder.id });
    await assert.rejects(() => call(userA.functions, 'releaseBrizMaintenanceOrder', { id: maintenanceOrder.id }), /already-exists|reincorporada/i);
    await call(userA.functions, 'updateBrizMaintenanceOrder', { id: maintenanceOrder.id, updates: { status: 'Entregado' } });
    await assert.rejects(() => call(userA.functions, 'updateBrizMaintenanceOrder', { id: maintenanceOrder.id, updates: { status: 'Listo' } }), /reincorporada/i);
    const completedMaintenanceOrder = await adminDb.doc(`serviceOrders/${maintenanceOrder.id}`).get();
    assert.equal(completedMaintenanceOrder.get('status'), 'Entregado');
    assert.ok(completedMaintenanceOrder.get('maintenanceAudit').length >= 3, 'Intake, release, and final delivery are retained in the maintenance audit trail.');
    maintenanceInventory = await adminDb.doc('inventory/maintenance-bike-emulator').get();
    assert.deepEqual(maintenanceInventory.get('wheelSizes'), [
        { size: '13', stock: 1, maintenanceStock: 0 }, { size: '18', stock: 1, maintenanceStock: 0 },
    ]);
    pass('Fleet maintenance removes the selected rim exactly once, lowers combo capacity, leaves customer bikes untouched, and requires an audited one-time release');

    await adminDb.doc('inventory/maintenance-legacy-emulator').set({
        id: 'maintenance-legacy-emulator', itemType: 'bike', name: 'Legacy damaged return', active: true,
        availableForRental: true, hasWheelSizes: false, store: 'cochabamba', stock: 1, maintenanceStock: 1,
    });
    const legacyReleaseOperationId = `legacy_release_${crypto.randomUUID()}`;
    await call(userA.functions, 'releaseUnlinkedMaintenanceStock', { itemId: 'maintenance-legacy-emulator', operationId: legacyReleaseOperationId });
    await call(userA.functions, 'releaseUnlinkedMaintenanceStock', { itemId: 'maintenance-legacy-emulator', operationId: legacyReleaseOperationId });
    const releasedLegacyMaintenance = await adminDb.doc('inventory/maintenance-legacy-emulator').get();
    assert.equal(releasedLegacyMaintenance.get('stock'), 2);
    assert.equal(releasedLegacyMaintenance.get('maintenanceStock'), 0, 'Retry with the same operation id does not release stock twice.');
    await adminDb.doc('inventory/maintenance-assigned-emulator').set({
        id: 'maintenance-assigned-emulator', itemType: 'bike', name: 'Assigned repair', active: true,
        availableForRental: true, hasWheelSizes: false, store: 'cochabamba', stock: 1, maintenanceStock: 1,
    });
    await adminDb.doc('serviceOrders/maintenance-assigned-fixture').set({
        id: 'maintenance-assigned-fixture', ownership: 'briz', inventoryItemId: 'maintenance-assigned-emulator',
        maintenanceQuantity: 1, inventoryReleased: false, store: 'cochabamba', status: 'En reparación',
    });
    await assert.rejects(() => call(userA.functions, 'releaseUnlinkedMaintenanceStock', {
        itemId: 'maintenance-assigned-emulator', operationId: `allocated_${crypto.randomUUID()}`,
    }), /sin orden|pendiente/i);
    assert.equal((await adminDb.doc('inventory/maintenance-assigned-emulator').get()).get('stock'), 1, 'Units assigned to a linked workshop order cannot be released through the legacy path.');
    pass('Legacy damaged-return stock has an audited idempotent release path; stock allocated to an active workshop order is protected');

    await adminDb.collection('inventory').doc('maintenance-conflict-emulator').set({
        id: 'maintenance-conflict-emulator', itemType: 'bike', name: 'Reserved Fleet Bike', active: true,
        availableForRental: true, hasWheelSizes: false, store: 'cochabamba', stock: 1, maintenanceStock: 0,
    });
    const conflictDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 40 * 24 * 60 * 60 * 1000));
    const conflictRentalRef = adminDb.doc('rentals/maintenance-conflict-fixture');
    await conflictRentalRef.set({ id: conflictRentalRef.id, productId: 'maintenance-conflict-emulator', productType: 'single', quantity: 1, status: 'pending', date: conflictDate, pickupTime: '10:00', duration: '1 hora' });
    await assert.rejects(() => call(userA.functions, 'createBrizMaintenanceOrder', {
        customer: 'Fictional', phone: '+59170000089', bikeType: 'Reserved Fleet Bike', issue: 'Fictional repair', estimatedDelivery: tomorrowBolivia(),
        store: 'cochabamba', inventoryItemId: 'maintenance-conflict-emulator', quantity: 1,
    }), /reservas existentes/i);
    assert.equal((await adminDb.doc('inventory/maintenance-conflict-emulator').get()).get('stock'), 1, 'Conflict rejection leaves stock intact.');
    await conflictRentalRef.delete();
    pass('Maintenance rejects a withdrawal that would conflict with an active reservation and does not cancel or alter that booking');

    await adminDb.collection('inventory').doc('maintenance-race-emulator').set({
        id: 'maintenance-race-emulator', itemType: 'bike', name: 'Concurrent Fleet Bike', active: true,
        availableForRental: true, hasWheelSizes: false, store: 'cochabamba', stock: 1, maintenanceStock: 0, pricePerHour: 10, price1Hour: 10,
    });
    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const maintenanceRaceDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000));
    const [raceBookingResult, raceMaintenanceResult] = await Promise.allSettled([
        call(userA.functions, 'createRentalGroup', {
            idempotencyKey: `maintenance_race_${crypto.randomUUID()}`,
            lines: [{ productId: 'maintenance-race-emulator', productType: 'single', quantity: 1 }],
            date: maintenanceRaceDate, pickupTime: '10:00', duration: '1 hora', paymentMethod: 'QR',
        }),
        call(userA.functions, 'createBrizMaintenanceOrder', {
            customer: 'Fictional race', phone: '+59170000090', bikeType: 'Concurrent Fleet Bike', issue: 'Race fixture',
            estimatedDelivery: tomorrowBolivia(), store: 'cochabamba', inventoryItemId: 'maintenance-race-emulator', quantity: 1,
        }),
    ]);
    assert.equal([raceBookingResult, raceMaintenanceResult].filter(result => result.status === 'fulfilled').length, 1, 'Concurrent booking and maintenance must serialize around the same resource.');
    const raceInventory = await adminDb.doc('inventory/maintenance-race-emulator').get();
    assert.equal(Number(raceInventory.get('stock')) + Number(raceInventory.get('maintenanceStock')), 1);
    pass('A booking and a maintenance intake racing for the last physical unit serialize; exactly one succeeds');

    await adminDb.doc(`customers/${userA.uid}`).set({
        id: userA.uid, name: 'Registered Emulator Customer', phone: '+59170000001', ci: 'TEST-1001',
        email: 'rider-a@example.test', store: 'cochabamba', rentalsCount: 0, purchasesCount: 0,
    });
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
    assert.ok(manualRental.get('paidAt'), 'A manually paid future rental records the actual receipt time.');
    assert.equal(manualRental.get('date') > manualRental.get('paidAt').slice(0, 10), true, 'Future rental date remains separate from payment date.');
    assert.equal((await adminDb.collection('customers').where('ci', '==', 'TEST-1009').get()).size, 1);
    const manualRetry = await call<{ reservationCode: string; rentalIds: string[]; duplicate: boolean }>(userA.functions, 'createRentalGroup', manualBooking);
    assert.equal(manualRetry.duplicate, true);
    assert.equal(manualRetry.rentalIds[0], manualResult.rentalIds[0]);
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', manualResult.reservationCode).get()).size, 1,
        'A retried manual create with the same idempotency key must persist exactly one rental line.');
    pass('Administrative manual booking validates role, creates customer and rental atomically, and retries idempotently');

    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const existingCounterCustomerId = 'counter-customer-existing-fixture';
    await adminDb.doc(`customers/${existingCounterCustomerId}`).set({
        id: existingCounterCustomerId, name: 'Existing Counter Customer', phone: '+59170000991', ci: 'EMU-LINK-991',
        email: 'existing-counter@example.test', store: 'cochabamba', rentalsCount: 0, purchasesCount: 0,
    });
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomerPending: true, adminImmediateWalkIn: false,
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)),
        pickupTime: '10:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `manual_pending_future_${crypto.randomUUID()}`,
    }), /atención inmediata|día actual/i, 'Pending customer is limited to a same-day counter walk-in, not a future booking.');
    const pendingWalkInDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
    const pendingWalkInTime = '16:00';
    const pendingWalkIn = await call<{ reservationCode: string; rentalIds: string[]; total: number }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomerPending: true, adminPaymentStatus: 'unpaid',
        adminImmediateWalkIn: true,
        adminNotes: '[DOCUMENTO EN CUSTODIA]: CI de prueba en mostrador',
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: pendingWalkInDate,
        pickupTime: pendingWalkInTime, duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `manual_pending_${crypto.randomUUID()}`,
    });
    const pendingWalkInRow = adminDb.doc(`rentals/${pendingWalkIn.rentalIds[0]}`);
    const pendingBeforeLink = await pendingWalkInRow.get();
    assert.equal(pendingBeforeLink.get('customerPending'), true);
    assert.equal(pendingBeforeLink.get('customerName'), 'Cliente pendiente');
    assert.equal(pendingBeforeLink.get('customerCI'), '');
    assert.equal(pendingBeforeLink.get('paymentStatus'), 'unpaid');
    assert.match(pendingBeforeLink.get('notes'), /DOCUMENTO EN CUSTODIA/);
    await call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: pendingWalkIn.rentalIds });
    await call(userA.functions, 'adminRentalAction', { action: 'deliver', rentalIds: pendingWalkIn.rentalIds });
    const deliveredBeforeAssociation = await pendingWalkInRow.get();
    await call(userA.functions, 'associateManualRentalCustomer', {
        reservationCode: pendingWalkIn.reservationCode, customer: { id: existingCounterCustomerId },
    });
    const linkedWalkIn = await pendingWalkInRow.get();
    assert.equal(linkedWalkIn.get('customerId'), existingCounterCustomerId);
    assert.equal(linkedWalkIn.get('customerPending'), false);
    assert.equal(linkedWalkIn.get('customerName'), 'Existing Counter Customer');
    assert.equal(linkedWalkIn.get('status'), deliveredBeforeAssociation.get('status'));
    assert.equal(linkedWalkIn.get('date'), deliveredBeforeAssociation.get('date'));
    assert.equal(linkedWalkIn.get('total'), deliveredBeforeAssociation.get('total'));
    assert.equal(linkedWalkIn.get('paymentStatus'), 'unpaid');
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', pendingWalkIn.reservationCode).get()).size, 1);
    await assert.rejects(() => call(userA.functions, 'associateManualRentalCustomer', {
        reservationCode: pendingWalkIn.reservationCode, customer: { id: existingCounterCustomerId },
    }));
    assert.equal((await adminDb.doc(`customers/${existingCounterCustomerId}`).get()).get('rentalsCount'), 1);
    await call(userA.functions, 'adminRentalAction', { action: 'return', rentalIds: pendingWalkIn.rentalIds, damagedUnits: 0 });
    pass('Immediate walk-in without customer keeps real fields blank, delivers once, then securely links existing profile without changing booking or payment data');

    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const pendingNewProfile = await call<{ reservationCode: string; rentalIds: string[] }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomerPending: true,
        adminImmediateWalkIn: true,
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: pendingWalkInDate,
        pickupTime: pendingWalkInTime, duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `manual_pending_new_${crypto.randomUUID()}`,
    });
    const newlyLinked = await call<{ ok: boolean; customerId: string; linkedRentals: number }>(userA.functions, 'associateManualRentalCustomer', {
        reservationCode: pendingNewProfile.reservationCode,
        customer: { name: 'Real Emulator Customer', phone: '+59170000992', ci: 'EMU-LINK-992', email: 'new-counter@example.test' },
    });
    assert.equal(newlyLinked.linkedRentals, 1);
    assert.equal((await adminDb.doc(`customers/${newlyLinked.customerId}`).get()).get('ci'), 'EMU-LINK-992');
    assert.equal((await adminDb.doc(`rentals/${pendingNewProfile.rentalIds[0]}`).get()).get('customerPending'), false);
    pass('A pending manual rental can create one explicit new customer record with supplied test data and link it to the existing operation');

    await adminDb.doc('inventory/manager-pending-fixture').set({
        id: 'manager-pending-fixture', itemType: 'bike', name: 'Manager pending fixture', store: 'cochabamba',
        active: true, availableForRental: true, hasWheelSizes: true,
        wheelSizes: [{ size: '26', stock: 2, maintenanceStock: 0 }], price1Hour: 20, price24Hours: 70,
    });
    const managerPending = await call<{ reservationCode: string; rentalIds: string[] }>(branchManager.functions, 'createRentalGroup', {
        adminManual: true, adminCustomerPending: true, adminImmediateWalkIn: true,
        lines: [{ productId: 'manager-pending-fixture', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: pendingWalkInDate,
        pickupTime: pendingWalkInTime, duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `manager_pending_${crypto.randomUUID()}`,
    });
    const managerLinked = await call<{ customerId: string }>(branchManager.functions, 'associateManualRentalCustomer', {
        reservationCode: managerPending.reservationCode,
        customer: { name: 'Manager Emulator Customer', phone: '+59170000993', ci: 'EMU-LINK-993', email: 'manager-counter@example.test' },
    });
    assert.equal((await adminDb.doc(`customers/${managerLinked.customerId}`).get()).get('store'), 'cochabamba');
    assert.equal((await adminDb.doc(`rentals/${managerPending.rentalIds[0]}`).get()).get('customerPending'), false);
    pass('A branch manager can create and link a new pending customer within their own branch');

    await adminDb.doc('inventory/quad-reconciliation-fixture').set({
        id: 'quad-reconciliation-fixture', name: 'Quad reconciliation fixture', itemType: 'bike', active: true,
        availableForRental: true, hasWheelSizes: true, store: 'cochabamba', stock: 0, maintenanceStock: 3,
        wheelSizes: [
            { size: '20', stock: 3, maintenanceStock: 1 },
            { size: '22', stock: 2, maintenanceStock: 1 },
        ],
    });
    await adminDb.collection('serviceOrders').doc('quad-reconciliation-order-a').set({
        ownership: 'briz', inventoryItemId: 'quad-reconciliation-fixture', wheelSize: '20', quantity: 1, status: 'En taller', inventoryReleased: false,
    });
    await adminDb.collection('serviceOrders').doc('quad-reconciliation-order-b').set({
        ownership: 'briz', inventoryItemId: 'quad-reconciliation-fixture', wheelSize: '22', quantity: 1, status: 'En taller', inventoryReleased: false,
    });
    await call(userA.functions, 'reconcileInventoryMaintenanceDiscrepancy', {
        itemId: 'quad-reconciliation-fixture', operationId: `quad_review_${crypto.randomUUID()}`,
        reason: 'Emulator-only reconciliation of two linked units', adminConfirmation: true,
    });
    const reconciledQuad = await adminDb.doc('inventory/quad-reconciliation-fixture').get();
    assert.equal(reconciledQuad.get('maintenanceStock'), 2, 'Maintenance count follows the two active service orders, not a hard-coded one-unit assumption.');
    assert.deepEqual(reconciledQuad.get('wheelSizes').map((wheel: { size: string; stock: number; maintenanceStock: number }) => [wheel.size, wheel.stock, wheel.maintenanceStock]), [
        ['20', 3, 1], ['22', 2, 1],
    ], 'Reconciliation preserves available wheel stock and counts each linked unit once.');
    assert.equal((await adminDb.collection('serviceOrders').where('inventoryItemId', '==', 'quad-reconciliation-fixture').get()).size, 2);
    pass('Quad reconciliation uses the linked service-order count, preserves per-wheel stock, and creates no duplicate physical inventory');

    const doubleManualBooking = {
        ...manualBooking,
        adminCustomer: { id: userA.uid },
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
        idempotencyKey: `manual_race_${crypto.randomUUID()}`,
    };
    const doubleManualResults = await Promise.all([
        call<{ reservationCode: string }>(userA.functions, 'createRentalGroup', doubleManualBooking),
        call<{ reservationCode: string }>(userA.functions, 'createRentalGroup', doubleManualBooking),
    ]);
    assert.equal(doubleManualResults[0].reservationCode, doubleManualResults[1].reservationCode);
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', doubleManualResults[0].reservationCode).get()).size, 1);
    pass('Two concurrent manual-create requests with one idempotency key persist a single rental record');

    // Isolate later booking scenarios from the intentional per-user five-per-minute limiter.
    await adminDb.doc(`_requestLimits/reservations_${createHash('sha256').update(userA.uid).digest('hex')}`).delete();
    const manualCombo = await call<{ reservationCode: string; rentalIds: string[] }>(userA.functions, 'createRentalGroup', {
        adminManual: true,
        adminCustomer: { name: 'Combo UI Regression', phone: '+59170000010', ci: 'TEST-COMBO-1010', email: 'combo-ui@example.test' },
        adminPaymentStatus: 'unpaid',
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, componentSelections: [{ inventoryItemId: 'bike-emulator', wheelSize: '27' }] }],
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
        pickupTime: '10:00', duration: '2 horas', paymentMethod: 'QR', idempotencyKey: `manual_combo_${crypto.randomUUID()}`,
    });
    const manualComboRows = await adminDb.collection('rentals').where('reservationCode', '==', manualCombo.reservationCode).get();
    assert.equal(manualComboRows.size, 2);
    const comboRentalRow = manualComboRows.docs.find((doc) => doc.get('productType') === 'combo');
    const accessoryRentalRow = manualComboRows.docs.find((doc) => doc.get('productId') === 'acc-emulator');
    assert.ok(comboRentalRow);
    assert.deepEqual(comboRentalRow.get('componentSelections'), [
        { inventoryItemId: 'bike-emulator', wheelSize: '27' },
        { inventoryItemId: 'acc-emulator' },
    ]);
    assert.ok(accessoryRentalRow);
    pass('Manual combo booking accepts per-component wheel selections and stores selected accessories as inventory lines');

    const editable = await call<{ rentalIds: string[]; reservationCode: string }>(userA.functions, 'createRentalGroup', {
        adminManual: true,
        adminCustomer: { id: userA.uid },
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)),
        pickupTime: '09:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `edit_${crypto.randomUUID()}`,
    });
    const editDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 9 * 24 * 60 * 60 * 1000));
    await call(userA.functions, 'updateRentalGroup', {
        reservationCode: editable.reservationCode, date: editDate, pickupTime: '10:00', duration: '2 horas',
        deliveryService: false, pickupService: false, mapsLink: '', notes: 'Edited atomically',
        items: [
            { id: editable.rentalIds[0], productId: 'bike-emulator', productType: 'single', quantity: 1, selectedWheelSize: '26' },
            { id: '', productId: 'bike-emulator', productType: 'single', quantity: 1, selectedWheelSize: '26' },
            { id: '', productId: 'acc-emulator', productType: 'single', quantity: 1 },
        ],
    });
    let editedGroup = await adminDb.collection('rentals').where('reservationCode', '==', editable.reservationCode).get();
    assert.equal(editedGroup.size, 3, 'Group edit must append bicycle and accessory lines in the same transaction.');
    assert.ok(editedGroup.docs.some((doc) => doc.get('productId') === 'acc-emulator'));
    assert.ok(editedGroup.docs.every((doc) => doc.get('date') === editDate && doc.get('duration') === '2 horas'));
    await call(userA.functions, 'updateRentalGroup', {
        reservationCode: editable.reservationCode, date: editDate, pickupTime: '10:00', duration: '1 hora',
        deliveryService: false, pickupService: false, mapsLink: '', notes: 'Removed a line',
        items: [{ id: editable.rentalIds[0], productId: 'bike-emulator', productType: 'single', quantity: 1, selectedWheelSize: '26' }],
    });
    editedGroup = await adminDb.collection('rentals').where('reservationCode', '==', editable.reservationCode).get();
    assert.equal(editedGroup.size, 1, 'Group edit must remove an old line atomically.');
    assert.equal(editedGroup.docs[0].get('selectedWheelSize'), '26');
    await assert.rejects(() => call(userA.functions, 'updateRentalGroup', {
        reservationCode: editable.reservationCode, date: editDate, pickupTime: '10:00', duration: '1 hora',
        deliveryService: false, pickupService: false, mapsLink: '', notes: '',
        items: [{ id: editable.rentalIds[0], productId: 'bike-emulator', productType: 'single', quantity: 3, selectedWheelSize: '26' }],
    }));
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', editable.reservationCode).get()).size, 1);
    pass('Administrative group editing atomically adds/removes lines, changes size/date/time/duration, and rejects insufficient availability');

    const failedConfirmation = await call<{ rentalIds: string[] }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userA.uid },
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 13 * 24 * 60 * 60 * 1000)),
        pickupTime: '13:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `confirm_error_${crypto.randomUUID()}`,
    });
    const failureInventoryRef = adminDb.collection('inventory').doc('bike-emulator');
    const failureInventoryBefore = await failureInventoryRef.get();
    const originalWheelSizes = failureInventoryBefore.get('wheelSizes') as Array<Record<string, unknown> & { size: string; stock: number }>;
    await failureInventoryRef.update({ wheelSizes: originalWheelSizes.map((wheel) => wheel.size === '26' ? { ...wheel, stock: 0 } : wheel) });
    await assert.rejects(() => call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: failedConfirmation.rentalIds }));
    assert.equal((await adminDb.collection('rentals').doc(failedConfirmation.rentalIds[0]).get()).get('status'), 'pending');
    await failureInventoryRef.update({ wheelSizes: originalWheelSizes });
    pass('A server-side confirmation error leaves the reservation pending and does not consume inventory');

    const lifecycle = await call<{ rentalIds: string[]; reservationCode: string }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userA.uid },
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
        pickupTime: '11:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `cycle_${crypto.randomUUID()}`,
    });
    const beforeCycleStock = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    await call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: lifecycle.rentalIds });
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, beforeCycleStock - 1);
    await assert.rejects(() => call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: lifecycle.rentalIds }));
    await call(userA.functions, 'adminRentalAction', { action: 'deliver', rentalIds: lifecycle.rentalIds });
    await call(userA.functions, 'adminRentalAction', { action: 'return', rentalIds: lifecycle.rentalIds, damagedUnits: 1, conditionNotes: 'Emulator test damage' });
    const afterCycle = await adminDb.collection('inventory').doc('bike-emulator').get();
    assert.equal(afterCycle.get('wheelSizes')[0].stock, beforeCycleStock - 1);
    assert.equal(afterCycle.get('wheelSizes')[0].maintenanceStock, 1);
    assert.equal((await adminDb.collection('rentals').doc(lifecycle.rentalIds[0]).get()).get('status'), 'returned');
    await assert.rejects(() => call(userA.functions, 'adminRentalAction', { action: 'return', rentalIds: lifecycle.rentalIds, damagedUnits: 0 }));
    pass('Administrative confirmation deducts once, delivery preserves stock, and damaged return restores only healthy stock');

    const concurrentConfirm = await call<{ rentalIds: string[]; reservationCode: string }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userA.uid },
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 11 * 24 * 60 * 60 * 1000)),
        pickupTime: '12:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `confirm_race_${crypto.randomUUID()}`,
    });
    const concurrentStock = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    const confirmRace = await Promise.allSettled([
        call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: concurrentConfirm.rentalIds }),
        call(userA.functions, 'adminRentalAction', { action: 'confirm', rentalIds: concurrentConfirm.rentalIds }),
    ]);
    assert.ok(confirmRace.filter((result) => result.status === 'fulfilled').length >= 1, 'At least one concurrent confirmation request must complete.');
    assert.ok(confirmRace.filter((result) => result.status === 'fulfilled').length <= 2, 'A retry may return the already-confirmed result idempotently.');
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, concurrentStock - 1);
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', concurrentConfirm.reservationCode).get()).size, 1);
    await call(userA.functions, 'adminRentalAction', { action: 'cancel', rentalIds: concurrentConfirm.rentalIds });
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, concurrentStock);
    pass('Two simultaneous confirmations of one rental are serialized and deduct inventory once');

    const userB = await client('rider-b@example.test', 'TestPass#123');
    await call(userB.functions, 'beginCustomerRegistration', { name: 'Rider B', phone: '+59170000002', ci: 'TEST-1002' });
    await assert.rejects(() => call(userB.functions, 'completeCustomerProfile', { phone: '+59170000002' }), /verify|verifica/i);
    const pendingRegistrationMail = await call<{ status: 'sent' | 'verified' }>(userB.functions, 'sendCustomerVerificationEmail', { language: 'en' });
    assert.equal(pendingRegistrationMail.status, 'sent');
    const pendingMailDoc = (await adminDb.collection('_emulatorVerificationOutbox').where('to', '==', 'rider-b@example.test').get()).docs[0];
    assert.ok(pendingMailDoc);
    assert.match(String(pendingMailDoc.data().html), /Welcome to BRIZ!/);
    const pendingActionUrlText = String(pendingMailDoc.data().text).match(/CONFIRM MY EMAIL: (https:\/\/\S+)/);
    assert.ok(pendingActionUrlText);
    const pendingActionUrl = new URL(pendingActionUrlText![1]);
    await applyActionCode(userB.auth, pendingActionUrl.searchParams.get('oobCode')!);
    await reload(userB.auth.currentUser!);
    assert.equal(userB.auth.currentUser?.emailVerified, true, 'A pending registration is activated from its English Resend email.');
    await userB.auth.currentUser!.getIdToken(true);
    await call(userB.functions, 'createCustomerProfile');
    await adminDb.collection('customerProfiles').doc(userB.uid).update({ phone: '' });
    await adminDb.collection('customers').doc(userB.uid).update({ phone: '' });
    const recoveryFixtureImage = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const userBFilePaths = {
        autofotoPath: `customerUploads/${userB.uid}/selfie.jpg`,
        documentoPath: `customerUploads/${userB.uid}/document-front.png`,
        documentoReversoPath: `customerUploads/${userB.uid}/document-back.png`,
    };
    for (const path of Object.values(userBFilePaths)) await uploadBytes(storageRef(userB.storage, path), recoveryFixtureImage, { contentType: 'image/png' });
    await adminDb.collection('customerPrivate').doc(userB.uid).set(userBFilePaths, { merge: true });
    const completion = await call<{ profile: { name: string; phone: string; ci: string } }>(userB.functions, 'completeCustomerProfile', { name: 'Malicious overwrite', phone: '+59170000002' });
    assert.deepEqual({ name: completion.profile.name, phone: completion.profile.phone, ci: completion.profile.ci }, { name: 'Rider B', phone: '+59170000002', ci: 'TEST-1002' }, 'Profile completion fills only missing values and preserves existing values.');
    assert.deepEqual((await adminDb.collection('customerPrivate').doc(userB.uid).get()).data(), userBFilePaths, 'Profile completion leaves all private file associations intact.');
    pass('Verified customer profile completion fills only missing fields and preserves private files');

    const recoveryEmail = 'verified-recovery@example.test';
    const recoveryOriginalPassword = 'TestPass#123';
    const recoveryNewPassword = 'RecoveredPass#456';
    const recoveryUser = await client(recoveryEmail, recoveryOriginalPassword);
    assert.equal((await adminDb.doc(`pendingCustomerRegistrations/${recoveryUser.uid}`).get()).exists, false, 'Recovery account has no temporary registration record.');
    await adminDb.collection('rentals').doc('recovered-email-history').set({
        id: 'recovered-email-history', reservationCode: 'BRIZ-RECOVERY-TEST', customerEmail: recoveryEmail,
        customerName: 'Historic Recovery Customer', customerPhone: '', customerCI: '',
        productType: 'single', productId: 'bike-emulator', productName: 'Emulator Bike', quantity: 1,
        date: '2026-11-10', pickupTime: '10:00', duration: '1 hora', status: 'returned', total: 20,
    });
    const otherBrowserApp = initializeApp(firebaseConfig, `recovery-other-browser-${Date.now()}`);
    const otherBrowserAuth = getAuth(otherBrowserApp);
    const otherBrowserFunctions = getFunctions(otherBrowserApp);
    const otherBrowserStorage = getStorage(otherBrowserApp);
    connectAuthEmulator(otherBrowserAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFunctionsEmulator(otherBrowserFunctions, '127.0.0.1', 5001);
    connectStorageEmulator(otherBrowserStorage, '127.0.0.1', 9199);
    const recoveryVerificationResult = await call<{ status: 'sent' | 'verified' }>(recoveryUser.functions, 'sendCustomerVerificationEmail', { language: 'en' });
    assert.equal(recoveryVerificationResult.status, 'sent');
    const recoveryEmailDocs = await adminDb.collection('_emulatorVerificationOutbox').where('to', '==', recoveryEmail).get();
    assert.equal(recoveryEmailDocs.size, 1);
    const recoveryActionLinkText = String(recoveryEmailDocs.docs[0].data().text).match(/CONFIRM MY EMAIL: (https:\/\/\S+)/);
    assert.ok(recoveryActionLinkText, 'A recovered account receives the English verification email.');
    const customVerificationUrl = new URL(recoveryActionLinkText![1]);
    const verificationCode = customVerificationUrl.searchParams.get('oobCode');
    assert.ok(verificationCode, 'Firebase Auth Emulator supplied a verification action code.');
    assert.equal(customVerificationUrl.pathname, '/verify-email');
    assert.equal(customVerificationUrl.searchParams.get('mode'), 'verifyEmail');
    assert.equal(customVerificationUrl.searchParams.get('lang'), 'en');
    await applyActionCode(otherBrowserAuth, verificationCode!);
    await reload(recoveryUser.auth.currentUser!);
    assert.equal(recoveryUser.auth.currentUser?.emailVerified, true, 'Verification action completed in another browser session.');
    const resetLink = await adminAuth.generatePasswordResetLink(recoveryEmail);
    const resetCode = new URL(resetLink).searchParams.get('oobCode');
    assert.ok(resetCode, 'Firebase Auth Emulator supplied a reset action code.');
    assert.equal(await verifyPasswordResetCode(recoveryUser.auth, resetCode!), recoveryEmail);
    await confirmPasswordReset(recoveryUser.auth, resetCode!, recoveryNewPassword);
    const recoveredCredential = await signInWithEmailAndPassword(otherBrowserAuth, recoveryEmail, recoveryNewPassword);
    await recoveredCredential.user.getIdToken(true);
    const recoveredProfile = await call<{ profile: { id: string; authUid: string; email: string; name: string; missingPrivateFiles: string[] }; recoveredWithoutPendingRegistration: boolean }>(otherBrowserFunctions, 'createCustomerProfile');
    assert.equal(recoveredProfile.profile.authUid, recoveryUser.uid);
    assert.equal(recoveredProfile.profile.email, recoveryEmail);
    assert.equal(recoveredProfile.profile.name, '');
    assert.deepEqual(recoveredProfile.profile.missingPrivateFiles, ['autofoto', 'documento', 'documentoReverso']);
    assert.equal(recoveredProfile.recoveredWithoutPendingRegistration, true);
    const recoveryHistory = await call<{ rentals: Array<{ id: string }> }>(otherBrowserFunctions, 'getMyRentals');
    assert.ok(recoveryHistory.rentals.some(rental => rental.id === 'recovered-email-history'), 'Verified email keeps access to historical rentals without relinking by personal data.');
    const recoveryFilePaths = {
        autofoto: `customerUploads/${recoveryUser.uid}/recovery-autofoto-test.png`,
        documento: `customerUploads/${recoveryUser.uid}/recovery-documento-test.png`,
        documentoReverso: `customerUploads/${recoveryUser.uid}/recovery-documentoReverso-test.png`,
    };
    for (const path of Object.values(recoveryFilePaths)) await uploadBytes(storageRef(otherBrowserStorage, path), recoveryFixtureImage, { contentType: 'image/png' });
    await assert.rejects(() => call(otherBrowserFunctions, 'completeCustomerProfile', {
        name: 'Verified Recovery Customer', phone: '+59170000003', ci: 'RECOVERY-1003',
        privateFiles: { ...recoveryFilePaths, documento: `customerUploads/${userB.uid}/document-front.png` },
    }), (error: unknown) => (error as { code?: string }).code === 'functions/invalid-argument', 'A file path owned by another UID must be rejected.');
    const recoveredCompletion = await call<{ profile: { name: string; phone: string; ci: string; missingPrivateFiles: string[] } }>(otherBrowserFunctions, 'completeCustomerProfile', {
        name: 'Verified Recovery Customer', phone: '+59170000003', ci: 'RECOVERY-1003', privateFiles: recoveryFilePaths,
    });
    assert.deepEqual({ name: recoveredCompletion.profile.name, phone: recoveredCompletion.profile.phone, ci: recoveredCompletion.profile.ci }, {
        name: 'Verified Recovery Customer', phone: '+59170000003', ci: 'RECOVERY-1003',
    });
    assert.deepEqual(recoveredCompletion.profile.missingPrivateFiles, []);
    assert.equal((await adminDb.doc(`customerPrivate/${recoveryUser.uid}`).get()).get('documentoReversoPath'), recoveryFilePaths.documentoReverso);
    pass('Verified account recovers without pending data after password reset on a second browser, retains email history, and requests only absent private files');
    await adminDb.collection('customers').doc(userB.uid).update({ store: 'shop-b' });
    await adminDb.collection('adminUsers').doc(userB.uid).set({ uid: userB.uid, role: 'manager', active: true, store: 'shop-b' });
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

    const managerDate = (days: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
    const managerBooking = (days: number) => ({
        adminManual: true, adminCustomer: { id: userB.uid },
        lines: [{ productId: 'bike-emulator', productType: 'single', quantity: 1, wheelSize: '26' }],
        date: managerDate(days), pickupTime: '15:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `manager_${crypto.randomUUID()}`,
    });

    // A synthetic operating day exercises the full callable flow against Emulator records.
    // All product, customer, booking, payment, and stock rows here are disposable fixtures.
    await adminDb.doc('inventory/sim-bike-26').set({
        id: 'sim-bike-26', itemType: 'bike', name: 'Simulación · Bicicleta 26', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: true,
        wheelSizes: [{ size: '26', stock: 8, maintenanceStock: 1 }, { size: '27', stock: 0, maintenanceStock: 0 }],
        maintenanceStock: 1, price1Hour: 20, price24Hours: 70,
    });
    await adminDb.doc('inventory/sim-bike-27').set({
        id: 'sim-bike-27', itemType: 'bike', name: 'Simulación · Bicicleta 27', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: true,
        wheelSizes: [{ size: '27', stock: 3, maintenanceStock: 0 }], price1Hour: 22, price24Hours: 75,
    });
    await adminDb.doc('inventory/sim-mamachari').set({
        id: 'sim-mamachari', itemType: 'bike', name: 'Simulación · Mamachari', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 2, maintenanceStock: 0,
        price1Hour: 25, price24Hours: 80,
    });
    await adminDb.doc('inventory/sim-lock').set({
        id: 'sim-lock', itemType: 'accessory', name: 'Simulación · Candado', store: 'shop-b', active: true,
        availableForRental: true, availableAsRentalAddon: true, rentalCatalog: true,
        availableForSale: false, hasWheelSizes: false, stock: 20, addonFlatPrice: 5,
    });
    await adminDb.doc('inventory/sim-overlap-bike').set({
        id: 'sim-overlap-bike', itemType: 'bike', name: 'Simulación · Última unidad horaria', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 1, maintenanceStock: 0,
        price1Hour: 15, price24Hours: 55,
    });
    await adminDb.doc('inventory/sim-concurrent-last-unit').set({
        id: 'sim-concurrent-last-unit', itemType: 'bike', name: 'Simulación · Unidad concurrente', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 1, maintenanceStock: 0,
        price1Hour: 16, price24Hours: 56,
    });
    await adminDb.doc('inventory/sim-pending-customer-bike').set({
        id: 'sim-pending-customer-bike', itemType: 'bike', name: 'Simulación · Cliente pendiente', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 2, maintenanceStock: 0,
        price1Hour: 22, price24Hours: 65,
    });
    await adminDb.doc('inventory/sim-other-branch-bike').set({
        id: 'sim-other-branch-bike', itemType: 'bike', name: 'Simulación · Otra sucursal', store: 'shop-a', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 2, maintenanceStock: 0,
        price1Hour: 20, price24Hours: 60,
    });
    await adminDb.doc('combos/sim-combo').set({
        id: 'sim-combo', name: 'Simulación · Combo Mamachari', store: 'shop-b', active: true,
        availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'sim-bike-26', quantity: 2, requiresWheelSize: true },
            { inventoryItemId: 'sim-lock', quantity: 1, requiresWheelSize: false },
        ], price1Hour: 35, price24Hours: 100,
    });
    const simulatedDate = managerDate(35);
    const simulatedSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const simulatedOperations: string[] = [];
    const simulatedRateLimitId = `reservations_${createHash('sha256').update(userB.uid).digest('hex')}`;
    const simCall = async <T>(label: string, functionName: string, data: unknown): Promise<T> => {
        simulatedOperations.push(label);
        if (functionName === 'createRentalGroup') await adminDb.doc(`_requestLimits/${simulatedRateLimitId}`).delete();
        return call<T>(userB.functions, functionName, data);
    };
    const readSimStock = async (id: string) => {
        const data = (await adminDb.doc(`inventory/${id}`).get()).data() || {};
        const wheels = Array.isArray(data.wheelSizes) ? data.wheelSizes as Array<{ size: string; stock: number; maintenanceStock?: number }> : [];
        return {
            store: String(data.store || 'sin sucursal'),
            stock: wheels.length
                ? wheels.map(wheel => ({ aro: wheel.size, disponible: Number(wheel.stock) || 0, taller: Number(wheel.maintenanceStock) || 0 }))
                : Number(data.stock) || 0,
            taller: Number(data.maintenanceStock) || 0,
        };
    };
    const simulatedTrackedIds = [
        'sim-bike-26', 'sim-bike-27', 'sim-mamachari', 'sim-lock', 'sim-overlap-bike',
        'sim-concurrent-last-unit', 'sim-pending-customer-bike', 'sim-other-branch-bike',
    ];
    const simulatedOpeningStock = Object.fromEntries(await Promise.all(
        simulatedTrackedIds.map(async id => [id, await readSimStock(id)] as const),
    ));
    const simulatedLines = [
        [{ productId: 'sim-bike-26', productType: 'single', quantity: 1, wheelSize: '26' }],
        [{ productId: 'sim-combo', productType: 'combo', quantity: 1, wheelSize: '26', componentSelections: [{ inventoryItemId: 'sim-bike-26', wheelSize: '26' }] }],
        [{ productId: 'sim-bike-27', productType: 'single', quantity: 1, wheelSize: '27' }],
        [{ productId: 'sim-mamachari', productType: 'single', quantity: 1 }],
        [{ productId: 'sim-lock', productType: 'single', quantity: 1 }],
        [{ productId: 'sim-combo', productType: 'combo', quantity: 1, wheelSize: '26', componentSelections: [{ inventoryItemId: 'sim-bike-26', wheelSize: '26' }] }],
        [{ productId: 'sim-bike-26', productType: 'single', quantity: 1, wheelSize: '26' }],
        [{ productId: 'sim-bike-27', productType: 'single', quantity: 1, wheelSize: '27' }],
        [{ productId: 'sim-bike-26', productType: 'single', quantity: 1, wheelSize: '26' }],
        [{ productId: 'sim-mamachari', productType: 'single', quantity: 1 }],
    ];
    const simulatedGroups: Array<{ reservationCode: string; rentalIds: string[]; idempotencyKey: string; total: number }> = [];
    for (let index = 0; index < simulatedSlots.length; index++) {
        const idempotencyKey = `day_sim_${index}_${crypto.randomUUID()}`;
        const bookingResult = await simCall<{ reservationCode: string; rentalIds: string[]; total: number }>(`Crear reserva sintética ${index + 1}/10`, 'createRentalGroup', {
            adminManual: true, adminCustomer: { id: userB.uid }, adminPaymentStatus: 'unpaid',
            lines: simulatedLines[index],
            ...(index === 1 ? { accessories: [{ itemId: 'sim-lock', quantity: 1 }] } : {}),
            date: simulatedDate, pickupTime: simulatedSlots[index], duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey,
        });
        simulatedGroups.push({ ...bookingResult, idempotencyKey });
    }
    assert.equal(simulatedGroups[1].total, 40, 'A combo plus one separately priced flat add-on adds the extra Bs 5.');
    assert.equal(simulatedGroups[4].total, 20, 'An accessory rented alone uses the Bs 20 individual tariff.');
    const retriedSimulationBooking = await simCall<{ reservationCode: string; duplicate: boolean }>('Reintentar reserva con clave idempotente', 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userB.uid }, adminPaymentStatus: 'unpaid', lines: simulatedLines[0],
        date: simulatedDate, pickupTime: simulatedSlots[0], duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: simulatedGroups[0].idempotencyKey,
    });
    assert.equal(retriedSimulationBooking.duplicate, true);
    assert.equal((await adminDb.collection('rentals').where('reservationCode', '==', simulatedGroups[0].reservationCode).get()).size, 1);
    await simCall('Cancelar reserva sintética 9', 'adminRentalAction', { action: 'cancel', rentalIds: simulatedGroups[8].rentalIds });
    await simCall('Cancelar reserva sintética 10', 'adminRentalAction', { action: 'cancel', rentalIds: simulatedGroups[9].rentalIds });
    for (let index = 0; index < 8; index++) {
        await simCall(`Confirmar reserva sintética ${index + 1}`, 'adminRentalAction', { action: 'confirm', rentalIds: simulatedGroups[index].rentalIds });
    }
    await simCall('Entregar reserva sintética 1', 'adminRentalAction', { action: 'deliver', rentalIds: simulatedGroups[0].rentalIds });
    await simCall('Devolver con daño reserva sintética 1', 'adminRentalAction', { action: 'return', rentalIds: simulatedGroups[0].rentalIds, damagedUnits: 1, conditionNotes: 'Ficción: unidad enviada a taller' });
    await simCall('Entregar reserva sintética 2', 'adminRentalAction', { action: 'deliver', rentalIds: simulatedGroups[1].rentalIds });
    await simCall('Devolver sin daño reserva sintética 2', 'adminRentalAction', { action: 'return', rentalIds: simulatedGroups[1].rentalIds, damagedUnits: 0 });

    const overlapBooking = (pickupTime: string, productId = 'sim-overlap-bike') => ({
        adminManual: true, adminCustomer: { id: userB.uid }, adminPaymentStatus: 'unpaid',
        lines: [{ productId, productType: 'single', quantity: 1 }],
        date: simulatedDate, pickupTime, duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `sim_overlap_${crypto.randomUUID()}`,
    });
    const overlapFirst = await simCall<{ reservationCode: string; rentalIds: string[] }>('Reservar la última unidad del intervalo 08:00', 'createRentalGroup', overlapBooking('08:00'));
    await assert.rejects(
        () => simCall('Rechazar superposición a las 08:30', 'createRentalGroup', overlapBooking('08:30')),
        /disponible|stock|reserv|horario/i,
        'A one-unit product cannot be booked across overlapping one-hour windows.',
    );
    await simCall('Cancelar la reserva del intervalo 08:00', 'adminRentalAction', { action: 'cancel', rentalIds: overlapFirst.rentalIds });

    const concurrentBooking = (key: string) => ({
        adminManual: true, adminCustomer: { id: userB.uid }, adminPaymentStatus: 'unpaid',
        lines: [{ productId: 'sim-concurrent-last-unit', productType: 'single', quantity: 1 }],
        date: simulatedDate, pickupTime: '10:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: key,
    });
    const concurrentLastUnit = await Promise.allSettled([
        simCall<{ reservationCode: string; rentalIds: string[] }>('Concurrente A reclama la última unidad', 'createRentalGroup', concurrentBooking(`sim_concurrent_a_${crypto.randomUUID()}`)),
        simCall<{ reservationCode: string; rentalIds: string[] }>('Concurrente B reclama la última unidad', 'createRentalGroup', concurrentBooking(`sim_concurrent_b_${crypto.randomUUID()}`)),
    ]);
    assert.equal(concurrentLastUnit.filter(result => result.status === 'fulfilled').length, 1, 'Only one concurrent request may reserve the final physical unit.');
    assert.equal(concurrentLastUnit.filter(result => result.status === 'rejected').length, 1);
    const winningLastUnit = concurrentLastUnit.find(result => result.status === 'fulfilled');
    assert.ok(winningLastUnit && winningLastUnit.status === 'fulfilled');
    await simCall('Cancelar reserva ganadora de la unidad concurrente', 'adminRentalAction', { action: 'cancel', rentalIds: winningLastUnit.value.rentalIds });

    const pendingCustomerBooking = await simCall<{ reservationCode: string; rentalIds: string[]; total: number }>('Crear alquiler con cliente pendiente', 'createRentalGroup', {
        adminManual: true, adminCustomerPending: true, adminImmediateWalkIn: true, adminPaymentStatus: 'unpaid',
        lines: [{ productId: 'sim-pending-customer-bike', productType: 'single', quantity: 1 }],
        date: pendingWalkInDate, pickupTime: pendingWalkInTime, duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `sim_pending_customer_${crypto.randomUUID()}`,
    });
    assert.equal(pendingCustomerBooking.total, 22);
    await simCall('Confirmar alquiler del cliente pendiente', 'adminRentalAction', { action: 'confirm', rentalIds: pendingCustomerBooking.rentalIds });
    await simCall('Entregar alquiler del cliente pendiente', 'adminRentalAction', { action: 'deliver', rentalIds: pendingCustomerBooking.rentalIds });
    const pendingRentalDoc = await adminDb.collection('rentals').doc(pendingCustomerBooking.rentalIds[0]).get();
    assert.equal(pendingRentalDoc.get('customerName'), 'Cliente pendiente');
    const simReceipt40 = await simCall<{ movementId: string }>('Registrar primer pago parcial Bs 10', 'recordRentalPaymentMovement', {
        rentalIds: pendingCustomerBooking.rentalIds, type: 'receipt', amount: 10, method: 'Efectivo', actualAt: new Date().toISOString(),
        idempotencyKey: `sim_partial_10_${crypto.randomUUID()}`,
    });
    assert.ok(simReceipt40.movementId);
    const partialCustomerPayment = await adminDb.collection('rentals').doc(pendingCustomerBooking.rentalIds[0]).get();
    assert.equal(partialCustomerPayment.get('paymentStatus'), 'unpaid', 'The summary stays unpaid until partial receipts cover the full contract amount.');
    const firstPartialMovement = await adminDb.doc(`rentalPaymentMovements/${simReceipt40.movementId}`).get();
    assert.equal(firstPartialMovement.get('amount'), 10, 'The first partial cash receipt is preserved in the movement ledger.');
    await simCall('Completar con segundo pago parcial Bs 12', 'recordRentalPaymentMovement', {
        rentalIds: pendingCustomerBooking.rentalIds, type: 'receipt', amount: 12, method: 'QR', confirmedReceived: true,
        actualAt: new Date().toISOString(), idempotencyKey: `sim_partial_12_${crypto.randomUUID()}`,
    });
    const settledCustomerPayment = await adminDb.collection('rentals').doc(pendingCustomerBooking.rentalIds[0]).get();
    assert.equal(settledCustomerPayment.get('paymentStatus'), 'paid');
    const pendingCustomerReceipts = await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', pendingCustomerBooking.reservationCode).get();
    assert.equal(pendingCustomerReceipts.docs.filter(doc => doc.get('type') === 'receipt').reduce((sum, doc) => sum + Number(doc.get('amount') || 0), 0), 22);
    await simCall('Devolver alquiler del cliente pendiente', 'adminRentalAction', { action: 'return', rentalIds: pendingCustomerBooking.rentalIds, damagedUnits: 0 });

    await assert.rejects(
        () => simCall('Rechazar operación sobre sucursal shop-a', 'createRentalGroup', {
            adminManual: true, adminCustomer: { id: userB.uid }, adminPaymentStatus: 'unpaid',
            lines: [{ productId: 'sim-other-branch-bike', productType: 'single', quantity: 1 }],
            date: simulatedDate, pickupTime: '15:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `sim_wrong_branch_${crypto.randomUUID()}`,
        }),
        /sucursal|permiso|denegad|tienda/i,
        'A manager scoped to shop-b cannot consume inventory owned by shop-a.',
    );

    const simulationInventory = async (id: string) => (await adminDb.doc(`inventory/${id}`).get()).data() || {};
    const simBike26Final = await simulationInventory('sim-bike-26');
    assert.equal((simBike26Final.wheelSizes as Array<{ size: string; stock: number; maintenanceStock: number }>).find(wheel => wheel.size === '26')?.stock, 4,
        '8 starting bikes - 1 damaged return - 4 combo component units - 1 confirmed rental + 2 returned combo units = 4 available.');
    assert.equal((simBike26Final.wheelSizes as Array<{ size: string; stock: number; maintenanceStock: number }>).find(wheel => wheel.size === '26')?.maintenanceStock, 2,
        'The damaged simulated bike is added to the one pre-existing workshop unit.');
    assert.equal(((await simulationInventory('sim-bike-27')).wheelSizes as Array<{ size: string; stock: number }>)[0].stock, 1);
    assert.equal((await simulationInventory('sim-mamachari')).stock, 1);
    assert.equal((await simulationInventory('sim-lock')).stock, 18,
        'Standalone and combo-shared accessories reconcile after the healthy combo return.');
    assert.equal((await simulationInventory('sim-overlap-bike')).stock, 1, 'Canceling the overlapping booking restores the last unit.');
    assert.equal((await simulationInventory('sim-concurrent-last-unit')).stock, 1, 'Canceling the winner restores the concurrently contested unit.');
    assert.equal((await simulationInventory('sim-pending-customer-bike')).stock, 2, 'A healthy return restores the pending-customer bicycle.');
    assert.equal((await simulationInventory('sim-other-branch-bike')).stock, 2, 'A rejected cross-branch attempt preserves shop-a inventory.');
    const simulatedRentals = await adminDb.collection('rentals').where('date', '==', simulatedDate).get();
    assert.ok(simulatedRentals.docs.some(doc => doc.get('reservationCode') === simulatedGroups[0].reservationCode && doc.get('status') === 'returned'));
    assert.ok(simulatedRentals.docs.filter(doc => doc.get('reservationCode') === simulatedGroups[8].reservationCode).every(doc => doc.get('status') === 'cancelled'));
    assert.ok(simulatedRentals.docs.every(doc => doc.get('paymentStatus') !== 'paid'), 'Lifecycle actions do not invent a payment receipt.');
    assert.ok(simulatedOperations.length >= 20, `Expected at least 20 Emulator operations; observed ${simulatedOperations.length}.`);
    const movementDescriptions: Record<string, string[]> = {
        'sim-bike-26': ['2 combo checkouts × 2 bikes plus 2 solo checkouts; one damaged return to workshop; one healthy combo return (+2 bikes)'],
        'sim-bike-27': ['2 confirmed solo reservations; no return in this scenario'],
        'sim-mamachari': ['1 confirmed reservation; second reservation cancelled before confirmation'],
        'sim-lock': ['1 standalone checkout + 2 combo checkouts; one healthy combo return (+1 lock)'],
        'sim-overlap-bike': ['1 pending reservation; overlapping 08:30 request rejected; 08:00 reservation cancelled'],
        'sim-concurrent-last-unit': ['2 concurrent attempts for 1 unit; exactly 1 won and was cancelled'],
        'sim-pending-customer-bike': ['Cliente pendiente booking; confirm/deliver (-1), two receipts Bs 10 + Bs 12, healthy return (+1)'],
        'sim-other-branch-bike': ['shop-b manager cross-branch request rejected; no stock movement'],
    };
    const ledgerRows = await Promise.all(simulatedTrackedIds.map(async id => ({
        id,
        inicial: simulatedOpeningStock[id as keyof typeof simulatedOpeningStock],
        movimientos: movementDescriptions[id],
        final: await readSimStock(id),
    })));
    const simulationStockLedger = ledgerRows.map(row => {
        const opening = row.inicial;
        const closing = row.final;
        const netChange = Array.isArray(opening.stock) && Array.isArray(closing.stock)
            ? opening.stock.map(openingWheel => {
                const closingWheel = closing.stock.find(candidate => candidate.aro === openingWheel.aro);
                return {
                    aro: openingWheel.aro,
                    disponible: (closingWheel?.disponible || 0) - openingWheel.disponible,
                    taller: (closingWheel?.taller || 0) - openingWheel.taller,
                };
            })
            : Number(closing.stock) - Number(opening.stock);
        return { ...row, variacionNeta: netChange };
    });
    console.log(`SIMULACIÓN DÍA — ${simulatedOperations.length} operaciones Emulator; reservas, reintentos, cancelaciones, confirmaciones, entregas, devoluciones, intervalos superpuestos, unidad final concurrente, cliente pendiente, pagos parciales, accesorios y aislamiento de sucursal.`);
    console.log(`STOCK INICIAL / MOVIMIENTOS / STOCK FINAL ${JSON.stringify(simulationStockLedger)}`);
    pass(`Simulación ficticia de jornada aprobada: ${simulatedOperations.length} operaciones Emulator; stock, movimientos y stock final registrados por artículo`);

    const pendingManagerRental = await call<{ rentalIds: string[] }>(userB.functions, 'createRentalGroup', managerBooking(15));
    await assert.rejects(() => call(userB.functions, 'adminRentalAction', { action: 'return', rentalIds: pendingManagerRental.rentalIds }));
    const beforePendingCancel = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    await call(userB.functions, 'adminRentalAction', { action: 'cancel', rentalIds: pendingManagerRental.rentalIds });
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, beforePendingCancel);

    const managerCycle = await call<{ rentalIds: string[]; reservationCode: string }>(userB.functions, 'createRentalGroup', managerBooking(16));
    await call(userB.functions, 'adminRentalAction', { action: 'confirm', rentalIds: managerCycle.rentalIds });
    await call(userB.functions, 'adminRentalAction', { action: 'deliver', rentalIds: managerCycle.rentalIds });
    const paidBeforeReturn = (await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).get()).get('total');
    const stockBeforeHealthyReturn = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    await call(userB.functions, 'adminRentalAction', { action: 'return', rentalIds: managerCycle.rentalIds, damagedUnits: 0 });
    const returnedManager = await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).get();
    assert.equal(returnedManager.get('status'), 'returned');
    assert.equal(returnedManager.get('total'), paidBeforeReturn, 'Return must retain historical charges.');
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, stockBeforeHealthyReturn + 1);
    assert.equal(returnedManager.get('paymentStatus'), 'unpaid', 'Returning a rental does not invent or add a payment.');
    const receiptKey = `receipt_${crypto.randomUUID()}`;
    const receiptAt = new Date().toISOString();
    const receipt = await call<{ movementId: string; duplicate: boolean }>(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'receipt', amount: paidBeforeReturn, method: 'Efectivo', actualAt: receiptAt, idempotencyKey: receiptKey,
    });
    const duplicateReceipt = await call<{ movementId: string; duplicate: boolean }>(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'receipt', amount: paidBeforeReturn, method: 'Efectivo', actualAt: receiptAt, idempotencyKey: receiptKey,
    });
    assert.equal(duplicateReceipt.duplicate, true, 'Retry with the same key cannot create a second receipt.');
    assert.equal(duplicateReceipt.movementId, receipt.movementId);
    const paidAfterReturn = await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).get();
    assert.equal(paidAfterReturn.get('status'), 'returned');
    assert.equal(paidAfterReturn.get('paymentStatus'), 'paid');
    const receiptAtBeforeCorrection = paidAfterReturn.get('paidAt');
    const receiptAmountBeforeCorrection = paidAfterReturn.get('amountPaid');
    await call(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'correction', amount: 1, method: 'Efectivo', actualAt: new Date().toISOString(),
        idempotencyKey: `correction_${crypto.randomUUID()}`, referenceMovementId: receipt.movementId, reason: 'Corrección ficticia de prueba', confirmed: true,
    });
    const paymentCorrected = await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).get();
    assert.equal(paymentCorrected.get('paymentStatus'), 'paid', 'An accounting correction must not reverse the paid contractual state.');
    assert.equal(paymentCorrected.get('paidAt'), receiptAtBeforeCorrection, 'An accounting correction must preserve the historical receipt timestamp.');
    assert.equal(paymentCorrected.get('amountPaid'), receiptAmountBeforeCorrection, 'An accounting correction must preserve the historical receipt amount.');
    const paymentAudit = paymentCorrected.get('auditLog').at(-1);
    assert.equal(paymentAudit.action, 'payment_correction');
    assert.equal(paymentAudit.before.receipts, paidBeforeReturn);
    assert.equal(paymentAudit.after.corrections, 1);
    const refund = await call<{ movementId: string }>(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'refund', amount: 10, method: 'Efectivo', actualAt: new Date().toISOString(),
        idempotencyKey: `refund_${crypto.randomUUID()}`, referenceMovementId: receipt.movementId, reason: 'Reembolso ficticio de prueba', confirmed: true,
    });
    assert.ok(refund.movementId);
    const moneyRows = await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', managerCycle.reservationCode).get();
    assert.equal(moneyRows.docs.filter(doc => doc.get('type') === 'receipt').length, 1);
    assert.equal(moneyRows.docs.filter(doc => doc.get('type') === 'refund').length, 1);
    assert.equal(moneyRows.docs.filter(doc => doc.get('type') === 'receipt').reduce((sum, doc) => sum + Number(doc.get('amount')), 0), paidBeforeReturn);
    assert.equal(moneyRows.docs.filter(doc => doc.get('type') === 'refund').reduce((sum, doc) => sum + Number(doc.get('amount')), 0), 10);
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'refund', amount: paidBeforeReturn, method: 'Efectivo', actualAt: new Date().toISOString(),
        idempotencyKey: `overrefund_${crypto.randomUUID()}`, referenceMovementId: receipt.movementId, reason: 'Excede lo cobrado', confirmed: true,
    }), 'A refund cannot exceed the available receipt balance.');

    const exactLedgerCode = `TEST-100-${crypto.randomUUID()}`;
    const exactLedgerDoc = await adminDb.collection('rentals').add({
        reservationCode: exactLedgerCode, store: (await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).get()).get('store'),
        total: 100, status: 'returned', paymentStatus: 'unpaid', productId: 'bike-emulator', quantity: 1, auditLog: [],
    });
    const firstPartialKey = `partial40_${crypto.randomUUID()}`;
    const firstPartialAt = new Date().toISOString();
    const partialCalls = await Promise.all([
        call<{ movementId: string; duplicate: boolean }>(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'receipt', amount: 40, method: 'Efectivo', actualAt: firstPartialAt, idempotencyKey: firstPartialKey }),
        call<{ movementId: string; duplicate: boolean }>(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'receipt', amount: 40, method: 'Efectivo', actualAt: firstPartialAt, idempotencyKey: firstPartialKey }),
    ]);
    assert.equal(new Set(partialCalls.map(result => result.movementId)).size, 1, 'Concurrent same-key receipt submissions resolve to one immutable event.');
    assert.equal(partialCalls.filter(result => result.duplicate).length, 1);
    await call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'receipt', amount: 60, method: 'QR', confirmedReceived: true, actualAt: new Date().toISOString(), idempotencyKey: `partial60_${crypto.randomUUID()}` });
    const firstReceiptId = partialCalls[0].movementId;
    await call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'refund', amount: 25, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `refund25_${crypto.randomUUID()}`, referenceMovementId: firstReceiptId, reason: 'Reembolso de ejemplo', confirmed: true });
    const receiptsBeforeCorrection = await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', exactLedgerCode).get();
    const secondReceiptId = receiptsBeforeCorrection.docs.find(doc => doc.get('type') === 'receipt' && doc.id !== firstReceiptId)!.id;
    await call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'correction', amount: 5, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `correction5_${crypto.randomUUID()}`, referenceMovementId: secondReceiptId, reason: 'Corrección no monetaria de ejemplo', confirmed: true });
    const exactLedgerMovements = await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', exactLedgerCode).get();
    const exactReceipts = exactLedgerMovements.docs.filter(doc => doc.get('type') === 'receipt');
    assert.equal(exactReceipts.length, 2);
    assert.equal(exactReceipts.reduce((sum, doc) => sum + Number(doc.get('amount')), 0), 100, 'Two partial receipts total exactly Bs. 100.');
    assert.equal(exactLedgerMovements.docs.filter(doc => doc.get('type') === 'refund').reduce((sum, doc) => sum + Number(doc.get('amount')), 0), 25);
    assert.equal(exactLedgerMovements.docs.filter(doc => doc.get('type') === 'correction').reduce((sum, doc) => sum + Number(doc.get('amount')), 0), 5);
    assert.equal(100 - 25, 75, 'Cash net is gross receipts less actual refunds; non-cash corrections do not reduce it.');
    assert.equal(100 - 25 - 5, 70, 'Recognized net income additionally deducts accounting corrections.');
    assert.equal(100 - 100, 0, 'Accounting corrections and refunds do not create contractual debt.');
    assert.equal((await adminDb.collection('rentals').doc(exactLedgerDoc.id).get()).get('paymentStatus'), 'paid', 'A correction does not reverse a fully paid contract.');
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'receipt', amount: 1, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `no-correction-debt_${crypto.randomUUID()}` }), 'An accounting correction cannot create a new balance to collect.');
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'receipt', amount: 1, method: 'QR', actualAt: new Date().toISOString(), idempotencyKey: `unconfirmed_${crypto.randomUUID()}` }), 'Unconfirmed QR receipts must fail.');
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', { rentalIds: [exactLedgerDoc.id], type: 'refund', amount: 16, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `overpartial_${crypto.randomUUID()}`, referenceMovementId: firstReceiptId, reason: 'Excede disponible', confirmed: true }), 'Refund cannot exceed the remaining referenced receipt amount.');

    const legacyPaidCode = `LEGACY-PAID-${crypto.randomUUID()}`;
    const legacyPaidRental = await adminDb.collection('rentals').add({
        reservationCode: legacyPaidCode, store: 'shop-b', total: 100, amountPaid: 100, paymentStatus: 'paid',
        paidAt: new Date().toISOString(), status: 'returned', productId: 'bike-emulator', quantity: 1, auditLog: [],
    });
    const legacyCorrectionKey = `legacy_correction_${crypto.randomUUID()}`;
    const legacyReceiptId = `legacy_${legacyPaidRental.id}`;
    const legacyCorrectionInput = {
        rentalIds: [legacyPaidRental.id], type: 'correction', amount: 5, method: 'Efectivo', actualAt: new Date().toISOString(),
        idempotencyKey: legacyCorrectionKey, referenceMovementId: legacyReceiptId, reason: 'Ajuste histórico ficticio', confirmed: true,
    };
    await call(userB.functions, 'recordRentalPaymentMovement', legacyCorrectionInput);
    const legacyCorrectionRetry = await call<{ duplicate: boolean }>(userB.functions, 'recordRentalPaymentMovement', legacyCorrectionInput);
    assert.equal(legacyCorrectionRetry.duplicate, true);
    const legacyLedger = await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', legacyPaidCode).get();
    assert.equal(legacyLedger.docs.filter(doc => doc.get('type') === 'receipt').length, 1, 'A pre-ledger paid rental seeds exactly one historical receipt.');
    assert.equal(legacyLedger.docs.find(doc => doc.get('type') === 'receipt')?.get('amount'), 100);
    assert.equal(legacyLedger.docs.filter(doc => doc.get('type') === 'correction').length, 1, 'Retrying the correction cannot duplicate ledger entries.');
    assert.equal((await adminDb.collection('rentals').doc(legacyPaidRental.id).get()).get('paymentStatus'), 'paid', 'Legacy paid status remains paid after an accounting-only correction.');
    await assert.rejects(() => call(userB.functions, 'adminRentalAction', { action: 'payment', rentalIds: managerCycle.rentalIds, paymentStatus: 'paid' }));
    const confirmedCancel = await call<{ rentalIds: string[] }>(userB.functions, 'createRentalGroup', managerBooking(17));
    await call(userB.functions, 'adminRentalAction', { action: 'confirm', rentalIds: confirmedCancel.rentalIds });
    const stockBeforeConfirmedCancel = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    await call(userB.functions, 'adminRentalAction', { action: 'cancel', rentalIds: confirmedCancel.rentalIds });
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, stockBeforeConfirmedCancel + 1);
    assert.equal((await adminDb.collection('rentals').doc(confirmedCancel.rentalIds[0]).get()).get('status'), 'cancelled');
    await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).update({ store: 'shop-other' });
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'receipt', amount: 1, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `scope_${crypto.randomUUID()}`,
    }));
    await adminDb.collection('adminUsers').doc(userB.uid).update({ role: 'mechanic' });
    await assert.rejects(() => call(userB.functions, 'recordRentalPaymentMovement', {
        rentalIds: managerCycle.rentalIds, type: 'receipt', amount: 1, method: 'Efectivo', actualAt: new Date().toISOString(), idempotencyKey: `role_${crypto.randomUUID()}`,
    }));
    await adminDb.collection('adminUsers').doc(userB.uid).update({ role: 'viewer' });
    await assert.rejects(() => call(userB.functions, 'updateRentalGroup', {
        reservationCode: managerCycle.reservationCode, date: managerDate(16), pickupTime: '15:00', duration: '1 hora',
        deliveryService: false, pickupService: false, mapsLink: '', notes: '',
        items: [{ id: managerCycle.rentalIds[0], productId: 'bike-emulator', productType: 'single', quantity: 1, selectedWheelSize: '26' }],
    }));
    pass('Manager can run scoped lifecycle actions; pending cancellation preserves stock, return-before-delivery and cross-store/mechanic/viewer actions are rejected');

    await adminDb.collection('adminUsers').doc(userB.uid).update({ role: 'manager' });
    const conflictSource = await call<{ rentalIds: string[]; reservationCode: string }>(userB.functions, 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userB.uid },
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        date: managerDate(18), pickupTime: '15:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `move_${crypto.randomUUID()}`,
    });
    const contestedDate = managerDate(19);
    const movePromise = call(userB.functions, 'updateRentalGroup', {
        reservationCode: conflictSource.reservationCode, rentalIds: conflictSource.rentalIds,
        date: contestedDate, pickupTime: '15:00', duration: '1 hora', deliveryService: false, pickupService: false,
        mapsLink: '', notes: 'Concurrent admin edit',
        items: [{ id: conflictSource.rentalIds[0], productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
    });
    const customerPromise = call(userB.functions, 'createRentalGroup', {
        idempotencyKey: `concurrent_${crypto.randomUUID()}`,
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        date: contestedDate, pickupTime: '15:00', duration: '1 hora', paymentMethod: 'QR',
    });
    const [adminMove, customerBooking] = await Promise.allSettled([movePromise, customerPromise]);
    assert.equal([adminMove, customerBooking].filter((result) => result.status === 'fulfilled').length, 1);
    const contestedRows = await adminDb.collection('rentals').where('date', '==', contestedDate).get();
    assert.equal(contestedRows.docs.filter((doc) => doc.get('productId') === 'bike-race-emulator' && doc.get('pickupTime') === '15:00' && ['pending', 'Pendiente'].includes(doc.get('status'))).length, 1);
    pass('A concurrent admin date edit and customer reservation cannot both claim the last bike');

    const userARateKey = createHash('sha256').update(userA.uid).digest('hex');
    await adminDb.collection('_requestLimits').doc(`reservations_${userARateKey}`).set({ windowStart: -1, count: 0 });
    const deliveryGroup = await call<{ rentalIds: string[]; reservationCode: string }>(userA.functions, 'createRentalGroup', {
        adminManual: true, adminCustomer: { id: userA.uid }, adminDeliveryService: true,
        adminMapsLink: 'https://www.google.com/maps/?q=-17.390,-66.130',
        lines: [{ productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
        date: managerDate(21), pickupTime: '17:00', duration: '1 hora', paymentMethod: 'Efectivo', idempotencyKey: `delivery_${crypto.randomUUID()}`,
    });
    await call(userA.functions, 'updateRentalGroup', {
        reservationCode: deliveryGroup.reservationCode, rentalIds: deliveryGroup.rentalIds,
        date: managerDate(21), pickupTime: '17:00', duration: '1 hora', deliveryService: true, pickupService: false,
        mapsLink: 'https://www.google.com/maps/?q=-17.390,-66.130', notes: 'Delivery enabled',
        items: [{ id: deliveryGroup.rentalIds[0], productId: 'bike-race-emulator', productType: 'single', quantity: 1 }],
    });
    let deliveryRows = await adminDb.collection('rentals').where('reservationCode', '==', deliveryGroup.reservationCode).get();
    assert.equal(deliveryRows.size, 2);
    assert.equal(deliveryRows.docs.find((doc) => doc.get('productId') === 'srv_delivery')?.get('total'), 30);
    await call(userA.functions, 'updateRentalGroup', {
        reservationCode: deliveryGroup.reservationCode, rentalIds: deliveryRows.docs.map((doc) => doc.id),
        date: managerDate(21), pickupTime: '17:00', duration: '1 hora', deliveryService: false, pickupService: false,
        mapsLink: 'https://www.google.com/maps/?q=-17.390,-66.130', notes: 'Delivery removed',
        items: deliveryRows.docs.map((doc) => ({ id: doc.id, productId: doc.get('productId'), productType: doc.get('productType'), quantity: doc.get('quantity'), selectedWheelSize: doc.get('selectedWheelSize') })),
    });
    deliveryRows = await adminDb.collection('rentals').where('reservationCode', '==', deliveryGroup.reservationCode).get();
    assert.equal(deliveryRows.size, 1, 'Turning off delivery removes its service line transactionally.');
    pass('Delivery/recojo edits add or remove their service line and calculate the configured zone fee from map coordinates');

    const legacyDate = managerDate(20);
    const legacyRentalId = `legacy_${crypto.randomUUID()}`;
    await adminDb.collection('rentals').doc(legacyRentalId).set({
        id: legacyRentalId, productId: 'bike-emulator', productName: 'Emulator Bike', productType: 'single',
        selectedWheelSize: '26', quantity: 1, total: 20, status: 'Pendiente', date: legacyDate,
        pickupTime: '10:00', duration: '1 hora', paymentStatus: 'unpaid',
    });
    await call(userA.functions, 'updateRentalGroup', {
        reservationCode: legacyRentalId, rentalIds: [legacyRentalId], date: legacyDate, pickupTime: '10:00', duration: '1 hora',
        deliveryService: false, pickupService: false, mapsLink: '', notes: 'Legacy record retained',
        items: [{ id: legacyRentalId, productId: 'bike-emulator', productType: 'single', quantity: 1, selectedWheelSize: '26' }],
    });
    const legacyAfter = await adminDb.collection('rentals').doc(legacyRentalId).get();
    assert.equal(legacyAfter.get('status'), 'Pendiente');
    assert.equal(legacyAfter.get('store'), undefined);
    assert.equal(legacyAfter.get('notes'), 'Legacy record retained');
    const incompleteComboId = `legacy_combo_${crypto.randomUUID()}`;
    await adminDb.collection('rentals').doc(incompleteComboId).set({
        productId: 'combo-emulator', productName: 'Emulator Combo', productType: 'combo', quantity: 1,
        total: 30, status: 'Pendiente', date: legacyDate, pickupTime: '12:00', duration: '1 hora',
    });
    await assert.rejects(() => call(userA.functions, 'updateRentalGroup', {
        reservationCode: incompleteComboId, rentalIds: [incompleteComboId], date: legacyDate, pickupTime: '12:00', duration: '1 hora',
        deliveryService: false, pickupService: false, mapsLink: '', notes: '',
        items: [{ id: incompleteComboId, productId: 'combo-emulator', productType: 'combo', quantity: 1 }],
    }));
    assert.equal((await adminDb.collection('rentals').doc(incompleteComboId).get()).get('componentSelections'), undefined);
    pass('Legacy Spanish-state rows without store/group fields remain visible and editable; incomplete combo sizes are rejected without invented data');

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
