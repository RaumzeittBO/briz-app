import { createRequire } from 'node:module';

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

const rows: Array<Record<string, unknown> & { id: string }> = [];
let cursorId: string | undefined;
while (true) {
    let query = db.collection('rentals').orderBy(FieldPath.documentId()).limit(300);
    if (cursorId) query = query.startAfter(cursorId);
    const page = await query.get();
    rows.push(...page.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    if (page.size < 300) break;
    cursorId = page.docs.at(-1)?.id;
}

const groups = new Map<string, typeof rows>();
for (const row of rows) {
    const key = String(row.reservationCode || row.id);
    groups.set(key, [...(groups.get(key) || []), row]);
}
const issues: Array<{ code: string; id: string; issue: string }> = [];
for (const [code, group] of groups) {
    const statuses = [...new Set(group.map((row) => String(row.status || 'missing')))];
    if (statuses.length > 1) group.forEach((row) => issues.push({ code, id: row.id, issue: `group_status_mismatch:${String(row.status || 'missing')}` }));
    for (const row of group) {
        if (!row.date || !row.duration) issues.push({ code, id: row.id, issue: 'missing_date_or_duration' });
        if (!row.store) issues.push({ code, id: row.id, issue: 'missing_store_historical_scope_unknown' });
        if (!row.availabilityGroupId) issues.push({ code, id: row.id, issue: 'missing_availability_group_projection_unlinked' });
        if (row.productType === 'combo' && !Array.isArray(row.componentSelections)) issues.push({ code, id: row.id, issue: 'combo_component_selections_missing' });
        if (typeof row.total !== 'number' || !Number.isFinite(row.total)) issues.push({ code, id: row.id, issue: 'invalid_or_missing_historical_total' });
        if (['confirmed', 'Confirmado', 'delivered', 'Entregado'].includes(String(row.status)) && row.stockDeducted === false) {
            issues.push({ code, id: row.id, issue: 'active_status_stock_flag_false_review_required' });
        }
    }
}
console.log(JSON.stringify({ mode: 'read-only', projectId, emulator: process.env.FIRESTORE_EMULATOR_HOST, rentalsScanned: rows.length, groupsScanned: groups.size, issueCount: issues.length, issues }, null, 2));
