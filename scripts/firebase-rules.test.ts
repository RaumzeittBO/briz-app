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
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import { filterCompletedServiceOrders, serviceOrderRevenue } from '../src/lib/adminReportScope';

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
        await setDoc(doc(db, 'inventory', 'public-shop-item'), { id: 'public-shop-item', stock: 6, salePrice: 20 });
        await setDoc(doc(db, 'rentals', 'private-rental'), {
            id: 'private-rental', store: 'cochabamba', customerName: 'Test only',
            status: 'pending', paymentStatus: 'unpaid', total: 40, amountPaid: 0,
        });
        await setDoc(doc(db, 'rentalPaymentMovements', 'movement-cbba'), { id: 'movement-cbba', store: 'cochabamba', reservationCode: 'TEST-001', type: 'receipt', amount: 10 });
        await setDoc(doc(db, 'customers', 'legacy-customer'), { id: 'legacy-customer', password: 'test-hash' });
        await setDoc(doc(db, 'serviceOrders', 'workshop-order'), { id: 'workshop-order', store: 'cochabamba', status: 'Recibido' });
        await setDoc(doc(db, 'serviceOrders', 'workshop-order-lpz'), { id: 'workshop-order-lpz', store: 'lapaz', status: 'Recibido' });
        await setDoc(doc(db, 'sales', 'sale'), { id: 'sale', store: 'cochabamba', total: 10 });
        await setDoc(doc(db, 'publicArtworkConfig', 'home_welcome_badge'), {
            slotId: 'home_welcome_badge',
            variants: { esDesktop: { url: 'https://artwork.invalid/current.png' } },
            currentVersionId: 'version-1',
        });
        await setDoc(doc(db, 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-1'), {
            id: 'version-1', variants: { esDesktop: { url: 'https://artwork.invalid/current.png' } }, actorUid: 'root', action: 'publish',
        });
        await setDoc(doc(db, 'artworkDrafts', 'root_home_welcome_badge_esDesktop'), {
            id: 'root_home_welcome_badge_esDesktop', ownerUid: 'root', slotId: 'home_welcome_badge', variant: 'esDesktop', storagePath: 'artwork-drafts/root/home_welcome_badge/esDesktop/draft.png',
        });
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
    await test('manual sale idempotency records are private to their active admin/manager owner', async () => {
        const operation = doc(manager.firestore(), 'adminUsers', 'manager-cbba', 'manualSaleOperations', 'sale-op-1');
        await assertSucceeds(getDoc(operation));
        await assertSucceeds(setDoc(operation, { saleId: 'sale-op-1', createdAt: new Date().toISOString() }));
        await assertFails(updateDoc(operation, { saleId: 'sale-op-2' }));
        await assertFails(deleteDoc(operation));
        await assertFails(getDoc(doc(otherStoreManager.firestore(), 'adminUsers', 'manager-cbba', 'manualSaleOperations', 'sale-op-1')));
        await assertFails(getDocs(collection(manager.firestore(), 'adminUsers', 'manager-cbba', 'manualSaleOperations')));
    });
    await test('published artwork metadata is public-read and Admin-only write; version history is private', async () => {
        const publicConfig = doc(anonymous.firestore(), 'publicArtworkConfig', 'home_welcome_badge');
        await assertSucceeds(getDoc(publicConfig));
        await assertFails(setDoc(publicConfig, { variants: {} }));
        const adminDb = admin.firestore();
        const configRef = doc(adminDb, 'publicArtworkConfig', 'home_welcome_badge');
        await assertFails(setDoc(configRef, { variants: { esDesktop: { url: 'https://artwork.invalid/next.png' } }, currentVersionId: 'version-2' }));
        await assertFails(deleteDoc(configRef));
        const publishedVariants = { esDesktop: { url: 'https://artwork.invalid/next.png' } };
        await assertSucceeds(runTransaction(adminDb, async (transaction) => {
            transaction.set(doc(adminDb, 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-2'), { id: 'version-2', variants: publishedVariants, actorUid: 'root', action: 'publish', createdAt: Timestamp.now() });
            transaction.set(configRef, { slotId: 'home_welcome_badge', variants: publishedVariants, currentVersionId: 'version-2' });
        }));
        await assertFails(setDoc(doc(manager.firestore(), 'publicArtworkConfig', 'home_welcome_badge'), { variants: {} }));
        await assertSucceeds(getDoc(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-1')));
        await assertFails(getDoc(doc(anonymous.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-1')));
        await assertFails(setDoc(doc(manager.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'bad'), { variants: {} }));
        await assertFails(updateDoc(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-1'), { action: 'overwrite' }));
        await assertFails(deleteDoc(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-1')));
        const restoredVariants = { esDesktop: { url: 'https://artwork.invalid/current.png' } };
        await assertSucceeds(runTransaction(adminDb, async (transaction) => {
            transaction.set(doc(adminDb, 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-3'), { id: 'version-3', variants: restoredVariants, actorUid: 'root', action: 'restore', restoredFrom: 'version-1', createdAt: Timestamp.now() });
            transaction.set(configRef, { slotId: 'home_welcome_badge', variants: restoredVariants, currentVersionId: 'version-3' });
        }));
        assert.deepEqual((await assertSucceeds(getDoc(doc(anonymous.firestore(), 'publicArtworkConfig', 'home_welcome_badge')))).data()?.variants, restoredVariants);
    });
    await test('artwork draft metadata is restricted to active Admin', async () => {
        await assertSucceeds(getDoc(doc(admin.firestore(), 'artworkDrafts', 'root_home_welcome_badge_esDesktop')));
        await assertFails(getDoc(doc(manager.firestore(), 'artworkDrafts', 'root_home_welcome_badge_esDesktop')));
        await assertFails(getDoc(doc(anonymous.firestore(), 'artworkDrafts', 'root_home_welcome_badge_esDesktop')));
        await assertSucceeds(setDoc(doc(admin.firestore(), 'artworkDrafts', 'new-draft'), { ownerUid: 'root', slotId: 'home_welcome_badge' }));
        await assertFails(setDoc(doc(manager.firestore(), 'artworkDrafts', 'manager-draft'), { ownerUid: 'manager-cbba' }));
        await assertFails(deleteDoc(doc(manager.firestore(), 'artworkDrafts', 'root_home_welcome_badge_esDesktop')));
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
    await test('workshop create/edit/status/cost/delete follow roles and store scope; report counts delivered work only', async () => {
        const orderRef = doc(mechanic.firestore(), 'serviceOrders', 'workshop-order');
        await assertSucceeds(updateDoc(orderRef, { status: 'En reparación', costEstimate: 140, issue: 'Fictional repair' }));
        await assertSucceeds(setDoc(doc(manager.firestore(), 'serviceOrders', 'workshop-new'), {
            id: 'workshop-new', store: 'cochabamba', customer: 'Test only', status: 'Recibido', costEstimate: 50, date: '2026-10-21T12:00:00Z',
        }));
        await assertFails(setDoc(doc(manager.firestore(), 'serviceOrders', 'workshop-out-of-store'), {
            id: 'workshop-out-of-store', store: 'lapaz', customer: 'Test only', status: 'Recibido', costEstimate: 10,
        }));
        await assertSucceeds(setDoc(doc(admin.firestore(), 'serviceOrders', 'workshop-admin'), {
            id: 'workshop-admin', store: 'lapaz', customer: 'Test only', status: 'Recibido', costEstimate: 20,
        }));
        await assertSucceeds(deleteDoc(doc(admin.firestore(), 'serviceOrders', 'workshop-admin')));
        await assertFails(updateDoc(doc(mechanic.firestore(), 'serviceOrders', 'workshop-order-lpz'), { status: 'Entregado', costEstimate: 0 }));
        await assertFails(updateDoc(doc(viewer.firestore(), 'serviceOrders', 'workshop-order'), { status: 'Entregado', costEstimate: 0 }));
        await assertSucceeds(updateDoc(orderRef, { status: 'Entregado', costEstimate: 140, date: '2026-10-21T12:00:00Z' }));
        await assertSucceeds(deleteDoc(doc(mechanic.firestore(), 'serviceOrders', 'workshop-new')));
        await assertFails(updateDoc(doc(mechanic.firestore(), 'inventory', 'bike-cbba'), { stock: 99 }));
        const samePeriod = [
            { status: 'Entregado', store: 'cochabamba', costEstimate: 140, date: '2026-10-21T12:00:00Z' },
            { status: 'Recibido', store: 'cochabamba', costEstimate: 999, date: '2026-10-21T12:00:00Z' },
            { status: 'Listo', store: 'lapaz', costEstimate: 70, date: '2026-10-21T12:00:00Z' },
        ];
        const reportRows = filterCompletedServiceOrders(samePeriod, { start: '2026-10-21', end: '2026-10-21' }, 'cochabamba', (order) => order.date!.slice(0, 10));
        assert.equal(reportRows.length, 1);
        assert.equal(serviceOrderRevenue(reportRows[0]), 140);
    });
    await test('admin secondary collections allow only intended admin/branch CRUD and community submissions stay pending', async () => {
        await assertSucceeds(setDoc(doc(admin.firestore(), 'routes', 'route-test'), { id: 'route-test', name: 'Fictional route' }));
        await assertSucceeds(updateDoc(doc(admin.firestore(), 'routes', 'route-test'), { name: 'Edited fictional route' }));
        await assertSucceeds(deleteDoc(doc(admin.firestore(), 'routes', 'route-test')));
        await assertFails(setDoc(doc(manager.firestore(), 'events', 'event-forbidden'), { id: 'event-forbidden', name: 'Test' }));
        await assertSucceeds(setDoc(doc(admin.firestore(), 'events', 'event-test'), { id: 'event-test', name: 'Fictional event' }));
        await assertSucceeds(deleteDoc(doc(admin.firestore(), 'events', 'event-test')));
        await assertFails(setDoc(doc(manager.firestore(), 'settings', 'rental_settings'), { hourlyRate: 1 }));
        await assertSucceeds(setDoc(doc(admin.firestore(), 'settings', 'rental_settings'), { hourlyRate: 35, testOnly: true }));
        await assertSucceeds(updateDoc(doc(manager.firestore(), 'inventory', 'bike-cbba'), { stock: 6 }));
        await assertFails(updateDoc(doc(manager.firestore(), 'inventory', 'bike-la-paz'), { stock: 6 }));
        await assertSucceeds(setDoc(doc(manager.firestore(), 'combos', 'combo-cbba'), { id: 'combo-cbba', store: 'cochabamba', active: true }));
        await assertFails(setDoc(doc(manager.firestore(), 'combos', 'combo-lpz'), { id: 'combo-lpz', store: 'lapaz', active: true }));
        await assertSucceeds(setDoc(doc(anonymous.firestore(), 'communityItems', 'community-public'), {
            id: 'community-public', name: 'Fictional visitor', message: 'Test entry', imageUrl: '', createdAt: new Date().toISOString(), status: 'pending',
        }));
        await assertFails(setDoc(doc(anonymous.firestore(), 'communityItems', 'community-forged'), {
            id: 'community-forged', name: 'Fictional visitor', message: 'Forged approval', createdAt: new Date().toISOString(), status: 'approved',
        }));
        await assertFails(updateDoc(doc(manager.firestore(), 'communityItems', 'community-public'), { status: 'approved' }));
        await assertSucceeds(updateDoc(doc(admin.firestore(), 'communityItems', 'community-public'), { status: 'approved' }));
        await assertSucceeds(deleteDoc(doc(admin.firestore(), 'communityItems', 'community-public')));
    });
    await test('clients and restricted roles cannot create sales or forged service orders', async () => {
        await assertFails(setDoc(doc(anonymous.firestore(), 'sales', 'forged'), { total: 0 }));
        await assertFails(setDoc(doc(anonymous.firestore(), 'serviceOrders', 'forged'), { customer: 'fake' }));
        await assertFails(setDoc(doc(viewer.firestore(), 'sales', 'forged'), { total: 0, store: 'cochabamba' }));
        await assertFails(setDoc(doc(viewer.firestore(), 'serviceOrders', 'forged'), { customer: 'fake', store: 'cochabamba' }));
    });
    await test('public WhatsApp checkout cannot persist a sale/customer or change inventory', async () => {
        await assertFails(setDoc(doc(anonymous.firestore(), 'customers', 'public-shop-customer'), {
            id: 'public-shop-customer', name: 'Fictional Customer', phone: '70000000', ci: 'TEST-ONLY',
        }));
        await assertFails(setDoc(doc(anonymous.firestore(), 'sales', 'public-shop-sale'), {
            id: 'public-shop-sale', total: 40, status: 'Pendiente',
        }));
        await env.withSecurityRulesDisabled(async (context) => {
            const db = context.firestore();
            assert.equal((await getDoc(doc(db, 'inventory', 'public-shop-item'))).get('stock'), 6);
            assert.equal((await getDoc(doc(db, 'sales', 'public-shop-sale'))).exists(), false);
            assert.equal((await getDoc(doc(db, 'customers', 'public-shop-customer'))).exists(), false);
        });
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
        const privateRental = anonymous.storage().ref('rentals/proof.txt');
        const privateCustomer = anonymous.storage().ref('customers/documents/scan.txt');
        await assertFails(privateRental.putString('test'));
        await assertFails(privateCustomer.putString('test'));
        await env.withSecurityRulesDisabled(async (context) => {
            await context.storage().ref('rentals/proof.txt').putString('private rental proof');
            await context.storage().ref('customerUploads/customer-1/id-front.jpg').putString('private identity image');
        });
        await assertFails(privateRental.getDownloadURL());
        await assertFails(anonymous.storage().ref('customerUploads/customer-1/id-front.jpg').getDownloadURL());
    });
    await test('Storage enforces customer ownership, upload type/size, admin assets, service-order scope, replacement and deletion', async () => {
        const customer = env.authenticatedContext('customer-1');
        const otherCustomer = env.authenticatedContext('customer-2');
        const ownRef = customer.storage().ref('customerUploads/customer-1/profile.png');
        const pngOne = 'fictional-image-one';
        const pngTwo = 'fictional-image-replacement';
        await assertSucceeds(ownRef.putString(pngOne, 'raw', { contentType: 'image/png' }));
        const firstUrl = await assertSucceeds(ownRef.getDownloadURL());
        assert.equal(await fetch(firstUrl).then((response) => response.text()), pngOne);
        assert.equal(await fetch(await assertSucceeds(admin.storage().ref('customerUploads/customer-1/profile.png').getDownloadURL())).then((response) => response.text()), pngOne);
        await assertSucceeds(ownRef.putString(pngTwo, 'raw', { contentType: 'image/png' }));
        const replacementUrl = await assertSucceeds(ownRef.getDownloadURL());
        assert.equal(await fetch(replacementUrl).then((response) => response.text()), pngTwo);
        await assertSucceeds(ownRef.delete());
        await assertFails(otherCustomer.storage().ref('customerUploads/customer-1/forbidden.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(otherCustomer.storage().ref('customerUploads/customer-1/profile.png').getDownloadURL());
        await assertFails(anonymous.storage().ref('public-assets/forbidden.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(admin.storage().ref('public-assets/invalid.txt').putString(pngOne, 'raw', { contentType: 'text/plain' }));
        const publicAsset = admin.storage().ref('public-assets/test-only.png');
        await assertSucceeds(publicAsset.putString(pngOne, 'raw', { contentType: 'image/png' }));
        assert.equal(await fetch(await assertSucceeds(anonymous.storage().ref('public-assets/test-only.png').getDownloadURL())).then((response) => response.text()), pngOne);
        await assertSucceeds(publicAsset.putString(pngTwo, 'raw', { contentType: 'image/png' }));
        assert.equal(await fetch(await assertSucceeds(anonymous.storage().ref('public-assets/test-only.png').getDownloadURL())).then((response) => response.text()), pngTwo);
        await assertSucceeds(publicAsset.delete());
        const artwork = admin.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/version_1.png');
        await assertSucceeds(artwork.putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/version_1.png').getDownloadURL());
        const configRef = doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge');
        const publishedVariants = { esDesktop: { url: 'https://artwork.invalid/version_1.png', storagePath: 'public-assets/artworks/home_welcome_badge/esDesktop/version_1.png' } };
        await assertSucceeds(runTransaction(admin.firestore(), async (transaction) => {
            transaction.set(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-4'), {
                id: 'version-4', variants: publishedVariants, actorUid: 'root', action: 'publish', createdAt: Timestamp.now(),
            });
            transaction.set(configRef, { slotId: 'home_welcome_badge', variants: publishedVariants, currentVersionId: 'version-4' });
        }));
        assert.equal(await fetch(await assertSucceeds(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/version_1.png').getDownloadURL())).then((response) => response.text()), pngOne);
        const nextArtworkPath = 'public-assets/artworks/home_welcome_badge/esDesktop/version_2.png';
        await assertSucceeds(admin.storage().ref(nextArtworkPath).putString(pngTwo, 'raw', { contentType: 'image/png' }));
        await assertFails(anonymous.storage().ref(nextArtworkPath).getDownloadURL());
        const nextVariants = { esDesktop: { url: 'https://artwork.invalid/version_2.png', storagePath: nextArtworkPath } };
        await assertSucceeds(runTransaction(admin.firestore(), async (transaction) => {
            transaction.set(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-5'), {
                id: 'version-5', variants: nextVariants, actorUid: 'root', action: 'publish', createdAt: Timestamp.now(),
            });
            transaction.set(configRef, { slotId: 'home_welcome_badge', variants: nextVariants, currentVersionId: 'version-5' });
        }));
        await assertFails(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/version_1.png').getDownloadURL());
        assert.equal(await fetch(await assertSucceeds(anonymous.storage().ref(nextArtworkPath).getDownloadURL())).then((response) => response.text()), pngTwo);
        await assertSucceeds(runTransaction(admin.firestore(), async (transaction) => {
            transaction.set(doc(admin.firestore(), 'publicArtworkConfig', 'home_welcome_badge', 'versions', 'version-6'), {
                id: 'version-6', variants: publishedVariants, actorUid: 'root', action: 'restore', restoredFrom: 'version-4', createdAt: Timestamp.now(),
            });
            transaction.set(configRef, { slotId: 'home_welcome_badge', variants: publishedVariants, currentVersionId: 'version-6' });
        }));
        assert.equal(await fetch(await assertSucceeds(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/version_1.png').getDownloadURL())).then((response) => response.text()), pngOne);
        await assertFails(anonymous.storage().ref(nextArtworkPath).getDownloadURL());
        await assertFails(artwork.putString(pngTwo, 'raw', { contentType: 'image/png' }));
        await assertFails(artwork.delete());
        await assertSucceeds(admin.storage().ref('public-assets/artworks/home_welcome_badge/enMobile/version_2.jpg').putString(pngTwo, 'raw', { contentType: 'image/jpeg' }));
        await assertSucceeds(admin.storage().ref('public-assets/artworks/home_welcome_badge/enDesktop/version_3.webp').putString(pngTwo, 'raw', { contentType: 'image/webp' }));
        await assertFails(admin.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/invalid.gif').putString(pngTwo, 'raw', { contentType: 'image/gif' }));
        await assertFails(admin.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/invalid.pdf').putString(pngTwo, 'raw', { contentType: 'application/pdf' }));
        await assertFails(manager.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/manager.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/anonymous.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        const unpublished = admin.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/unpublished.png');
        await assertSucceeds(unpublished.putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(anonymous.storage().ref('public-assets/artworks/home_welcome_badge/esDesktop/unpublished.png').getDownloadURL());
        await assertSucceeds(unpublished.delete());
        const privateDraft = admin.storage().ref('artwork-drafts/root/home_welcome_badge/esDesktop/draft_1.png');
        await assertSucceeds(privateDraft.putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(privateDraft.getDownloadURL());
        await assertFails(anonymous.storage().ref('artwork-drafts/root/home_welcome_badge/esDesktop/draft_1.png').getDownloadURL());
        await assertFails(manager.storage().ref('artwork-drafts/manager-cbba/home_welcome_badge/esDesktop/draft_1.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(privateDraft.delete());
        const rentalProof = manager.storage().ref('rentals/TEST-ONLY/proof.png');
        await assertSucceeds(rentalProof.putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(rentalProof.putString(pngTwo, 'raw', { contentType: 'image/png' }));
        await assertFails(viewer.storage().ref('rentals/TEST-ONLY/proof.png').delete());
        await assertSucceeds(rentalProof.delete());
        const qrAsset = admin.storage().ref('settings/test-only-qr.png');
        await assertSucceeds(qrAsset.putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(qrAsset.putString(pngTwo, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(qrAsset.delete());
        await assertSucceeds(mechanic.storage().ref('serviceOrders/cochabamba/order-1/photo.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertSucceeds(mechanic.storage().ref('serviceOrders/cochabamba/order-1/photo.png').delete());
        await assertFails(mechanic.storage().ref('serviceOrders/lapaz/order-2/photo.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
        await assertFails(viewer.storage().ref('serviceOrders/cochabamba/order-1/photo.png').putString(pngOne, 'raw', { contentType: 'image/png' }));
    });
    await test('publicly served Storage assets remain readable', async () => {
        const path = 'settings/qr-test.png';
        await env.withSecurityRulesDisabled(async (context) => {
            await context.storage().ref(path).putString('public asset');
        });
        const response = await fetch(await assertSucceeds(anonymous.storage().ref(path).getDownloadURL()));
        assert.equal(await response.text(), 'public asset');
    });

    console.log('Firebase rule tests passed.');
} finally {
    if (env) await env.cleanup();
}
