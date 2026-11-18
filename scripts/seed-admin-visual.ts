/**
 * Creates a disposable admin and catalog fixture in the local Firebase Emulator only.
 * Refuses to run unless the expected emulator endpoints answer on loopback.
 */
import { createRequire } from 'node:module';

const projectId = 'demo-briz-security';
const authHost = '127.0.0.1:9099';
const firestoreHost = '127.0.0.1:8080';
const storageHost = '127.0.0.1:9199';
const email = 'admin-visual@example.test';
const password = 'BrizEmulator#123';

async function assertEmulator(url: string, label: string): Promise<void> {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        // Storage Emulator responds 501 at its root path even while the API is ready.
        if (!response.ok && !(label === 'Storage' && response.status === 501)) {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        throw new Error(`${label} Emulator no responde en ${url}; no se escribieron fixtures. ${error instanceof Error ? error.message : ''}`);
    }
}

await assertEmulator(`http://${authHost}/`, 'Authentication');
await assertEmulator(`http://${firestoreHost}/`, 'Firestore');
await assertEmulator(`http://${storageHost}/`, 'Storage');

// Set emulator routing before loading firebase-admin. The fixed demo project and loopback
// hosts make this fixture incapable of writing to the production Firebase project.
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
process.env.STORAGE_EMULATOR_HOST = `http://${storageHost}`;

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const app = initializeApp({ projectId }, 'briz-admin-visual-fixture');
const auth = getAuth(app);
const db = getFirestore(app);
const bucket = getStorage(app).bucket(`${projectId}.appspot.com`);

let user;
try {
    user = await auth.getUserByEmail(email);
    user = await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });
} catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({ email, password, emailVerified: true, displayName: 'Admin visual ficticio' });
}

await db.doc(`adminUsers/${user.uid}`).set({
    uid: user.uid,
    email,
    name: 'Admin visual ficticio',
    role: 'admin',
    active: true,
    store: 'all',
});

const fixtures = [
    {
        id: 'visual-bike-26', itemType: 'bike', name: 'Bicicleta visual aro 26', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: true,
        wheelSizes: [{ size: '26', stock: 4, maintenanceStock: 0 }],
        price1Hour: 20, price24Hours: 70, pricePerHour: 20, pricePerDay: 70,
    },
    {
        id: 'visual-bike-27', itemType: 'bike', name: 'Bicicleta visual aro 27', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: true,
        wheelSizes: [{ size: '27', stock: 3, maintenanceStock: 0 }],
        price1Hour: 22, price24Hours: 75, pricePerHour: 22, pricePerDay: 75,
    },
    {
        id: 'visual-lock', itemType: 'accessory', name: 'Candado visual', active: true,
        availableForRental: true, availableForSale: false, hasWheelSizes: false,
        stock: 6, addonFlatPrice: 5,
    },
];
const visualBikeCategories = ['Urbanas', 'Montaña', 'Infantil', 'Mamachari', 'Paseo', 'Ruta', 'Gravel', 'Plegables'];
const visualGridBikes = visualBikeCategories.map((category, index) => ({
    id: `visual-grid-bike-${index + 1}`,
    itemType: 'bike',
    name: `Bicicleta visual ${category}`,
    category,
    description: `Fixture sintético para validar el orden de catálogo (${category}).`,
    imageUrl: '',
    active: true,
    availableForRental: true,
    availableForSale: false,
    hasWheelSizes: true,
    wheelSizes: [{ size: index % 2 === 0 ? '26' : '27', stock: 2, maintenanceStock: 0 }],
    price1Hour: 18 + index,
    price24Hours: 60 + index,
}));
for (const item of [...fixtures, ...visualGridBikes]) await db.doc(`inventory/${item.id}`).set(item);
await db.doc('settings/bike_categories').set({ categories: visualBikeCategories });
await db.doc('inventory/visual-shop-bike').set({
    id: 'visual-shop-bike', itemType: 'bike', name: 'Bicicleta demo para tienda', category: 'Bicicletas',
    description: 'Producto sintético para validar filtros de tienda en Emulator.', imageUrl: '', active: true,
    availableForRental: false, availableForSale: true, hasWheelSizes: true,
    wheelSizes: [{ size: '26', stock: 4 }], salePrice: 1234,
});
await db.doc('combos/visual-combo').set({
    id: 'visual-combo', name: 'Combo visual con candado', active: true,
    availableForRental: true,
    components: [
        { inventoryItemId: 'visual-bike-26', quantity: 1, requiresWheelSize: true },
        { inventoryItemId: 'visual-lock', quantity: 1, requiresWheelSize: false },
    ],
    price1Hour: 25, price24Hours: 80, pricePerHour: 25, pricePerDay: 80,
});
await db.doc('inventory/visual-mamachari').set({
    id: 'visual-mamachari', itemType: 'bike', name: 'Mamachari visual', category: 'Mamachari',
    description: 'Fixture sintético para revisión manual de componentes.', imageUrl: '', active: true,
    availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 2, maintenanceStock: 0,
    price1Hour: 25, price24Hours: 80,
});
await db.doc('combos/visual-legacy-combo').set({
    id: 'visual-legacy-combo', name: 'Combo legacy · Mamachari', category: 'Combinadas', active: true,
    availableForRental: true, availableForSale: false,
    components: [
        { inventoryItemId: 'visual-mamachari', quantity: 1, requiresWheelSize: false },
        { inventoryItemId: 'visual-lock', quantity: 1, requiresWheelSize: false },
    ],
    price1Hour: 30, price24Hours: 85,
});
await db.doc('combos/visual-missing-combo').set({
    id: 'visual-missing-combo', name: 'Combo visual con referencia faltante', category: 'Combinadas', active: true,
    availableForRental: true, availableForSale: false,
    components: [{ inventoryItemId: 'bike-missing-visual', quantity: 1, requiresWheelSize: false }],
    price1Hour: 28, price24Hours: 80,
});
await db.doc('settings/public_business').set({
    businessName: 'BRIZ Demo',
    phone: '+591 70000001',
    address: 'Dirección de prueba, Emulator',
    email: 'demo@example.test',
    whatsapp: '+591 70000002',
    hours: {
        monday: { closed: false, open: '08:00', close: '17:00' },
        tuesday: { closed: false, open: '08:00', close: '17:00' },
        wednesday: { closed: false, open: '08:00', close: '17:00' },
        thursday: { closed: false, open: '08:00', close: '17:00' },
        friday: { closed: false, open: '08:00', close: '17:00' },
        saturday: { closed: true, open: '08:00', close: '17:00' },
        sunday: { closed: true, open: '09:00', close: '14:00' },
    },
    updatedAt: new Date(),
});

const visualCustomerId = 'visual-private-customer';
const pngFixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxioAAAAASUVORK5CYII=', 'base64');
const pdfFixture = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 240 120]/Contents 4 0 R>>endobj\n4 0 obj<</Length 42>>stream\nBT /F1 16 Tf 20 60 Td (Fictional test document) Tj ET\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF', 'utf8');
await bucket.file(`customers/${visualCustomerId}/photo.png`).save(pngFixture, { metadata: { contentType: 'image/png' } });
await bucket.file(`customers/${visualCustomerId}/document.pdf`).save(pdfFixture, { metadata: { contentType: 'application/pdf' } });
await db.doc(`customers/${visualCustomerId}`).set({
    id: visualCustomerId, name: 'Cliente Ficticio de Prueba', phone: '+59170000090', ci: 'VISUAL-TEST-90',
    email: 'private-files@example.test', store: 'cochabamba', rentalsCount: 0, purchasesCount: 0,
});
await db.doc(`customerPrivate/${visualCustomerId}`).set({
    autofotoPath: `customers/${visualCustomerId}/photo.png`,
    documentoPath: `customers/${visualCustomerId}/document.pdf`,
    documentoReversoPath: `data:image/png;base64,${pngFixture.toString('base64')}`,
});

// ISO day in Bolivia, independent of the host locale used by Node on Windows.
const reportFixtureDate = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
const reportFixtureAt = new Date().toISOString();
const reportRentals = [
    ['visual-report-cash', 120, 'Efectivo', 'paid'],
    ['visual-report-qr', 80, 'QR', 'paid'],
    ['visual-report-transfer', 50, 'Transferencia', 'paid'],
    ['visual-report-pending', 60, 'Efectivo', 'unpaid'],
] as const;
for (const [id, total, method, paymentStatus] of reportRentals) {
    const reservationCode = `TEST-${id}`;
    await db.doc(`rentals/${id}`).set({
        id, reservationCode, store: 'Cochabamba', customerName: 'Prueba de reporte', customerId: visualCustomerId,
        customerPhone: 'TEST', customerCI: 'TEST', productType: 'single', productId: 'visual-bike-26',
        productName: 'Bicicleta visual aro 26', quantity: 1, duration: '1 hora', date: reportFixtureDate, pickupTime: '10:00',
        total, amountPaid: paymentStatus === 'paid' ? total : 0, paymentMethod: method, paymentStatus,
        status: paymentStatus === 'paid' ? 'delivered' : 'confirmed', notes: '', createdAt: reportFixtureAt, createdDate: reportFixtureAt,
        updatedAt: reportFixtureAt, ...(paymentStatus === 'paid' ? { paidAt: reportFixtureAt } : {}),
    });
    if (paymentStatus === 'paid') {
        await db.doc(`rentalPaymentMovements/${id}-receipt`).set({
            id: `${id}-receipt`, reservationCode, rentalIds: [id], store: 'Cochabamba', type: 'receipt',
            amount: total, method, actualAt: reportFixtureAt, recordedAt: reportFixtureAt,
        });
    }
}
for (const [id, total, method] of [['visual-report-sale-cash', 30, 'efectivo'], ['visual-report-sale-qr', 20, 'qr']] as const) {
    await db.doc(`sales/${id}`).set({ id, customerName: 'Prueba de reporte', customerPhone: 'TEST', customerCI: 'TEST', items: [], total, status: 'Completado', paymentMethod: method, store: 'Cochabamba', date: reportFixtureDate });
}
for (const [id, status, costEstimate] of [['visual-report-service-received', 'Recibido', 0], ['visual-report-service-progress', 'En reparación', 55], ['visual-report-service-finished', 'Entregado', 90]] as const) {
    await db.doc(`serviceOrders/${id}`).set({ id, customer: 'Prueba de reporte', phone: 'TEST', bikeType: 'Bicicleta visual', issue: 'Fixture ficticio', status, estimatedDelivery: reportFixtureDate, costEstimate, notes: '', date: reportFixtureAt, store: 'Cochabamba' });
}

console.log(`Emulator-only admin fixture ready in ${projectId}.`);
console.log(`Sign in: ${email} / ${password}`);
console.log('Catalog: two bike sizes, one real accessory, one combo. All records are synthetic.');
