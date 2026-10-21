/**
 * Creates a disposable admin and catalog fixture in the local Firebase Emulator only.
 * Refuses to run unless the expected emulator endpoints answer on loopback.
 */
import { createRequire } from 'node:module';

const projectId = 'demo-briz-security';
const authHost = '127.0.0.1:9099';
const firestoreHost = '127.0.0.1:8080';
const email = 'admin-visual@example.test';
const password = 'BrizEmulator#123';

async function assertEmulator(url: string, label: string): Promise<void> {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        throw new Error(`${label} Emulator no responde en ${url}; no se escribieron fixtures. ${error instanceof Error ? error.message : ''}`);
    }
}

await assertEmulator(`http://${authHost}/`, 'Authentication');
await assertEmulator(`http://${firestoreHost}/`, 'Firestore');

// Set emulator routing before loading firebase-admin. The fixed demo project and loopback
// hosts make this fixture incapable of writing to the production Firebase project.
process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp({ projectId }, 'briz-admin-visual-fixture');
const auth = getAuth(app);
const db = getFirestore(app);

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
for (const item of fixtures) await db.doc(`inventory/${item.id}`).set(item);
await db.doc('combos/visual-combo').set({
    id: 'visual-combo', name: 'Combo visual con candado', active: true,
    availableForRental: true,
    components: [
        { inventoryItemId: 'visual-bike-26', quantity: 1, requiresWheelSize: true },
        { inventoryItemId: 'visual-lock', quantity: 1, requiresWheelSize: false },
    ],
    price1Hour: 25, price24Hours: 80, pricePerHour: 25, pricePerDay: 80,
});

console.log(`Emulator-only admin fixture ready in ${projectId}.`);
console.log(`Sign in: ${email} / ${password}`);
console.log('Catalog: two bike sizes, one real accessory, one combo. All records are synthetic.');
