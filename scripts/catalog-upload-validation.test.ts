import assert from 'node:assert/strict';
import { validateCatalogImage } from '../src/lib/imageUpload';

assert.equal(validateCatalogImage({ type: 'image/jpeg', size: 1024 }), null);
assert.equal(validateCatalogImage({ type: 'image/png', size: 1024 }), null);
assert.equal(validateCatalogImage({ type: 'image/webp', size: 1024 }), null);
assert.match(validateCatalogImage({ type: 'image/svg+xml', size: 1024 }) || '', /JPG, PNG o WebP/);
assert.match(validateCatalogImage({ type: 'image/jpeg', size: 21 * 1024 * 1024 }) || '', /20 MB/);
assert.match(validateCatalogImage({ type: 'image/jpeg', size: 0 }) || '', /20 MB/);

console.log('Catalog image upload validation passed (6 assertions).');
