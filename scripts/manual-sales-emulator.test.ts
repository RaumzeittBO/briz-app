import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createManualSale, transitionManualSaleStatus } from '../src/lib/manualSales';
import { filterCompletedSales } from '../src/lib/adminReportScope';

const projectId = 'demo-briz-sales';
let env: RulesTestEnvironment;

async function seed(): Promise<void> {
    await env.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'adminUsers', 'sales-admin'), { uid: 'sales-admin', role: 'admin', active: true, store: 'all' });
        await setDoc(doc(db, 'adminUsers', 'sales-manager'), { uid: 'sales-manager', role: 'manager', active: true, store: 'cochabamba' });
        await setDoc(doc(db, 'inventory', 'bike-wheels'), {
            id: 'bike-wheels', name: 'Test Wheel Bike', itemType: 'bike', store: 'cochabamba',
            active: true, availableForSale: true, hasWheelSizes: true, salePrice: 100,
            wheelSizes: [{ size: '26', stock: 1 }, { size: '27', stock: 2 }],
        });
        await setDoc(doc(db, 'inventory', 'last-lock'), {
            id: 'last-lock', name: 'Last Lock', itemType: 'accessory', store: 'cochabamba',
            active: true, availableForSale: true, hasWheelSizes: false, salePrice: 50, stock: 1,
        });
        await setDoc(doc(db, 'inventory', 'lapaz-light'), {
            id: 'lapaz-light', name: 'La Paz Light', itemType: 'accessory', store: 'lapaz',
            active: true, availableForSale: true, hasWheelSizes: false, salePrice: 25, stock: 1,
        });
    });
}

function draft(items: Array<{ id: string; quantity: number }>, store?: string) {
    return { customerName: 'Fictional Sale', customerCI: 'TEST-ONLY', paymentMethod: 'efectivo', items, ...(store ? { store } : {}) };
}

try {
    env = await initializeTestEnvironment({
        projectId,
        firestore: { rules: await readFile('firestore.rules', 'utf8') },
    });
    await seed();
    const adminDb = env.authenticatedContext('sales-admin').firestore();
    const managerDb = env.authenticatedContext('sales-manager').firestore();

    const duplicateDraft = draft([{ id: 'bike-wheels', quantity: 2 }]);
    const duplicateResults = await Promise.all([
        createManualSale(adminDb, 'sale-idempotent', 'sales-admin', duplicateDraft),
        createManualSale(adminDb, 'sale-idempotent', 'sales-admin', duplicateDraft),
    ]);
    assert.equal(duplicateResults[0].id, duplicateResults[1].id);
    assert.equal(duplicateResults[0].total, 200);
    const effectiveSaleRows = filterCompletedSales([duplicateResults[0]], { start: '2000-01-01', end: '2099-12-31' }, 'all', (sale) => sale.date.slice(0, 10));
    assert.equal(effectiveSaleRows.reduce((sum, sale) => sum + sale.total, 0), 200);
    assert.deepEqual(duplicateResults[0].items[0].wheelSizeAllocations, [{ size: '27', quantity: 2 }]);
    const wheelAfterSale = (await getDoc(doc(adminDb, 'inventory', 'bike-wheels'))).data()!;
    assert.deepEqual(wheelAfterSale.wheelSizes, [{ size: '26', stock: 1 }, { size: '27', stock: 0 }]);
    assert.equal((await getDoc(doc(adminDb, 'sales', 'sale-idempotent'))).exists(), true);

    await Promise.all([
        transitionManualSaleStatus(adminDb, 'sale-idempotent', 'Cancelado'),
        transitionManualSaleStatus(adminDb, 'sale-idempotent', 'Cancelado'),
    ]);
    const wheelAfterCancel = (await getDoc(doc(adminDb, 'inventory', 'bike-wheels'))).data()!;
    assert.deepEqual(wheelAfterCancel.wheelSizes, [{ size: '26', stock: 1 }, { size: '27', stock: 2 }]);
    const cancelledRecord = (await getDoc(doc(adminDb, 'sales', 'sale-idempotent'))).data()!;
    assert.equal(cancelledRecord.status, 'Cancelado');
    assert.equal(filterCompletedSales([cancelledRecord as typeof duplicateResults[0]], { start: '2000-01-01', end: '2099-12-31' }, 'all', (sale) => sale.date.slice(0, 10)).length, 0);
    await transitionManualSaleStatus(adminDb, 'sale-idempotent', 'Completado');
    await transitionManualSaleStatus(adminDb, 'sale-idempotent', 'Cancelado');
    assert.deepEqual((await getDoc(doc(adminDb, 'inventory', 'bike-wheels'))).data()!.wheelSizes, wheelAfterCancel.wheelSizes);
    console.log('PASS manual bike sale records exact aro allocations; repeat submit/cancel is idempotent and retains audit record');

    await assertFails(createManualSale(managerDb, 'sale-out-of-store', 'sales-manager', draft([{ id: 'lapaz-light', quantity: 1 }], 'cochabamba')));
    console.log('PASS manager cannot sell inventory outside their assigned store');

    const managerSale = await createManualSale(managerDb, 'sale-manager-scope', 'sales-manager', draft([{ id: 'last-lock', quantity: 1 }], 'cochabamba'));
    assert.equal(managerSale.total, 50);
    assert.equal((await getDoc(doc(managerDb, 'inventory', 'last-lock'))).get('stock'), 0);
    await createManualSale(managerDb, 'sale-manager-scope', 'sales-manager', draft([{ id: 'last-lock', quantity: 1 }], 'cochabamba'));
    assert.equal((await getDoc(doc(managerDb, 'sales', 'sale-manager-scope'))).exists(), true);
    assert.equal((await getDoc(doc(managerDb, 'inventory', 'last-lock'))).get('stock'), 0);
    console.log('PASS manager sale uses current catalog price and consumes only in-scope stock');
    await transitionManualSaleStatus(managerDb, 'sale-manager-scope', 'Cancelado');

    const beforeShortage = await getDoc(doc(adminDb, 'inventory', 'last-lock'));
    await assert.rejects(createManualSale(adminDb, 'sale-insufficient', 'sales-admin', draft([{ id: 'last-lock', quantity: 2 }])), /Stock insuficiente/);
    assert.equal((await getDoc(doc(adminDb, 'inventory', 'last-lock'))).get('stock'), beforeShortage.get('stock'));
    assert.equal((await getDoc(doc(adminDb, 'sales', 'sale-insufficient'))).exists(), false);
    console.log('PASS insufficient stock creates neither a sale nor a partial stock update');

    const competing = await Promise.allSettled([
        createManualSale(adminDb, 'sale-race-a', 'sales-admin', draft([{ id: 'lapaz-light', quantity: 1 }], 'all')),
        createManualSale(adminDb, 'sale-race-b', 'sales-admin', draft([{ id: 'lapaz-light', quantity: 1 }], 'all')),
    ]);
    assert.equal(competing.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal((await getDoc(doc(adminDb, 'inventory', 'lapaz-light'))).get('stock'), 0);
    assert.equal(Number((await getDoc(doc(adminDb, 'sales', 'sale-race-a'))).exists())
        + Number((await getDoc(doc(adminDb, 'sales', 'sale-race-b'))).exists()), 1);
    console.log('PASS concurrent sales serialize against stock and cannot oversell the last unit');

    await env.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'sales', 'pending-legacy'), {
            id: 'pending-legacy', customerName: 'Legacy', items: [{ id: 'last-lock', name: 'Last Lock', price: 50, quantity: 1 }],
            total: 50, status: 'Pendiente', paymentMethod: 'efectivo', store: 'cochabamba', date: new Date().toISOString(),
        });
    });
    await transitionManualSaleStatus(managerDb, 'pending-legacy', 'Completado');
    assert.equal((await getDoc(doc(managerDb, 'inventory', 'last-lock'))).get('stock'), 0);
    await transitionManualSaleStatus(managerDb, 'pending-legacy', 'Cancelado');
    assert.equal((await getDoc(doc(managerDb, 'inventory', 'last-lock'))).get('stock'), 1);
    console.log('PASS legacy pending sale completion/cancellation consumes and restores stock once');
} catch (error) {
    console.error('Manual sales Emulator tests failed:', error);
    process.exitCode = 1;
} finally {
    await env?.cleanup();
}
