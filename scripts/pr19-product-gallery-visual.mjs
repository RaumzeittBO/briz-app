import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 5189;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_USE_FIREBASE_EMULATOR: 'true' },
  stdio: 'ignore',
  windowsHide: true,
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/shop`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(500);
  }
  throw new Error('Vite did not become ready within 30 seconds');
}

await waitForServer();
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [
    { width: 390, height: 844, name: '390x844' },
    { width: 1440, height: 900, name: '1440x900' },
  ]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => localStorage.setItem('briz_language', 'es'));
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.route('**/test-fixtures/gallery-*.svg', route => {
      const fill = route.request().url().includes('side') ? '#d8a900' : route.request().url().includes('third') ? '#3874a8' : '#303030';
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" fill="${fill}"/><circle cx="120" cy="90" r="48" fill="#fff"/></svg>` });
    });

    await page.goto(`${baseUrl}/shop`, { waitUntil: 'domcontentloaded' });
    await page.getByText('Bicicleta demo para tienda', { exact: true }).waitFor({ state: 'visible' });
    const card = page.getByRole('button', { name: 'Ver detalles', exact: true }).first();
    await card.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('heading', { name: 'Bicicleta demo para tienda' }).waitFor({ state: 'visible' });
    assert.equal(await dialog.getByRole('button', { name: 'Mostrar imagen 2' }).count(), 2, 'both gallery pagination and thumbnails expose image 2');
    assert.equal(await dialog.getByText('Detalles ficticios para pruebas.', { exact: true }).count(), 1);
    await dialog.getByRole('button', { name: 'Imagen siguiente' }).click();
    await dialog.locator('img[alt="Bicicleta demo para tienda 2"]').waitFor({ state: 'visible' });
    assert.ok((await dialog.locator('img[alt="Bicicleta demo para tienda 2"]').getAttribute('src'))?.includes('gallery-side.svg'));
    await page.screenshot({ path: `test-results/pr19-shop-gallery-${viewport.name}.png`, fullPage: false });

    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByText('Bicicleta demo para tienda', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Ver detalles', exact: true }).first().click();
    const reloadedDialog = page.getByRole('dialog');
    assert.equal(await reloadedDialog.getByRole('button', { name: 'Mostrar imagen 3' }).count(), 2, 'Firestore gallery references still render after a page reload');

    if (viewport.width === 390) {
      await page.keyboard.press('Escape');
      await page.locator('button[title="Cambiar idioma"]:visible').last().click();
      await page.getByRole('button', { name: 'English (EN)' }).click();
      await page.getByRole('button', { name: 'View details', exact: true }).first().click();
      const englishDialog = page.getByRole('dialog');
      await englishDialog.getByRole('heading', { name: 'Fictional Bike Gallery' }).waitFor({ state: 'visible' });
      assert.equal(await englishDialog.getByText('Fictional English description.', { exact: true }).count(), 1);
      assert.equal(await englishDialog.getByText('Fictional specifications.', { exact: true }).count(), 1);
      await page.screenshot({ path: 'test-results/pr19-shop-gallery-en-390x844.png', fullPage: false });
    }
    await context.close();
    console.log(`PASS gallery, reload-ready references, and responsive ${viewport.name}`);
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('briz_language', 'es'));
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(`${baseUrl}/admin/shop`, { waitUntil: 'domcontentloaded' });
  const login = page.getByRole('button', { name: 'Entrar al Sistema' });
  await login.waitFor({ state: 'visible' });
  await page.locator('input[type="email"]').fill('admin-visual@example.test');
  await page.locator('input[type="password"]').fill('BrizEmulator#123');
  await login.click();
  const row = page.getByRole('row').filter({ hasText: 'Bicicleta demo para tienda' });
  await row.waitFor({ state: 'visible' });
  await row.getByRole('button').first().click();
  await page.getByText('Editar Producto de Tienda', { exact: true }).waitFor({ state: 'visible' });
  await page.getByLabel('Product name (English)').fill('Emulator English bicycle');
  await page.getByLabel('Description (English)').fill('English copy from the emulator test.');
  await page.getByLabel('Additional details (English)').fill('English specifications from the emulator test.');
  await page.getByRole('button', { name: 'Guardar Producto' }).click();
  await page.getByText('Editar Producto de Tienda', { exact: true }).waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Categorías', exact: true }).click();
  await page.getByRole('button', { name: 'Edit English translation for Categoría ficticia PR19' }).click();
  await page.getByPlaceholder('English category name').fill('Fictional PR19 category');
  await page.getByRole('button', { name: 'Save EN' }).click();
  await page.getByRole('button', { name: 'Save EN' }).waitFor({ state: 'hidden' });
  await page.locator('div.fixed.inset-0').filter({ hasText: 'Administrar Categorías de Tienda' }).getByRole('button').first().click();

  const itemRow = page.getByRole('row').filter({ hasText: 'Bicicleta demo para tienda' });
  await itemRow.getByRole('button').first().click();
  let releaseUpload;
  let notifyUpload;
  const uploadReached = new Promise(resolve => { notifyUpload = resolve; });
  const uploadGate = new Promise(resolve => { releaseUpload = resolve; });
  await page.route('http://127.0.0.1:9199/**', async route => {
    if (route.request().method() === 'POST') {
      notifyUpload();
      await uploadGate;
    }
    await route.continue();
  });
  const imageFixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxioAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'fictional-upload.png', mimeType: 'image/png', buffer: imageFixture });
  await uploadReached;
  const saveWhileUploading = page.getByRole('button', { name: 'Esperando imágenes…' });
  await saveWhileUploading.waitFor({ state: 'visible' });
  assert.equal(await saveWhileUploading.isDisabled(), true, 'saving remains disabled during the upload');
  assert.equal(await page.getByRole('button', { name: 'Cancelar' }).isDisabled(), true, 'closing the editor remains disabled during the upload');
  releaseUpload();
  await page.getByRole('button', { name: 'Guardar Producto' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Guardar Producto' }).click();
  await page.getByText('Editar Producto de Tienda', { exact: true }).waitFor({ state: 'hidden' });

  await page.getByRole('row').filter({ hasText: 'Bicicleta demo para tienda' }).getByRole('button').first().click();
  await page.unroute('http://127.0.0.1:9199/**');
  await page.route('http://127.0.0.1:9199/**', async route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 403, message: 'Permission denied' } }) });
    }
    return route.continue();
  });
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'fictional-failed-upload.png', mimeType: 'image/png', buffer: imageFixture });
  await page.getByText(/No tienes permisos|Permission denied/i).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByText('Editar Producto de Tienda', { exact: true }).waitFor({ state: 'hidden' });
  await context.close();
  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const { initializeApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const app = initializeApp({ projectId: 'demo-briz-security' }, 'pr19-gallery-visual-check');
  const savedProduct = (await getFirestore(app).doc('inventory/visual-shop-bike').get()).data();
  assert.equal(savedProduct?.name, 'Bicicleta demo para tienda', 'English editing must preserve the Spanish name');
  assert.equal(savedProduct?.description, 'Producto sintético para validar filtros de tienda en Emulator.', 'English editing must preserve the Spanish description');
  assert.equal(savedProduct?.details, 'Detalles ficticios para pruebas.', 'English editing must preserve Spanish details');
  assert.equal(savedProduct?.nameEn, 'Emulator English bicycle');
  assert.equal(savedProduct?.descriptionEn, 'English copy from the emulator test.');
  assert.equal(savedProduct?.detailsEn, 'English specifications from the emulator test.');
  assert.deepEqual(savedProduct?.additionalImageUrls, ['/test-fixtures/gallery-side.svg', '/test-fixtures/gallery-third.svg']);
  assert.match(savedProduct?.imageUrl || '', /fictional-upload\.png|inventory/);
  assert.equal(savedProduct?.salePrice, 1234);
  const db = getFirestore(app);
  const savedShopCategories = (await db.doc('settings/shop_categories').get()).data()?.categories;
  const savedBikeCategories = (await db.doc('settings/bike_categories').get()).data();
  assert.ok(savedShopCategories.includes('Categoría ficticia PR19'), 'existing shop categories are not replaced by defaults');
  assert.equal(savedBikeCategories?.categories?.[0], 'Urbanas', 'Spanish rental categories remain intact after saving an English category');
  assert.equal(savedBikeCategories?.translations?.['Categoría ficticia PR19'], 'Fictional PR19 category');
  console.log('PASS admin English product translations save through Emulator without replacing Spanish source fields');
  await app.delete();
} finally {
  await browser.close();
  server.kill();
}
