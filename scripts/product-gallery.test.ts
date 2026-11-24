import assert from 'node:assert/strict';
import { getLocalizedCategory } from '../src/lib/translations';
import { getValidProductImages } from '../src/lib/productGallery';

const images = getValidProductImages(
  'https://firebasestorage.googleapis.com/v0/b/example/o/main.jpg?alt=media',
  [
    'https://firebasestorage.googleapis.com/v0/b/example/o/side.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/example/o/main.jpg?alt=media',
    'javascript:alert(1)',
    '//untrusted.example/image.jpg',
    'not a url %',
  ],
);
assert.equal(images.length, 2, 'gallery contains unique HTTPS image references only');
assert.deepEqual(getValidProductImages('', []), [], 'empty gallery remains empty');
assert.equal(getLocalizedCategory('Urbanas', {}, 'en'), 'Urban', 'known categories keep dictionary translations');
assert.equal(getLocalizedCategory('Mecanica nueva', {}, 'en'), 'Mecanica nueva', 'unknown category names remain untouched without translation');
assert.equal(getLocalizedCategory('Mecanica nueva', { 'Mecanica nueva': 'New Mechanics' }, 'en'), 'New Mechanics', 'dynamic categories use their saved explicit translation');
assert.equal(getLocalizedCategory('Mecanica nueva', { 'Mecanica nueva': 'New Mechanics' }, 'es'), 'Mecanica nueva', 'Spanish category remains the stored source text');

console.log('PASS product image filtering and bilingual dynamic categories');
