import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { getBytes, ref, uploadString } from 'firebase/storage';

const projectId = 'demo-briz-security';
let env: RulesTestEnvironment;

async function seed(): Promise<void> {
    await env.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const profiles = [
            ['root', 'admin', true, 'all'],
            ['manager-cbba', 'manager', true, 'cochabamba'],
            ['manager-la-paz', 'manager', true, 'lapaz'],
            ['mechanic', 'mechanic', true, 'cochabamba'],
            ['viewer', 'viewer', true, 'cochabamba'],
            ['disabled', 'admin', false, 'all'],
        ] as const;
        for (const [uid, role, active, store] of profiles) {
            await setDoc(doc(db, 'adminUsers', uid), { uid, role, active, store });
        }
        await setDoc(doc(db, 'inventory', 'bike-cbba'), { id: 'bike-cbba', store: 'cochabamba', stock: 4 });
        await setDoc(doc(db, 'inventory', 'bike-la-paz'), { id: 'bike-la-paz', store: 'lapaz', stock: 3 });
        await setDoc(doc(db, 'inventory', 'manager-delete'), { id: 'manager-delete', store: 'cochabamba', stock: 1 });
        await setDoc(doc(db, 'rentals', 'private-rental'), {
            id: 'private-rental', store: 'cochabamba', customerName: 'Test only',
            status: 'pending', paymentStatus: 'unpaid', total: 40, amountPaid: 0,
        });
        await setDoc(doc(db, 'rentalPaymentMovements', 'movement-cbba'), { id: 'movement-cbba', store: 'cochabamba', reservationCode: 'TEST-001', type: 'receipt', amount: 10 });
        await setDoc(doc(db, 'customers', 'legacy-customer'), { id: 'legacy-customer', password: 'test-hash' });
        await setDoc(doc(db, 'serviceOrders', 'workshop-order'), { id: 'workshop-order', store: 'cochabamba', status: 'Recibido' });
        await setDoc(doc(db, 'sales', 'sale'), { id: 'sale', store: 'cochabamba', total: 10 });
    });
}

async function test(name: string, run: () => Promise<unknown>): Promise<void> {
    await run();
    console.log(`PASS ${name}`);
}

try {
    env = await initializeTestEnvironment({
        projectId,
        firestore: { rules: await readFile('firestore.rules', 'utf8') },
        storage: { rules: await readFile('storage.rules', 'utf8') },
    });
    await seed();

    const anonymous = env.unauthenticatedContext();
    const admin = env.authenticatedContext('root');
    const manager = env.authenticatedContext('manager-cbba');
    const otherStoreManager = env.authenticatedContext('manager-la-paz');
    const mechanic = env.authenticatedContext('mechanic');
    const viewer = env.authenticatedContext('viewer');
    const disabled = env.authenticatedContext('disabled');

    await test('catalog inventory remains publicly readable', () =>
        assertSucceeds(getDoc(doc(anonymous.firestore(), 'inventory', 'bike-cbba'))));
    await test('public busy-slot projection is readable', () =>
        assertSucceeds(getDoc(doc(anonymous.firestore(), 'rentals_busy_slots', 'sample'))));
    await test('anonymous cannot read private rental or legacy customer data', async () => {
        await assertFails(getDoc(doc(anonymous.firestore(), 'rentals', 'private-rental')));
        await assertFails(getDoc(doc(anonymous.firestore(), 'customers', 'legacy-customer')));
    });
    await test('admin can read private rentals while legacy customer data stays behind a sanitizer', async () => {
        await assertSucceeds(getDoc(doc(admin.firestore(), 'rentals', 'private-rental')));
        await assertFails(getDoc(doc(admin.firestore(), 'customers', 'legacy-customer')));
    });
    await test('active admin and manager can read their own admin profile for AuthContext role resolution', async () => {
        await assertSucceeds(getDoc(doc(admin.firestore(), 'adminUsers', 'root')));
        await assertSucceeds(getDoc(doc(manager.firestore(), 'adminUsers', 'manager-cbba')));
        await assertFails(getDoc(doc(disabled.firestore(), 'adminUsers', 'disabled')));
    });
    await test('manager is scoped to their store for private rental reads', async () => {
        await assertSucceeds(getDoc(doc(manager.firestore(), 'rentals', 'private-rental')));
        await assertFails(getDoc(doc(otherStoreManager.firestore(), 'rentals', 'private-rental')));
    });
    await test('Admin and Manager cannot directly alter rental lifecycle, payment, amount, or delete rentals', async () => {
        const protectedFields = [
            { status: 'confirmed' },
            { paymentStatus: 'paid' },
            { total: 1 },
            { amountPaid: 40 },
        ];
        for (const context of [admin, manager]) {
            for (const fields of protectedFields) {
                await assertFails(updateDoc(doc(context.firestore(), 'rentals', 'private-rental'), fields));
            }
            await assertFails(deleteDoc(doc(context.firestore(), 'rentals', 'private-rental')));
        }
        await assertSucceeds(getDoc(doc(admin.firestore(), 'rentals', 'private-rental')));
        await assertSucceeds(getDoc(doc(manager.firestore(), 'rentals', 'private-rental')));
    });
    await test('cash movement ledger reads are store-scoped and client writes stay forbidden', async () => {
        await assertSucceeds(getDoc(doc(admin.firestore(), 'rentalPaymentMovements', 'movement-cbba')));
        await assertSucceeds(getDoc(doc(manager.firestore(), 'rentalPaymentMovements', 'movement-cbba')));
        await assertFails(getDoc(doc(otherStoreManager.firestore(), 'rentalPaymentMovements', 'movement-cbba')));
        await assertFails(getDoc(doc(anonymous.firestore(), 'rentalPaymentMovements', 'movement-cbba')));
        await assertFails(setDoc(doc(admin.firestore(), 'rentalPaymentMovements', 'forged'), { store: 'cochabamba', amount: 100 }));
    });
    await test('viewer can read scoped rental data but cannot modify it', async () => {
        await assertSucceeds(getDoc(doc(viewer.firestore(), 'rentals', 'private-rental')));
        await assertFails(updateDoc(doc(viewer.firestore(), 'inventory', 'bike-cbba'), { stock: 9 }));
    });
    await test('disabled admin is denied all protected data', async () => {
        await assertFails(getDoc(doc(disabled.firestore(), 'rentals', 'private-rental')));
        await assertFails(updateDoc(doc(disabled.firestore(), 'inventory', 'bike-cbba'), { stock: 9 }));
    });
    await test('manager can update inventory in their store only', async () => {
        await assertSucceeds(updateDoc(doc(manager.firestore(), 'inventory', 'bike-cbba'), { stock: 5 }));
        await assertFails(updateDoc(doc(manager.firestore(), 'inventory', 'bike-la-paz'), { stock: 5 }));
        await assertSucceeds(deleteDoc(doc(manager.firestore(), 'inventory', 'manager-delete')));
        await assertFails(deleteDoc(doc(manager.firestore(), 'inventory', 'bike-la-paz')));
    });
    await test('mechanic can update workshop order but cannot change inventory', async () => {
        await assertSucceeds(updateDoc(doc(mechanic.firestore(), 'serviceOrders', 'workshop-order'), { status: 'En reparación' }));
        await assertFails(updateDoc(doc(mechanic.firestore(), 'inventory', 'bike-cbba'), { stock: 99 }));
    });
    await test('clients and restricted roles cannot create sales or forged service orders', async () => {
        await assertFails(setDoc(doc(anonymous.firestore(), 'sales', 'forged'), { total: 0 }));
        await assertFails(setDoc(doc(anonymous.firestore(), 'serviceOrders', 'forged'), { customer: 'fake' }));
        await assertFails(setDoc(doc(viewer.firestore(), 'sales', 'forged'), { total: 0, store: 'cochabamba' }));
        await assertFails(setDoc(doc(viewer.firestore(), 'serviceOrders', 'forged'), { customer: 'fake', store: 'cochabamba' }));
    });
    await test('only authorized commercial roles can create a scoped sale', () =>
        assertSucceeds(setDoc(doc(manager.firestore(), 'sales', 'authorized'), { total: 50, store: 'cochabamba' })));
    await test('no client can create a rental or change the server-owned sequence', async () => {
        await assertFails(setDoc(doc(anonymous.firestore(), 'rentals', 'forged'), { total: 1 }));
        await assertFails(setDoc(doc(manager.firestore(), 'rentals', 'forged'), { total: 1, store: 'cochabamba' }));
        await assertFails(setDoc(doc(manager.firestore(), 'settings', 'rental_counter'), { seq: 999 }));
    });
    await test('admin role documents cannot be created or changed from a client', async () => {
        await assertFails(setDoc(doc(anonymous.firestore(), 'adminUsers', 'attacker'), { role: 'admin', active: true }));
        await assertFails(setDoc(doc(manager.firestore(), 'adminUsers', 'manager-cbba'), { role: 'admin', active: true }));
        await assertFails(updateDoc(doc(admin.firestore(), 'adminUsers', 'manager-cbba'), { role: 'admin' }));
    });
    await test('customer profiles cannot be listed or written by clients', async () => {
        await assertFails(getDocs(collection(manager.firestore(), 'customerProfiles')));
        await assertFails(setDoc(doc(manager.firestore(), 'customerProfiles', 'manager-cbba'), { name: 'forged' }));
    });
    await test('customer and rental documents in Storage are private', async () => {
        const privateRental = ref(anonymous.storage(), 'rentals/proof.txt');
        const privateCustomer = ref(anonymous.storage(), 'customers/documents/scan.txt');
        await assertFails(uploadString(privateRental, 'test'));
        await assertFails(uploadString(privateCustomer, 'test'));
        await env.withSecurityRulesDisabled(async (context) => {
            await uploadString(ref(context.storage(), 'rentals/proof.txt'), 'private rental proof');
            await uploadString(ref(context.storage(), 'customerUploads/customer-1/id-front.jpg'), 'private identity image');
        });
        await assertFails(getBytes(privateRental));
        await assertFails(getBytes(ref(anonymous.storage(), 'customerUploads/customer-1/id-front.jpg')));
    });
    await test('publicly served Storage assets remain readable', async () => {
        const path = 'settings/qr-test.png';
        await env.withSecurityRulesDisabled(async (context) => {
            await uploadString(ref(context.storage(), path), 'public asset');
        });
        const bytes = await assertSucceeds(getBytes(ref(anonymous.storage(), path)));
        assert.equal(new TextDecoder().decode(bytes), 'public asset');
    });

    console.log('Firebase rule tests passed.');
} finally {
    if (env) await env.cleanup();
}
