import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { spawn, type ChildProcess } from 'node:child_process';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, reload } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { chromium, type Browser } from 'playwright';

const projectId = 'demo-briz-security';
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const adminAppSdk = require('firebase-admin/app');
const adminAuthSdk = require('firebase-admin/auth');
const adminFirestoreSdk = require('firebase-admin/firestore');
const adminApp = adminAppSdk.initializeApp({ projectId }, `free-time-admin-${Date.now()}`);
const adminAuth = adminAuthSdk.getAuth(adminApp);
const adminDb = adminFirestoreSdk.getFirestore(adminApp);
const firebaseConfig = { apiKey: 'demo-key', authDomain: `${projectId}.firebaseapp.com`, projectId, appId: 'free-time-test', storageBucket: `${projectId}.appspot.com` };
const app = initializeApp(firebaseConfig, `free-time-client-${Date.now()}`);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
const functions = getFunctions(app);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);
const call = async <T>(name: string, payload?: unknown): Promise<T> => (await httpsCallable<unknown, T>(functions, name)(payload)).data;
const unique = () => crypto.randomUUID().replaceAll('-', '');
const futureDate = (days = 3) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date(Date.now() + days * 86_400_000));
const report = (name: string) => console.log(`PASS ${name}`);

async function waitForVite(baseUrl: string, server: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before starting (code ${server.exitCode}).`);
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* Vite is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Vite did not start within 40 seconds.');
}

async function seedBike(id: string, stock: number, store = 'Cochabamba', sizes?: Array<{ size: string; stock: number; maintenanceStock?: number }>) {
  await adminDb.doc(`inventory/${id}`).set({
    id, itemType: 'bike', name: `Fixture ${id}`, active: true, availableForRental: true, availableForSale: false,
    hasWheelSizes: Boolean(sizes), ...(sizes ? { wheelSizes: sizes } : { stock }), store,
    pricePerHour: 35, price1Hour: 35, price24Hours: 70, pricePerDay: 70,
  });
}

async function createUser(email: string, role?: { role: string; store: string; active: boolean }) {
  const credential = await createUserWithEmailAndPassword(auth, email, 'EmulatorOnly#123');
  await adminAuth.updateUser(credential.user.uid, { emailVerified: true });
  await reload(credential.user);
  await credential.user.getIdToken(true);
  if (role) await adminDb.doc(`adminUsers/${credential.user.uid}`).set({ uid: credential.user.uid, ...role, name: email.split('@')[0] });
  return credential.user.uid;
}

try {
  await createUser(`free-time-admin-${Date.now()}@example.test`, { role: 'admin', store: 'all', active: true });
  await adminDb.doc('customers/free-time-customer').set({ name: 'Cliente Emulator', phone: '+59170000001', ci: 'FT-TEST-1', store: 'Cochabamba' });
  await adminDb.doc('settings/public_business').set({ hours: Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => [day, { closed: false, open: '00:00', close: '23:59' }])) });

  await seedBike('ft-basic-bike', 3);
  const baseKey = `ft_${unique()}`;
  const baseInput = { idempotencyKey: baseKey, itemId: 'ft-basic-bike', store: 'Cochabamba', customerId: 'free-time-customer' };
  const started = await call<{ sessionId: string; reservationCode: string; duplicate: boolean }>('startFreeTimeRental', baseInput);
  assert.equal(started.duplicate, false);
  const firstRecord = (await adminDb.doc(`rentals/${started.sessionId}`).get()).data()!;
  assert.equal(firstRecord.freeTimeState, 'active');
  assert.equal(firstRecord.status, 'delivered');
  assert.equal(firstRecord.total, 0);
  assert.equal(firstRecord.paymentStatus, 'unpaid');
  assert.equal(typeof firstRecord.startTimestamp, 'number');
  assert.equal((await adminDb.doc('inventory/ft-basic-bike').get()).get('stock'), 2);
  const retryStart = await call<typeof started>('startFreeTimeRental', baseInput);
  assert.equal(retryStart.sessionId, started.sessionId);
  assert.equal(retryStart.duplicate, true);
  assert.equal((await adminDb.doc('inventory/ft-basic-bike').get()).get('stock'), 2);
  report('1 inicio autorizado registra hora de servidor y descuenta stock en la misma transacción sin cobro');
  report('5 reintento idempotente recupera la misma sesión sin duplicar descuento');

  const listed = await call<{ sessions: Array<Record<string, unknown>>; serverNowMs: number }>('listFreeTimeRentals');
  assert.ok(listed.sessions.some((session) => session.id === started.sessionId && session.freeTimeState === 'active'));
  assert.ok(Number.isFinite(listed.serverNowMs));
  assert.equal(listed.sessions.find((session) => session.id === started.sessionId)?.startedAtMs, firstRecord.startTimestamp);
  report('6 recarga/consulta recupera la sesión activa y su hora de servidor');

  const finishKey = `ft_${unique()}`;
  const finished = await call<{ duplicate: boolean; elapsedMilliseconds: number; elapsedSeconds: number }>('finishFreeTimeRental', {
    sessionId: started.sessionId, idempotencyKey: finishKey, damaged: false,
  });
  assert.equal(finished.duplicate, false);
  assert.ok(finished.elapsedMilliseconds >= 0);
  const closedDoc = await adminDb.doc(`rentals/${started.sessionId}`).get();
  assert.equal(closedDoc.get('freeTimeState'), 'closed');
  assert.equal(closedDoc.get('paymentStatus'), 'unpaid');
  assert.equal(closedDoc.get('total'), 0);
  assert.equal((await adminDb.collection('rentalPaymentMovements').where('reservationCode', '==', started.reservationCode).get()).size, 0);
  assert.equal((await adminDb.doc('inventory/ft-basic-bike').get()).get('stock'), 3);
  const repeatedFinish = await call<typeof finished>('finishFreeTimeRental', { sessionId: started.sessionId, idempotencyKey: finishKey, damaged: false });
  assert.equal(repeatedFinish.duplicate, true);
  await assert.rejects(() => call('finishFreeTimeRental', { sessionId: started.sessionId, idempotencyKey: `ft_${unique()}`, damaged: false }), /ya fue finalizada/i);
  assert.equal((await adminDb.doc('inventory/ft-basic-bike').get()).get('stock'), 3);
  assert.equal((await adminDb.collection('freeTimeEvents').where('sessionId', '==', started.sessionId).get()).size, 2);
  const closedHistory = await call<{ sessions: Array<Record<string, unknown>> }>('listFreeTimeRentals');
  assert.equal(closedHistory.sessions.find((session) => session.id === started.sessionId)?.freeTimeState, 'closed');
  report('7 finalización registra duración del backend, cierra la sesión, restaura stock y conserva unpaid');
  report('8 doble finalización idempotente no repone stock ni agrega otra auditoría');

  await seedBike('ft-last-bike', 1);
  const race = await Promise.allSettled([
    call('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-last-bike', store: 'Cochabamba' }),
    call('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-last-bike', store: 'Cochabamba' }),
  ]);
  assert.equal(race.filter((entry) => entry.status === 'fulfilled').length, 1);
  assert.equal((await adminDb.doc('inventory/ft-last-bike').get()).get('stock'), 0);
  const raceRows = await adminDb.collection('rentals').where('productId', '==', 'ft-last-bike').where('freeTimeMode', '==', true).get();
  assert.equal(raceRows.size, 1);
  report('2 doble inicio concurrente serializa el acceso a una unidad; solo una operación gana');
  report('3 última bicicleta: stock llega a cero y no puede sobreasignarse');

  await seedBike('ft-reserved-bike', 1);
  const reservationStart = Date.now() + 24 * 60 * 60 * 1000;
  await adminDb.collection('rentals').doc('ft-pending-reservation').set({
    reservationCode: 'FIXTURE-PENDING', status: 'pending', productType: 'single', productId: 'ft-reserved-bike',
    quantity: 1, date: futureDate(), pickupTime: '12:00', duration: '2 horas', total: 0, store: 'Cochabamba',
    startTimestamp: reservationStart, endTimestamp: reservationStart + 2 * 60 * 60 * 1000,
    stockDeducted: false,
  });
  await assert.rejects(() => call('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-reserved-bike', store: 'Cochabamba' }), /reserva existente|disponibilidad futura/i);
  assert.equal((await adminDb.doc('inventory/ft-reserved-bike').get()).get('stock'), 1);
  report('4/12 start rejects an unresolved future reservation instead of choosing an invented session duration');
  await seedBike('ft-confirmed-bike', 0);
  await adminDb.doc('rentals/ft-confirmed-reservation').set({ reservationCode: 'FIXTURE-CONFIRMED', status: 'confirmed', productType: 'single', productId: 'ft-confirmed-bike', quantity: 1, date: futureDate(2), pickupTime: '12:00', duration: '2 horas', total: 0, store: 'Cochabamba', stockDeducted: true });
  await assert.rejects(() => call('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-confirmed-bike', store: 'Cochabamba' }), /no hay.*disponible|stock/i);
  assert.equal((await adminDb.doc('rentals/ft-confirmed-reservation').get()).get('status'), 'confirmed');
  assert.equal((await adminDb.doc('inventory/ft-confirmed-bike').get()).get('stock'), 0);

  await seedBike('ft-damaged-bike', 2, 'Cochabamba', [{ size: '26', stock: 2, maintenanceStock: 0 }]);
  const damagedStart = await call<{ sessionId: string }>('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-damaged-bike', wheelSize: '26', store: 'Cochabamba' });
  const damagedBefore = (await adminDb.doc('inventory/ft-damaged-bike').get()).data()!;
  assert.equal(damagedBefore.wheelSizes[0].stock, 1);
  const damagedFinish = await call<{ duplicate: boolean }>('finishFreeTimeRental', { sessionId: damagedStart.sessionId, idempotencyKey: `ft_${unique()}`, damaged: true, conditionNotes: 'Ficticio: freno requiere revisión' });
  assert.equal(damagedFinish.duplicate, false);
  const damagedAfter = (await adminDb.doc('inventory/ft-damaged-bike').get()).data()!;
  assert.equal(damagedAfter.wheelSizes[0].stock, 1);
  assert.equal(damagedAfter.wheelSizes[0].maintenanceStock, 1);
  assert.equal(damagedAfter.maintenanceStock, 1);
  report('9/12 damaged return keeps shelf stock reduced and sends the unit to maintenance with audit notes');

  await seedBike('ft-lapaz-bike', 2, 'La Paz');
  // Create a real Manager auth user scoped to Cochabamba.
  const managerEmail = `free-time-scope-${Date.now()}@example.test`;
  await auth.signOut();
  await createUser(managerEmail, { role: 'manager', store: 'Cochabamba', active: true });
  await assert.rejects(() => call('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-lapaz-bike', store: 'La Paz' }), /sucursal/i);
  await auth.signOut();
  const noRoleUid = await createUser(`free-time-no-role-${Date.now()}@example.test`);
  void noRoleUid;
  await assert.rejects(() => call('listFreeTimeRentals'), /permiso|administrador|manager/i);
  report('10 Manager no puede iniciar una sesión en otra sucursal');
  report('11 usuario sin rol autorizado no puede consultar sesiones');

  await auth.signOut();
  const adminEmail = `free-time-regression-${Date.now()}@example.test`;
  const regressionUid = await createUser(adminEmail, { role: 'admin', store: 'all', active: true });
  await adminDb.doc(`customers/${regressionUid}`).set({ name: 'Cliente de regresión', phone: '+59170000002', ci: 'FT-REGRESSION', store: 'Cochabamba' });
  await seedBike('ft-normal-bike', 2);
  await seedBike('ft-combo-bike', 2);
  await seedBike('ft-combo-accessory', 2);
  await adminDb.doc('combos/ft-combo').set({ id: 'ft-combo', name: 'Combo ficticio', active: true, availableForRental: true, store: 'Cochabamba', pricePerHour: 10, components: [{ inventoryItemId: 'ft-combo-bike', quantity: 1, requiresWheelSize: false }, { inventoryItemId: 'ft-combo-accessory', quantity: 1, requiresWheelSize: false }] });
  const createReservation = (productId: string, type: 'single' | 'combo' = 'single') => call<{ rentalIds: string[]; total: number }>('createRentalGroup', {
    adminManual: true, adminCustomer: { id: regressionUid }, idempotencyKey: `normal_${unique()}`,
    lines: [{ productId, productType: type, quantity: 1 }], date: futureDate(4), pickupTime: '12:00', duration: '1 hora', paymentMethod: 'Efectivo',
  });
  const ordinary = await createReservation('ft-normal-bike');
  assert.ok(ordinary.rentalIds.length);
  const combo = await createReservation('ft-combo', 'combo');
  assert.ok(combo.rentalIds.length);
  await seedBike('ft-open-conflict', 1);
  const openSession = await call<{ sessionId: string }>('startFreeTimeRental', { idempotencyKey: `ft_${unique()}`, itemId: 'ft-open-conflict', store: 'Cochabamba' });
  await adminDb.doc(`_requestLimits/reservations_${(await import('node:crypto')).createHash('sha256').update(regressionUid).digest('hex')}`).delete().catch(() => undefined);
  await assert.rejects(() => createReservation('ft-open-conflict'), /disponible|quedan|stock/i);
  const openRental = await adminDb.doc(`rentals/${openSession.sessionId}`).get();
  assert.equal(openRental.get('freeTimeMode'), true);
  assert.equal(openRental.get('endTimestamp'), Number.MAX_SAFE_INTEGER);
  report('12 reservas fijas/combinados siguen funcionando y una sesión abierta bloquea el solapamiento futuro');

  // Headless real-browser smoke against the same Emulator, never Production.
  await seedBike('ft-ui-bike', 1);
  const viteEnvironment = {
    ...process.env,
    VITE_USE_FIREBASE_EMULATOR: 'true',
    VITE_ENABLE_FREE_TIME_EMULATOR: 'true',
    VERCEL_ENV: 'local',
  };
  const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { env: viteEnvironment, stdio: 'ignore' });
  let browser: Browser | null = null;
  try {
    const baseUrl = 'http://127.0.0.1:5173';
    await waitForVite(baseUrl, vite);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/admin/free-time`);
    await page.getByPlaceholder('tu@email.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('EmulatorOnly#123');
    await page.getByRole('button', { name: /Entrar al Sistema/ }).click();
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor({ timeout: 20_000 });
    await page.getByLabel('Bicicleta').selectOption({ label: 'Fixture ft-ui-bike' });
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(mobileOverflow, false, 'The 390px interface has no horizontal overflow.');
    await page.screenshot({ path: join(tmpdir(), 'briz-free-time-390x844.png'), fullPage: true });
    await page.getByRole('button', { name: 'Iniciar y entregar bicicleta' }).click();
    await page.getByText('Sesión iniciada:', { exact: false }).waitFor({ timeout: 20_000 });
    const uiSession = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Fixture ft-ui-bike' }) });
    await uiSession.getByRole('heading', { name: 'Fixture ft-ui-bike' }).waitFor();
    await page.setViewportSize({ width: 1280, height: 900 });
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(desktopOverflow, false, 'The 1280px interface has no horizontal overflow.');
    await page.screenshot({ path: join(tmpdir(), 'briz-free-time-1280x900.png'), fullPage: true });
    await uiSession.getByRole('button', { name: 'Finalizar uso' }).click();
    await page.getByRole('button', { name: 'Confirmar devolución' }).click();
    await page.getByText('Sesión cerrada.', { exact: false }).waitFor({ timeout: 20_000 });
    assert.equal((await adminDb.doc('inventory/ft-ui-bike').get()).get('stock'), 1);
    report('Responsive Playwright 390x844 and 1280x900: UI opt-in, login, start, live session, close and stock recovery passed');
  } finally {
    if (browser) await browser.close();
    vite.kill();
  }
  console.log('FREE TIME EMULATOR SUMMARY — fictitious sessions only; no Production or real inventory accessed.');
} finally {
  await auth.signOut().catch(() => undefined);
  await Promise.all([adminApp.delete(), deleteApp(app)]);
}
