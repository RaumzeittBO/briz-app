import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { cacheKeyFor } = require('../functions/lib/catalogTranslation.js');
const { TranslationProviderFailure } = require('../functions/lib/catalogTranslation.js');
const { translateWithQuota } = require('../functions/lib/translationQuota.js');
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
    const providerKey = 'emulator-quota-test';
    const quotaCacheRefs = [];
    const quotaUsageRefs = [];
    const makeProvider = (translateMany) => ({ translateMany });
    const cacheRefFor = (text) => db.doc(`translationCache/${cacheKeyFor(text, providerKey)}`);
    const usageRefFor = (key) => db.doc(`translationUsage/${key}`);

    const successText = 'Quota success fixture';
    quotaCacheRefs.push(cacheRefFor(successText));
    const successUsage = usageRefFor('emulator-success');
    quotaUsageRefs.push(successUsage);
    const successResult = await translateWithQuota(db, [successText], makeProvider(async ([text]) => [`EN ${text}`]), providerKey, {
        dateKey: 'emulator-success', attemptId: 'quota-success-1',
    });
    assert.deepEqual(successResult, [`EN ${successText}`]);
    assert.equal((await successUsage.get()).get('charactersReserved'), 0);
    assert.equal((await successUsage.get()).get('charactersConsumed'), successText.length);
    const cachedSuccess = await translateWithQuota(db, [successText], makeProvider(async () => { throw new Error('cache should avoid provider'); }), providerKey, {
        dateKey: 'emulator-success', attemptId: 'quota-success-2',
    });
    assert.deepEqual(cachedSuccess, successResult);
    assert.equal((await successUsage.get()).get('charactersConsumed'), successText.length, 'cached retries do not reserve or consume quota again');

    const definiteText = 'Quota definitive fixture';
    quotaCacheRefs.push(cacheRefFor(definiteText));
    const definiteUsage = usageRefFor('emulator-definitive');
    quotaUsageRefs.push(definiteUsage);
    await assert.rejects(translateWithQuota(db, [definiteText], makeProvider(async () => {
        throw new TranslationProviderFailure('Provider rejected request', 'definitive');
    }), providerKey, { dateKey: 'emulator-definitive', attemptId: 'quota-definitive-1' }), /Provider rejected request/);
    assert.equal((await definiteUsage.get()).get('charactersReserved'), 0);
    assert.equal((await definiteUsage.get()).get('charactersConsumed'), 0);
    assert.equal((await definiteUsage.get()).get('charactersReleased'), definiteText.length);
    await translateWithQuota(db, [definiteText], makeProvider(async ([text]) => [`EN ${text}`]), providerKey, {
        dateKey: 'emulator-definitive', attemptId: 'quota-definitive-2',
    });
    assert.equal((await definiteUsage.get()).get('charactersConsumed'), definiteText.length, 'a definitive rejection can be safely retried once');

    const ambiguousText = 'Quota ambiguous fixture';
    quotaCacheRefs.push(cacheRefFor(ambiguousText));
    const ambiguousUsage = usageRefFor('emulator-ambiguous');
    quotaUsageRefs.push(ambiguousUsage);
    let ambiguousProviderCalls = 0;
    await assert.rejects(translateWithQuota(db, [ambiguousText], makeProvider(async () => {
        ambiguousProviderCalls += 1;
        throw new Error('simulated network timeout after request');
    }), providerKey, { dateKey: 'emulator-ambiguous', attemptId: 'quota-ambiguous-1' }), /simulated network timeout/);
    assert.equal((await ambiguousUsage.get()).get('charactersReserved'), 0);
    assert.equal((await ambiguousUsage.get()).get('charactersConsumed'), 0);
    assert.equal((await ambiguousUsage.get()).get('charactersAmbiguous'), ambiguousText.length);
    await assert.rejects(translateWithQuota(db, [ambiguousText], makeProvider(async () => {
        ambiguousProviderCalls += 1;
        return ['must not be requested twice'];
    }), providerKey, { dateKey: 'emulator-ambiguous', attemptId: 'quota-ambiguous-2' }), /TranslationResultAmbiguousNeedsReview/);
    assert.equal(ambiguousProviderCalls, 1, 'ambiguous results require review and cannot trigger duplicate billable calls');

    const raceUsage = usageRefFor('emulator-concurrent-limit');
    quotaUsageRefs.push(raceUsage);
    const raceTexts = ['123456', 'abcdef'];
    quotaCacheRefs.push(...raceTexts.map(cacheRefFor));
    let raceProviderCalls = 0;
    const raceResults = await Promise.allSettled(raceTexts.map((text, index) => translateWithQuota(
        db, [text], makeProvider(async ([value]) => {
            raceProviderCalls += 1;
            await delay(150);
            return [`EN ${value}`];
        }), providerKey, { dateKey: 'emulator-concurrent-limit', attemptId: `quota-race-${index}`, dailyLimit: 10 },
    )));
    assert.equal(raceResults.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(raceResults.filter(result => result.status === 'rejected').length, 1);
    assert.equal(raceProviderCalls, 1, 'concurrent reservations cannot exceed the daily character cap');
    assert.equal((await raceUsage.get()).get('charactersConsumed'), 6);
    assert.equal((await raceUsage.get()).get('charactersReserved'), 0);

    const identicalText = 'same concurrent cache key';
    quotaCacheRefs.push(cacheRefFor(identicalText));
    const identicalUsage = usageRefFor('emulator-identical-concurrent');
    quotaUsageRefs.push(identicalUsage);
    let identicalCalls = 0;
    const identicalResults = await Promise.all([0, 1].map(index => translateWithQuota(
        db, [identicalText], makeProvider(async ([text]) => {
            identicalCalls += 1;
            await delay(500);
            return [`EN ${text}`];
        }), providerKey, { dateKey: 'emulator-identical-concurrent', attemptId: `quota-identical-${index}` },
    )));
    assert.deepEqual(identicalResults[0], identicalResults[1]);
    assert.equal(identicalCalls, 1, 'simultaneous retries share the leased cache result');
    assert.equal((await identicalUsage.get()).get('charactersConsumed'), identicalText.length);

    for (const ref of quotaCacheRefs) await ref.delete();
    for (const usageRef of quotaUsageRefs) {
        const reservations = await usageRef.collection('reservations').get();
        for (const reservation of reservations.docs) await reservation.ref.delete();
        await usageRef.delete();
    }
    console.log('PASS quota Emulator: consumed/released/ambiguous accounting, idempotent cache, safe retries, and concurrent limits');

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

    const comboRef = db.doc('combos/emulator-translation-combo');
    await comboRef.set({
        name: 'Combinado ficticio',
        description: 'Descripción ficticia del combinado',
        details: 'Aro 26, modelo COMBO-42, Bs 950',
        stock: 2,
        price: 950,
        imageUrl: 'fixture://combo',
        additionalImageUrls: ['fixture://combo-side'],
        components: [{ productId: 'emulator-component', quantity: 1 }],
    });
    const combo = await waitFor(async () => (await comboRef.get()).data(), value => value?.nameEn === 'Mock EN: Combinado ficticio', 'combo translation');
    assert.equal(combo?.descriptionEn, 'Mock EN: Descripción ficticia del combinado');
    assert.equal(combo?.detailsEn, 'Mock EN: Aro 26, modelo COMBO-42, Bs 950');
    assert.equal(combo?.stock, 2);
    assert.equal(combo?.price, 950);
    assert.equal(combo?.imageUrl, 'fixture://combo');
    assert.deepEqual(combo?.additionalImageUrls, ['fixture://combo-side']);
    assert.deepEqual(combo?.components, [{ productId: 'emulator-component', quantity: 1 }]);

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
    await comboRef.delete();
    await categoryRef.delete();
    await routeRef.delete();
    await eventRef.delete();
    console.log('PASS Functions + Firestore Emulator: product/combo translations, persistent cache, manual copy protection, field preservation, routes/events, and categories');
} finally {
    await app.delete();
}
