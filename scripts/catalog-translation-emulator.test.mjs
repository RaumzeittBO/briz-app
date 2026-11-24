import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { cacheKeyFor } = require('../functions/lib/catalogTranslation.js');
const app = initializeApp({ projectId: 'demo-briz-translations' }, 'catalog-translation-emulator');
const db = getFirestore(app);

async function waitFor(read, predicate, label) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const value = await read();
        if (predicate(value)) return value;
        await delay(500);
    }
    throw new Error(`Timed out waiting for Emulator translation: ${label}`);
}

try {
    const itemRef = db.doc('inventory/emulator-translation-bike');
    await itemRef.set({
        id: 'emulator-translation-bike',
        name: 'Bicicleta ficticia de prueba',
        description: 'Descripción ficticia para pruebas',
        details: 'Aro 26, modelo ABC-123, Bs 850',
        imageUrl: 'fixture://bike',
        additionalImageUrls: ['fixture://side'],
        stock: 3,
        salePrice: 850,
    });
    let product = await waitFor(async () => (await itemRef.get()).data(), value => value?.nameEn === 'Fictional test bicycle', 'new product');
    assert.equal(product.descriptionEn, 'Fictional test description');
    assert.equal(product.stock, 3);
    assert.equal(product.salePrice, 850);
    assert.equal(product.imageUrl, 'fixture://bike');
    assert.deepEqual(product.additionalImageUrls, ['fixture://side']);
    const cachedName = await db.doc(`translationCache/${cacheKeyFor('Bicicleta ficticia de prueba', 'emulator-mock')}`).get();
    assert.equal(cachedName.data()?.translatedText, 'Fictional test bicycle');
    assert.equal(cachedName.data()?.provider, 'emulator-mock');

    const secondRef = db.doc('inventory/emulator-translation-bike-cached');
    await secondRef.set({ name: 'Bicicleta ficticia de prueba', description: 'Otra descripción de prueba' });
    const cachedProduct = await waitFor(async () => (await secondRef.get()).data(), value => value?.nameEn === 'Fictional test bicycle', 'reused cached translation');
    assert.equal(cachedProduct?.translationMeta?.nameEn?.sourceHash, product?.translationMeta?.nameEn?.sourceHash);
    await secondRef.delete();

    await itemRef.update({ description: 'Descripción ficticia para pruebas v2' });
    product = await waitFor(async () => (await itemRef.get()).data(), value => value?.descriptionEn === 'Mock EN: Descripción ficticia para pruebas v2', 'Spanish source update');
    assert.equal(product.nameEn, 'Fictional test bicycle');
    assert.equal(product.stock, 3);
    assert.equal(product.salePrice, 850);

    await itemRef.update({ nameEn: 'Manual bicycle title', name: 'Bicicleta ficticia de prueba v2' });
    product = await waitFor(async () => (await itemRef.get()).data(), value => value?.name === 'Bicicleta ficticia de prueba v2', 'manual translation protection');
    await delay(1000);
    product = (await itemRef.get()).data();
    assert.equal(product?.nameEn, 'Manual bicycle title', 'manual English is preserved when source changes');

    const categoryRef = db.doc('settings/accessory_categories');
    await categoryRef.set({ categories: ['Categoría ficticia de alquiler'] });
    const categories = await waitFor(async () => (await categoryRef.get()).data(), value => value?.translations?.['Categoría ficticia de alquiler'] === 'Fictional rental category', 'dynamic category');
    assert.deepEqual(categories?.categories, ['Categoría ficticia de alquiler']);

    const routeRef = db.doc('routes/emulator-translation-route');
    await routeRef.set({ name: 'Ruta ficticia', description: 'Descripción de ruta ficticia', highlights: ['Plaza de prueba', 'Cerro de prueba'], distance: '8 km' });
    const route = await waitFor(async () => (await routeRef.get()).data(), value => value?.highlightsEn?.length === 2, 'route highlight translations');
    assert.equal(route?.nameEn, 'Fictional route');
    assert.deepEqual(route?.highlightsEn, ['Test plaza', 'Test hill']);
    assert.equal(route?.distance, '8 km');

    const eventRef = db.doc('events/emulator-translation-event');
    await eventRef.set({ name: 'Evento ficticio', description: 'Descripción de evento ficticia', subcategories: [{ name: 'Sesión de prueba', images: ['fixture://event'] }] });
    const event = await waitFor(async () => (await eventRef.get()).data(), value => value?.subcategoryNamesEn?.length === 1, 'event subcategory translations');
    assert.equal(event?.nameEn, 'Fictional event');
    assert.deepEqual(event?.subcategoryNamesEn, ['Test session']);
    assert.deepEqual(event?.subcategories, [{ name: 'Sesión de prueba', images: ['fixture://event'] }]);

    await itemRef.delete();
    await categoryRef.delete();
    await routeRef.delete();
    await eventRef.delete();
    console.log('PASS Functions + Firestore Emulator: automatic mock translation, persistent cache reuse, manual copy protection, partial writes, and categories');
} finally {
    await app.delete();
}
