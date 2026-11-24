import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createInventoryDraftPatch, findInventoryDraftConflicts, getInventoryContentFieldsToClear } from '../src/lib/inventoryDraft';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const projectId = 'demo-briz-inventory-protection';
const app = initializeApp({ projectId }, `inventory-protection-${Date.now()}`);
const db = getFirestore(app);
const itemRef = db.collection('_inventoryDraftProtectionTests').doc(`draft-${Date.now()}`);
const shopItemRef = db.collection('_inventoryDraftProtectionTests').doc(`shop-draft-${Date.now()}`);

try {
  const original = {
    id: 'fictional-bike',
    name: 'Bicicleta ficticia',
    description: 'Descripción inicial',
    imageUrl: 'inventory/fictitious-photo.jpg',
    stock: 4,
    pricePerDay: 75,
  };
  await itemRef.set(original);

  const editorA = { ...original, description: 'Descripción editada en A' };
  const editorB = { ...original, stock: 3 };
  await itemRef.update(createInventoryDraftPatch(original, editorA));
  const afterEditorA = (await itemRef.get()).data() || {};
  const editorBPatch = createInventoryDraftPatch(original, editorB);
  assert.deepEqual(findInventoryDraftConflicts(original, afterEditorA, editorBPatch), [], 'an unrelated remote field edit must not conflict');
  await itemRef.update(editorBPatch);

  const final = (await itemRef.get()).data();
  assert.equal(final?.description, 'Descripción editada en A', 'stale editor B must not revert editor A');
  assert.equal(final?.stock, 3, 'the explicit stock edit from editor B must still save');
  assert.equal(final?.imageUrl, original.imageUrl, 'unchanged image references must remain untouched');
  assert.equal(final?.pricePerDay, original.pricePerDay, 'unchanged price must remain untouched');
  assert.deepEqual(createInventoryDraftPatch(original, original), {}, 'unchanged forms should produce no write fields');

  const editorC = { ...original, description: 'Cambio local' };
  const remoteEdit = { ...original, description: 'Cambio remoto' };
  assert.deepEqual(
    findInventoryDraftConflicts(original, remoteEdit, createInventoryDraftPatch(original, editorC)),
    ['description'],
    'the same field changed remotely must be reported as a conflict',
  );
  assert.deepEqual(getInventoryContentFieldsToClear(original, { ...original, imageUrl: '', description: '' }), ['imageUrl', 'description']);

  const shopOriginal = {
    id: 'fictional-shop-bike',
    description: 'Descripción inicial de tienda',
    details: 'Detalles intactos',
    imageUrl: 'inventory/old-fictitious-photo.jpg',
    additionalImageUrls: ['inventory/old-gallery-photo.jpg'],
    stock: 6,
    salePrice: 120,
    pricePerDay: 45,
  };
  await shopItemRef.set(shopOriginal);

  // Inventory saves a new description and photo after the Shop editor took its snapshot.
  const inventoryEdit = {
    ...shopOriginal,
    description: 'Descripción actualizada desde Inventario',
    imageUrl: 'inventory/new-fictitious-photo.jpg',
    additionalImageUrls: ['inventory/new-gallery-photo.jpg'],
  };
  await shopItemRef.update(createInventoryDraftPatch(shopOriginal, inventoryEdit));

  // The stale Shop editor changes only its price and submits the original snapshot for conflict checks.
  const shopEdit = { ...shopOriginal, salePrice: 135 };
  const shopPatch = createInventoryDraftPatch(shopOriginal, shopEdit);
  assert.deepEqual(Object.keys(shopPatch), ['salePrice'], 'Shop must send only the explicitly changed price');
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(shopItemRef);
    assert.ok(snapshot.exists, 'the product must still exist');
    const current = snapshot.data() || {};
    assert.deepEqual(findInventoryDraftConflicts(shopOriginal, current, shopPatch), [], 'independent Inventory photo/description changes must not block a Shop price edit');
    transaction.update(shopItemRef, shopPatch);
  });
  const afterShopEdit = (await shopItemRef.get()).data();
  assert.deepEqual(afterShopEdit, { ...inventoryEdit, salePrice: 135 }, 'price save must preserve the newer photo, description, gallery, details, stock, and other prices');

  console.log('PASS stale inventory drafts only update explicitly changed fields');
} finally {
  await shopItemRef.delete();
  await itemRef.delete();
  await deleteApp(app);
}
