import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, reload } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const projectId = 'demo-briz-manual-payments';
const emulatorHost = process.env.BRIZ_EMULATOR_HOST || '127.0.0.1';
const authPort = Number(process.env.BRIZ_AUTH_EMULATOR_PORT || 9099);
const firestorePort = Number(process.env.BRIZ_FIRESTORE_EMULATOR_PORT || 8080);
const functionsPort = Number(process.env.BRIZ_FUNCTIONS_EMULATOR_PORT || 5001);
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${emulatorHost}:${authPort}`;
process.env.FIRESTORE_EMULATOR_HOST = `${emulatorHost}:${firestorePort}`;
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp: initializeAdminApp } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');
const adminApp = initializeAdminApp({ projectId }, `manual-payment-test-${Date.now()}`);
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp);
const firebaseConfig = { apiKey: 'demo-key', authDomain: `${projectId}.firebaseapp.com`, projectId, appId: 'manual-payment-test', storageBucket: `${projectId}.appspot.com` };
const app = initializeApp(firebaseConfig, `manual-payment-client-${Date.now()}`);
const auth = getAuth(app);
connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`, { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, emulatorHost, firestorePort);
const functions = getFunctions(app);
connectFunctionsEmulator(functions, emulatorHost, functionsPort);

async function call<T>(name: string, payload: unknown): Promise<T> {
  return (await httpsCallable<unknown, T>(functions, name)(payload)).data;
}

const dateAfter = (days: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
const userEmail = `payments-${Date.now()}@example.test`;
const credential = await createUserWithEmailAndPassword(auth, userEmail, 'TestPayment#123');
await adminAuth.updateUser(credential.user.uid, { emailVerified: true });
await reload(credential.user);
await credential.user.getIdToken(true);
await adminDb.doc(`adminUsers/${credential.user.uid}`).set({ uid: credential.user.uid, role: 'admin', active: true, store: 'all' });
await adminDb.doc('settings/public_business').set({ hours: Object.fromEntries(
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => [day, { closed: false, open: '00:00', close: '23:59' }])
) }, { merge: true });
await adminDb.doc('inventory/payment-ledger-fixture-bike').set({
  id: 'payment-ledger-fixture-bike', itemType: 'bike', name: 'Bicicleta de prueba financiera', active: true,
  availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 8,
  price1Hour: 40, pricePerHour: 40, price24Hours: 80, pricePerDay: 80, store: 'Cochabamba',
});

const cashCreateKey = `manual_cash_${crypto.randomUUID()}`;
const cashCreated = await call<{ reservationCode: string; rentalIds: string[]; total: number }>('createRentalGroup', {
  adminManual: true, adminCustomer: { name: 'Cliente de prueba efectivo', phone: '+59170000010', ci: `TEST-CASH-${Date.now()}` },
  adminPaymentStatus: 'paid', idempotencyKey: cashCreateKey,
  lines: [{ productId: 'payment-ledger-fixture-bike', productType: 'single', quantity: 1 }],
  date: dateAfter(2), pickupTime: '10:00', duration: '1 hora', paymentMethod: 'Efectivo',
});
const cashBefore = await adminDb.doc(`rentals/${cashCreated.rentalIds[0]}`).get();
assert.equal(cashBefore.get('paymentStatus'), 'unpaid', 'A manual paid selection cannot set a paid projection before the ledger receipt.');
assert.equal(cashBefore.get('amountPaid'), undefined);
assert.equal((await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', cashCreated.reservationCode).get()).size, 0);
const cashReceiptAt = new Date().toISOString();
const cashReceiptInput = {
  rentalIds: cashCreated.rentalIds, type: 'receipt', amount: cashCreated.total, method: 'Efectivo', actualAt: cashReceiptAt,
  idempotencyKey: `initial_${cashCreateKey}`, reason: 'Pago recibido al registrar el alquiler',
};
const cashReceipt = await call<{ movementId: string; duplicate: boolean }>('recordRentalPaymentMovement', cashReceiptInput);
const cashReceiptRetry = await call<{ movementId: string; duplicate: boolean }>('recordRentalPaymentMovement', cashReceiptInput);
assert.equal(cashReceiptRetry.duplicate, true);
assert.equal(cashReceiptRetry.movementId, cashReceipt.movementId);
assert.equal((await adminDb.doc(`rentals/${cashCreated.rentalIds[0]}`).get()).get('paymentStatus'), 'paid');
assert.equal((await adminDb.doc(`rentalPaymentMovements/${cashReceipt.movementId}`).get()).get('actualAt'), cashReceiptAt);
assert.equal((await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', cashCreated.reservationCode).get()).size, 1);
console.log('PASS Efectivo manual confirmado se escribe una vez en el ledger con fecha real estable');

const qrCreateKey = `manual_qr_${crypto.randomUUID()}`;
const qrCreated = await call<{ reservationCode: string; rentalIds: string[]; total: number }>('createRentalGroup', {
  adminManual: true, adminCustomer: { name: 'Cliente de prueba QR', phone: '+59170000011', ci: `TEST-QR-${Date.now()}` },
  adminPaymentStatus: 'paid', idempotencyKey: qrCreateKey,
  lines: [{ productId: 'payment-ledger-fixture-bike', productType: 'single', quantity: 1 }],
  date: dateAfter(3), pickupTime: '12:00', duration: '1 hora', paymentMethod: 'QR',
});
const qrBefore = await adminDb.doc(`rentals/${qrCreated.rentalIds[0]}`).get();
assert.equal(qrBefore.get('paymentStatus'), 'pending_review', 'QR selection alone is not confirmation of receipt.');
assert.equal(qrBefore.get('amountPaid'), undefined);
assert.equal((await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', qrCreated.reservationCode).get()).size, 0);
await assert.rejects(() => call('recordRentalPaymentMovement', {
  rentalIds: qrCreated.rentalIds, type: 'receipt', amount: qrCreated.total, method: 'QR', actualAt: new Date().toISOString(),
  idempotencyKey: `unconfirmed_${crypto.randomUUID()}`,
}), /confirma|recibido/i, 'The payment backend requires explicit QR receipt confirmation.');
const qrReceiptAt = new Date().toISOString();
const qrReceipt = await call<{ movementId: string }>('recordRentalPaymentMovement', {
  rentalIds: qrCreated.rentalIds, type: 'receipt', amount: qrCreated.total, method: 'QR', confirmedReceived: true,
  actualAt: qrReceiptAt, idempotencyKey: `initial_${qrCreateKey}`, reason: 'Abono QR verificado',
});
assert.equal((await adminDb.doc(`rentals/${qrCreated.rentalIds[0]}`).get()).get('paymentStatus'), 'paid');
assert.equal((await adminDb.doc(`rentalPaymentMovements/${qrReceipt.movementId}`).get()).get('method'), 'QR');
console.log('PASS QR permanece pendiente al seleccionarlo y solo se marca pagado tras confirmar el abono');

const pendingCreated = await call<{ reservationCode: string; rentalIds: string[] }>('createRentalGroup', {
  adminManual: true, adminCustomer: { name: 'Cliente con pago pendiente', phone: '+59170000012', ci: `TEST-PENDING-${Date.now()}` },
  adminPaymentStatus: 'unpaid', idempotencyKey: `manual_pending_${crypto.randomUUID()}`,
  lines: [{ productId: 'payment-ledger-fixture-bike', productType: 'single', quantity: 1 }],
  date: dateAfter(4), pickupTime: '14:00', duration: '1 hora', paymentMethod: 'Transferencia',
});
assert.equal((await adminDb.doc(`rentals/${pendingCreated.rentalIds[0]}`).get()).get('paymentStatus'), 'pending_review');
assert.equal((await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', pendingCreated.reservationCode).get()).size, 0);
console.log('PASS método Transferencia sin cobro confirmado queda pendiente y no crea recibo');
console.log(`PAYMENT FIXTURES — efectivo Bs. ${cashCreated.total}, QR Bs. ${qrCreated.total}, pendiente Bs. ${pendingCreated.rentalIds.length * 40}; todos ficticios en ${projectId}.`);

await auth.signOut();
await Promise.all([adminApp.delete(), deleteApp(app)]);
