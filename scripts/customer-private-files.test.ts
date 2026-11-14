import assert from 'node:assert/strict';
import { resolveCustomerPrivateFiles, type CustomerPrivateFileBucket } from '../functions/src/customerPrivateFiles';

const uid = 'customer-uid-1';
const legacyId = 'legacy-customer-1';
const paths = {
    autofotoPath: `customerUploads/${uid}/selfie.jpg`,
    documentoPath: `customerUploads/${uid}/document-front.png`,
    documentoReversoPath: `customerUploads/${uid}/document-back.png`,
};
const files = new Set(Object.values(paths));
const bucket: CustomerPrivateFileBucket = {
    name: 'briz-test.appspot.com',
    // Deliberately exposes only individual object checks; there is no list/getFiles capability.
    file(path) { return { exists: async () => [files.has(path)] }; },
};

const complete = await resolveCustomerPrivateFiles(uid, '', [paths], bucket, 'review');
assert.deepEqual(complete.paths, paths);
assert.deepEqual(complete.missing, []);
assert.deepEqual(complete.needsReview, []);

const legacyPaths = {
    autofotoPath: `customers/${legacyId}/selfie.jpg`,
    documentoPath: `customers/${legacyId}/document-front.png`,
    documentoReversoPath: `customers/${legacyId}/document-back.png`,
};
const legacyBucket: CustomerPrivateFileBucket = {
    name: bucket.name,
    file(path) { return { exists: async () => [Object.values(legacyPaths).includes(path)] }; },
};
const linkedLegacy = await resolveCustomerPrivateFiles(uid, legacyId, [legacyPaths], legacyBucket, 'review');
assert.deepEqual(linkedLegacy.paths, legacyPaths, 'Only the explicitly linked legacy root is accepted.');
assert.deepEqual(linkedLegacy.needsReview, []);

const unrelatedLegacy = await resolveCustomerPrivateFiles(uid, legacyId, [{ ...legacyPaths, documentoPath: 'customers/someone-else/document-front.png' }], legacyBucket, 'review');
assert.deepEqual(unrelatedLegacy.paths.documentoPath, undefined);
assert.ok(unrelatedLegacy.needsReview.includes('documento'), 'Another customer path is not adopted and needs human review.');

const noReferenceNewAccount = await resolveCustomerPrivateFiles(uid, '', [], bucket, 'missing');
assert.deepEqual(noReferenceNewAccount.missing, ['autofoto', 'documento', 'documentoReverso']);
assert.deepEqual(noReferenceNewAccount.needsReview, []);

const noReferenceLegacy = await resolveCustomerPrivateFiles(uid, legacyId, [{}], bucket, 'review');
assert.deepEqual(noReferenceLegacy.missing, []);
assert.deepEqual(noReferenceLegacy.needsReview, ['autofoto', 'documento', 'documentoReverso']);

const missingObjectBucket: CustomerPrivateFileBucket = {
    name: bucket.name,
    file() { return { exists: async () => [false] }; },
};
const genuinelyMissing = await resolveCustomerPrivateFiles(uid, '', [paths], missingObjectBucket, 'review');
assert.deepEqual(genuinelyMissing.missing, ['autofoto', 'documento', 'documentoReverso']);
assert.deepEqual(genuinelyMissing.needsReview, [], 'A verifiable owned reference to a nonexistent object differs from no safe reference.');

const deniedBucket: CustomerPrivateFileBucket = {
    name: bucket.name,
    file() { return { exists: async () => { throw new Error('storage.objects.get denied'); } }; },
};
await assert.rejects(() => resolveCustomerPrivateFiles(uid, '', [paths], deniedBucket, 'review'), /storage\.objects\.get denied/);

console.log('Customer private file reference checks passed (7 scenarios; no list permission/API).');
