import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
        wheelSizes: [{ size: '26', stock: 2, maintenanceStock: 0 }, { size: '27', stock: 1, maintenanceStock: 0 }],
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
        components: [
            { inventoryItemId: 'bike-emulator', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc-emulator', quantity: 1, requiresWheelSize: false },
        ],
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

    const comboDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const comboBooking = {
        idempotencyKey: `combo_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        accessories: [{ itemId: 'acc-emulator', quantity: 1 }],
        date: comboDate,
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    };
    const comboResult = await call<{ reservationCode: string; total: number }>(userA.functions, 'createRentalGroup', comboBooking);
    assert.equal(comboResult.total, 37);
    const comboDoc = await adminDb.collection('rentals').where('reservationCode', '==', comboResult.reservationCode).get();
    assert.equal(comboDoc.size, 2);
    assert.deepEqual(comboDoc.docs[0].data().componentSelections, [
        { inventoryItemId: 'bike-emulator', wheelSize: '26' }, { inventoryItemId: 'acc-emulator' },
    ]);
    await assert.rejects(() => call(userA.functions, 'createRentalGroup', {
        idempotencyKey: `shared_${crypto.randomUUID()}`,
        lines: [{ productId: 'combo-emulator', productType: 'combo', quantity: 1, wheelSize: '26' }],
        accessories: [{ itemId: 'acc-emulator', quantity: 2 }], date: comboDate,
        pickupTime: '14:00', duration: '1 hora', paymentMethod: 'QR',
    }));
    pass('Combo booking validates component aro and aggregates shared combo/accessory stock without double counting');

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

    const userB = await client('rider-b@example.test', 'TestPass#123');
    await call(userB.functions, 'beginCustomerRegistration', { name: 'Rider B', phone: '+59170000002', ci: 'TEST-1002' });
    await verifyEmail(userB.auth, userB.uid);
    await call(userB.functions, 'createCustomerProfile');
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
    const confirmedCancel = await call<{ rentalIds: string[] }>(userB.functions, 'createRentalGroup', managerBooking(17));
    await call(userB.functions, 'adminRentalAction', { action: 'confirm', rentalIds: confirmedCancel.rentalIds });
    const stockBeforeConfirmedCancel = (await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock;
    await call(userB.functions, 'adminRentalAction', { action: 'cancel', rentalIds: confirmedCancel.rentalIds });
    assert.equal((await adminDb.collection('inventory').doc('bike-emulator').get()).get('wheelSizes')[0].stock, stockBeforeConfirmedCancel + 1);
    assert.equal((await adminDb.collection('rentals').doc(confirmedCancel.rentalIds[0]).get()).get('status'), 'cancelled');
    await adminDb.collection('rentals').doc(managerCycle.rentalIds[0]).update({ store: 'shop-other' });
    await assert.rejects(() => call(userB.functions, 'adminRentalAction', { action: 'payment', rentalIds: managerCycle.rentalIds, paymentStatus: 'paid' }));
    await adminDb.collection('adminUsers').doc(userB.uid).update({ role: 'mechanic' });
    await assert.rejects(() => call(userB.functions, 'adminRentalAction', { action: 'payment', rentalIds: managerCycle.rentalIds, paymentStatus: 'paid' }));
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
