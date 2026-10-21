import { createRequire } from 'node:module';
import { analyzeHistoricalData, type HistoricalCustomer, type HistoricalInventory, type HistoricalRental } from './reconcile-rentals-analysis';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, getApps } = require('firebase-admin/app');
const { FieldPath, getFirestore } = require('firebase-admin/firestore');

if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Este conciliador es solo lectura y solo se permite con FIRESTORE_EMULATOR_HOST configurado. No consulta Firebase real.');
}
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
if (projectId !== 'demo-briz-security') throw new Error(`Proyecto de emulador inesperado: ${String(projectId)}. Se requiere demo-briz-security.`);
if (!getApps().length) initializeApp({ projectId });
const db = getFirestore();

const rows: HistoricalRental[] = [];
let cursorId: string | undefined;
while (true) {
    let query = db.collection('rentals').orderBy(FieldPath.documentId()).limit(300);
    if (cursorId) query = query.startAfter(cursorId);
    const page = await query.get();
    rows.push(...page.docs.map((doc) => ({ ...doc.data(), id: doc.id } as HistoricalRental)));
    if (page.size < 300) break;
    cursorId = page.docs.at(-1)?.id;
}

const [inventorySnap, customerSnap] = await Promise.all([
    db.collection('inventory').get(),
    db.collection('customers').get(),
]);
const report = analyzeHistoricalData({
    rentals: rows,
    inventory: inventorySnap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as HistoricalInventory)),
    customers: customerSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as HistoricalCustomer)),
});
console.log(JSON.stringify({ mode: 'read-only', projectId, emulator: process.env.FIRESTORE_EMULATOR_HOST, ...report }, null, 2));
