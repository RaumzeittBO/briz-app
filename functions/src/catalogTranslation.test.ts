import assert from 'node:assert/strict';
import { buildCategoryTranslationPatch, buildTranslationPatch, cacheKeyFor, createGoogleTranslationProvider, planCategoryTranslations, planCatalogTranslations, protectCommercialTokens, sourceTextHash } from './catalogTranslation';

const product = {
    name: 'Bicicleta ficticia de prueba',
    description: 'Descripción ficticia para pruebas',
    details: 'Aro 26, acero, modelo ABC-123, Bs 850',
    stock: 7,
    salePrice: 850,
    imageUrl: 'https://example.test/bike.jpg',
    additionalImageUrls: ['https://example.test/side.jpg'],
};
const plan = planCatalogTranslations('inventory', product);
assert.deepEqual(plan.map(item => item.target), ['nameEn', 'descriptionEn', 'detailsEn']);
assert.equal(new Set(plan.map(item => cacheKeyFor(item.text))).size, plan.length);
assert.equal(cacheKeyFor(plan[0].text), cacheKeyFor(` ${plan[0].text} `), 'normalized content hits the same cache key');

const patch = buildTranslationPatch(plan, ['Fictional test bicycle', 'Fictional test description', '26-inch wheel, steel, model ABC-123, Bs 850'], product, '2026-11-24T12:00:00.000Z');
assert.equal(patch.nameEn, 'Fictional test bicycle');
assert.equal(patch.descriptionEn, 'Fictional test description');
assert.equal(patch.stock, undefined);
assert.equal(patch.salePrice, undefined);
assert.equal(patch.imageUrl, undefined);
assert.deepEqual(patch.additionalImageUrls, undefined);
assert.equal((patch.translationMeta as Record<string, Record<string, unknown>>).detailsEn.sourceHash, sourceTextHash(product.details));

assert.equal(planCatalogTranslations('inventory', { ...product, nameEn: 'Manual bicycle title' }).some(entry => entry.target === 'nameEn'), false, 'untracked existing English copy is treated as manual');
const generated = { ...product, nameEn: 'Fictional test bicycle', translationMeta: { nameEn: { origin: 'automatic', sourceHash: sourceTextHash(product.name), outputHash: sourceTextHash('Fictional test bicycle') } } };
assert.equal(planCatalogTranslations('inventory', generated).some(entry => entry.target === 'nameEn'), false, 'current generated translation is not repeated');
assert.equal(planCatalogTranslations('inventory', { ...generated, name: 'Nuevo nombre de bicicleta' }).some(entry => entry.target === 'nameEn'), true, 'source edit regenerates only verified automatic copy');
assert.equal(planCatalogTranslations('inventory', { ...generated, nameEn: 'Manual corrected title' }).some(entry => entry.target === 'nameEn'), false, 'manual correction to an automatic value is protected');

const settings = { categories: ['Categoría ficticia de alquiler'], translations: { Existing: 'Manual category' } };
const categoryPlan = planCategoryTranslations(settings);
const categoryPatch = buildCategoryTranslationPatch(categoryPlan, ['Fictional rental category'], settings, '2026-11-24T12:00:00.000Z');
assert.deepEqual(categoryPatch.translations, { Existing: 'Manual category', 'Categoría ficticia de alquiler': 'Fictional rental category' });
assert.deepEqual(planCategoryTranslations({ categories: ['Existing'], translations: { Existing: 'Manual category' } }), [], 'manual category copy is never overwritten');
const route = { name: 'Ruta ficticia', description: 'Descripción de ruta ficticia', highlights: ['Plaza de prueba', 'Cerro de prueba'] };
const routePlan = planCatalogTranslations('routes', route);
const routeArrayPlan = routePlan.find(entry => entry.target === 'highlightsEn');
assert.deepEqual(routeArrayPlan?.parts, route.highlights);
const routePatch = buildTranslationPatch(routePlan, [
    'Fictional route',
    'Fictional route description',
    ['Test plaza', 'Test hill'],
], route, '2026-11-24T12:00:00.000Z');
assert.deepEqual(routePatch.highlightsEn, ['Test plaza', 'Test hill']);
const event = { name: 'Evento ficticio', description: 'Descripción de evento ficticia', subcategories: [{ name: 'Sesión de prueba', images: ['fixture://event'] }] };
const eventPlan = planCatalogTranslations('events', event);
const eventPatch = buildTranslationPatch(eventPlan, ['Fictional event', 'Fictional event description', ['Test session']], event, '2026-11-24T12:00:00.000Z');
assert.deepEqual(eventPatch.subcategoryNamesEn, ['Test session']);
assert.equal(eventPatch.subcategories, undefined, 'automatic translation does not rewrite event photos/subcategory records');
assert.throws(() => buildTranslationPatch(plan, ['short'], product, '2026-11-24T12:00:00.000Z'), /unexpected number/);
const protectedCopy = protectCommercialTokens('BRIZ Mamachari 26" modelo ABC-123, Bs 850');
assert.equal(protectedCopy.restore(protectedCopy.masked), 'BRIZ Mamachari 26" modelo ABC-123, Bs 850');
assert.throws(() => protectedCopy.restore('a translation without the protected tokens'), /protected name/);
async function testProviderAdapter() {
    let requestBody = '';
    const simulatedProvider = createGoogleTranslationProvider('never-log-this-test-key', async (_url, init) => {
        requestBody = String(init?.body || '');
        const request = JSON.parse(requestBody) as { q: string[] };
        return new Response(JSON.stringify({ data: { translations: request.q.map(text => ({ translatedText: text })) } }), { status: 200 });
    });
    assert.deepEqual(await simulatedProvider.translateMany(['BRIZ Mamachari 26" model ABC-123, Bs 850']), ['BRIZ Mamachari 26" model ABC-123, Bs 850']);
    assert.ok(!requestBody.includes('Bs 850'), 'amount is masked in the provider request');
    const failingProvider = createGoogleTranslationProvider('never-log-this-test-key', async () => new Response('provider body contains secret', { status: 503 }));
    await assert.rejects(() => failingProvider.translateMany(['texto ficticio']), /HTTP 503/);
}

void testProviderAdapter().then(() => {
    console.log('PASS translation planning, cache keys, automatic refresh, manual preservation, and allowlisted write patches');
}).catch(error => {
    console.error(error);
    process.exitCode = 1;
});
