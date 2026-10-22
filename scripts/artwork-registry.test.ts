import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARTWORK_REGISTRY, resolveArtwork, type ArtworkOverrides } from '../src/lib/artworkRegistry';
import { ALLOWED_ARTWORK_TYPES, MAX_ARTWORK_BYTES, validateArtworkFile, validateArtworkFileContent } from '../src/lib/artworkFileValidation';

for (const item of Object.values(ARTWORK_REGISTRY)) {
    for (const source of [item.defaults.esDesktop.src, item.defaults.esMobile.src]) {
        const exists = existsSync(resolve('public', source.split('?')[0].replace(/^\//, '')));
        if (item.originalAvailable === false) assert.equal(exists, false, `${item.id} missing source should remain explicitly documented`);
        else assert.equal(exists, true, `${item.id} Spanish fallback must exist: ${source}`);
    }
    for (const [variant, asset] of Object.entries(item.defaults)) {
        if (asset.translated) assert.equal(existsSync(resolve('public', asset.src.split('?')[0].replace(/^\//, ''))), true, `${item.id} ${variant} English artwork must exist`);
    }
}

assert.equal(ARTWORK_REGISTRY.home_bento_1_rentals.defaults.enDesktop.translated, false);
assert.equal(resolveArtwork('home_bento_1_rentals', 'en', 'desktop').status, 'spanish-fallback');
assert.equal(resolveArtwork('home_bento_3_shop', 'en', 'desktop').src, '/menu-principal-web/Ingles/3.png');
assert.equal(resolveArtwork('home_bento_3_shop', 'en', 'mobile').src, '/menu-principal-celular/3.webp');

const overrides: ArtworkOverrides = {
    home_hero_vive: {
        enDesktop: { url: 'https://storage.example/vive-english.webp' },
        enMobile: { sourceVariant: 'enDesktop' },
    },
};
assert.deepEqual(resolveArtwork('home_hero_vive', 'en', 'desktop', overrides), {
    src: 'https://storage.example/vive-english.webp', status: 'own', translated: true, sourceVariant: 'enDesktop', sourceAvailable: true, fallbackSrc: '/vive.webp', fallbackAvailable: true,
});
assert.deepEqual(resolveArtwork('home_hero_vive', 'en', 'mobile', overrides), {
    src: 'https://storage.example/vive-english.webp', status: 'shared', translated: true, sourceVariant: 'enDesktop', sourceAvailable: true, fallbackSrc: '/vive.webp', fallbackAvailable: true,
});
const cyclic: ArtworkOverrides = { home_hero_vive: { enDesktop: { sourceVariant: 'enMobile' }, enMobile: { sourceVariant: 'enDesktop' } } };
assert.equal(resolveArtwork('home_hero_vive', 'en', 'desktop', cyclic).status, 'spanish-fallback');
assert.equal(resolveArtwork('home_texture', 'es', 'desktop').sourceAvailable, false);
assert.equal(resolveArtwork('home_texture', 'es', 'desktop', { home_texture: { esDesktop: { url: 'https://storage.example/paper.webp' } } }).sourceAvailable, true);
assert.equal(resolveArtwork('home_texture', 'en', 'mobile').status, 'shared');
assert.equal(resolveArtwork('home_texture', 'en', 'mobile').translated, true);
const sharedSpanish = resolveArtwork('home_hero_vive', 'en', 'mobile', {
    home_hero_vive: { enMobile: { sourceVariant: 'esDesktop' } },
});
assert.equal(sharedSpanish.status, 'spanish-fallback');
assert.equal(sharedSpanish.translated, false);

assert.deepEqual([...ALLOWED_ARTWORK_TYPES], ['image/png', 'image/jpeg', 'image/webp']);
assert.equal(MAX_ARTWORK_BYTES, 8 * 1024 * 1024);
assert.throws(() => validateArtworkFile(new File(['fake'], 'bad.gif', { type: 'image/gif' })), /PNG, JPG o WebP/);
assert.throws(() => validateArtworkFile(new File([new Uint8Array(MAX_ARTWORK_BYTES + 1)], 'large.webp', { type: 'image/webp' })), /8 MB/);
validateArtworkFile(new File(['test'], 'ok.webp', { type: 'image/webp' }));
await validateArtworkFileContent(new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'actual.png', { type: 'image/png' }));
await assert.rejects(() => validateArtworkFileContent(new File(['not-an-image'], 'spoofed.webp', { type: 'image/webp' })), /contenido no coincide/);

const missingOriginals = Object.values(ARTWORK_REGISTRY).filter((item) => item.originalAvailable === false).map((item) => item.id);
const englishFallbacks = Object.values(ARTWORK_REGISTRY).filter((item) => !item.languageIndependent && (
    resolveArtwork(item.id, 'en', 'desktop').status === 'spanish-fallback'
    || resolveArtwork(item.id, 'en', 'mobile').status === 'spanish-fallback'
)).map((item) => item.id);
console.log(`PASS artwork registry (${Object.keys(ARTWORK_REGISTRY).length} slots), fallbacks, sharing, and upload preflight`);
console.log(`Missing repository originals documented: ${missingOriginals.join(', ')}`);
console.log(`Spanish fallbacks still used for English: ${englishFallbacks.join(', ')}`);
