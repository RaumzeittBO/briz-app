import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectStorageEmulator, getStorage, ref, uploadBytes } from 'firebase/storage';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const adminAppSdk = require('firebase-admin/app');
const adminFirestoreSdk = require('firebase-admin/firestore');
const projectId = 'demo-briz-security';
const adminApp = adminAppSdk.initializeApp({ projectId }, `customer-files-admin-${Date.now()}`);
const adminDb = adminFirestoreSdk.getFirestore(adminApp);
const firebaseConfig = {
    apiKey: 'demo-key', authDomain: `${projectId}.local`, projectId,
    appId: 'demo-app', storageBucket: `${projectId}.appspot.com`,
};
const apps: ReturnType<typeof initializeApp>[] = [];
const image = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function pass(label: string): void { console.log(`PASS ${label}`); }

async function makeClient(email: string) {
    const app = initializeApp(firebaseConfig, `customer-files-${apps.length}-${Date.now()}`);
    apps.push(app);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);
    const storage = getStorage(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    const credential = await createUserWithEmailAndPassword(auth, email, 'EmulatorOnly#123');
    return { uid: credential.user.uid, db, functions, storage };
}

async function callFiles(functions: ReturnType<typeof getFunctions>, customerId: string) {
    return httpsCallable<{ customerId: string }, {
        files: Record<string, { url: string | null; state: 'available' | 'missing' }>;
        expiresInSeconds: number;
    }>(functions, 'getAdminCustomerFiles')({ customerId }).then(({ data }) => data);
}

async function seedCustomer(id: string, store: string, fields: Record<string, unknown> = {}) {
    await adminDb.doc(`customers/${id}`).set({ id, store, ...fields });
    if (typeof fields.authUid === 'string') {
        await adminDb.doc(`customerProfiles/${fields.authUid}`).set({
            id: fields.authUid,
            authUid: fields.authUid,
            legacyCustomerId: id,
        });
    }
}

async function upload(storage: ReturnType<typeof getStorage>, path: string): Promise<void> {
    await uploadBytes(ref(storage, path), image, { contentType: 'image/png' });
}

try {
    const admin = await makeClient('customer-files-admin@example.test');
    await adminDb.doc(`adminUsers/${admin.uid}`).set({ uid: admin.uid, role: 'admin', active: true, store: 'all' });
    const ownerA = await makeClient('customer-files-owner-a@example.test');
    const ownerB = await makeClient('customer-files-owner-b@example.test');

    const customerAId = 'legacy-customer-a';
    const customerAUid = ownerA.uid;
    const customerAPath = `customers/${customerAId}/identity/front.png`;
    const customerAUidPath = `customers/${customerAUid}/identity/back.png`;
    await seedCustomer(customerAId, 'cochabamba', {
        authUid: customerAUid,
        documentoPath: customerAPath,
        documentoReversoUrl: `gs://${projectId}.appspot.com/${customerAUidPath}`,
    });
    await upload(admin.storage, customerAPath);
    await upload(admin.storage, customerAUidPath);
    const customerUploadPath = `customerUploads/${customerAUid}/old-id.png`;
    await upload(ownerA.storage, customerUploadPath);
    await adminDb.doc(`customerPrivate/${customerAUid}`).set({ documentoPath: customerUploadPath });

    const customerBId = 'legacy-customer-b';
    const customerBUid = ownerB.uid;
    const customerBPath = `customers/${customerBId}/identity/front.png`;
    await seedCustomer(customerBId, 'lapaz', { authUid: customerBUid });
    await upload(admin.storage, customerBPath);

    const managerTargetPath = `customers/${customerAId}/identity/manager-visible.png`;
    await upload(admin.storage, managerTargetPath);
    await adminDb.doc(`customers/${customerAId}`).update({ autofotoUrl: managerTargetPath });

    const manager = await makeClient('customer-files-manager@example.test');
    await adminDb.doc(`adminUsers/${manager.uid}`).set({ uid: manager.uid, role: 'manager', active: true, store: 'cochabamba' });

    const adminFiles = await callFiles(admin.functions, customerAId);
    assert.equal(adminFiles.expiresInSeconds, 300);
    assert.equal(adminFiles.files.documento.state, 'available');
    assert.equal(adminFiles.files.documentoReverso.state, 'available');
    assert.equal(adminFiles.files.documento.url?.startsWith('data:image/png;base64,'), true);
    assert.equal(adminFiles.files.autofoto.state, 'available');
    pass('Admin can retrieve legacy files owned by the customer ID and its verified authUid');

    const managerFiles = await callFiles(manager.functions, customerAId);
    assert.equal(managerFiles.files.autofoto.state, 'available');
    await assert.rejects(
        () => callFiles(manager.functions, customerBId),
        (error: unknown) => (error as { code?: string }).code === 'functions/permission-denied',
    );
    pass('Manager can read same-branch files and is denied files from another branch');

    const crossCustomerId = 'legacy-customer-cross-reference';
    const ownerCross = await makeClient('customer-files-owner-cross@example.test');
    await seedCustomer(crossCustomerId, 'cochabamba', {
        authUid: ownerCross.uid, documentoPath: customerBPath,
    });
    const crossFiles = await callFiles(admin.functions, crossCustomerId);
    assert.equal(crossFiles.files.documento.state, 'missing');
    assert.equal(crossFiles.files.documento.url, null);

    const foreignBucketId = 'legacy-customer-foreign-bucket';
    await seedCustomer(foreignBucketId, 'cochabamba', {
        authUid: 'verified-foreign-bucket-uid',
        documentoUrl: `https://firebasestorage.googleapis.com/v0/b/other-project.firebasestorage.app/o/${encodeURIComponent(`customers/${foreignBucketId}/id.png`)}?alt=media&token=fake`,
    });
    const foreignBucketFiles = await callFiles(admin.functions, foreignBucketId);
    assert.equal(foreignBucketFiles.files.documento.state, 'missing');
    assert.equal(foreignBucketFiles.files.documento.url, null);
    pass('Cross-customer references and URLs for another bucket return no file URL');

    const ambiguousId = 'legacy-customer-ambiguous';
    await seedCustomer(ambiguousId, 'cochabamba', {
        authUid: 'verified-ambiguous-uid',
        documentoPath: `customers/${ambiguousId}/../${customerBId}/identity/front.png`,
    });
    const ambiguousFiles = await callFiles(admin.functions, ambiguousId);
    assert.equal(ambiguousFiles.files.documento.state, 'missing');
    assert.equal(ambiguousFiles.files.documento.url, null);

    const encodedId = 'legacy-customer-encoded';
    await seedCustomer(encodedId, 'cochabamba', {
        authUid: 'verified-encoded-uid',
        documentoPath: `customers%2F${encodedId}%2Fidentity%2Ffront.png`,
    });
    const encodedFiles = await callFiles(admin.functions, encodedId);
    assert.equal(encodedFiles.files.documento.state, 'missing');
    assert.equal(encodedFiles.files.documento.url, null);
    pass('Ambiguous traversal and encoded paths are rejected without revealing file existence');

    const unauthorized = await makeClient('customer-files-unauthorized@example.test');
    await assert.rejects(
        () => callFiles(unauthorized.functions, customerAId),
        (error: unknown) => (error as { code?: string }).code === 'functions/permission-denied',
    );
    pass('Unauthenticated-role users cannot obtain document URLs');

    const unchangedCustomer = await adminDb.doc(`customers/${customerAId}`).get();
    assert.equal(unchangedCustomer.get('documentoPath'), customerAPath);
    assert.equal(unchangedCustomer.get('documentoReversoUrl'), `gs://${projectId}.appspot.com/${customerAUidPath}`);
    assert.equal(JSON.stringify(unchangedCustomer.data()).includes('data:image/png;base64,'), false);
    pass('Emulator responses are short-lived and generated data URLs are not written to customer documents');
} finally {
    await Promise.all(apps.map((app) => deleteApp(app)));
    await adminApp.delete();
}
