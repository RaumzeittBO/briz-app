import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.resolve(root, 'test-results/payment-reports-visual');
const baseUrl = process.env.BRIZ_VISUAL_BASE_URL || 'http://127.0.0.1:5173';
const email = process.env.BRIZ_EMULATOR_ADMIN_EMAIL || 'admin-visual@example.test';
const password = process.env.BRIZ_EMULATOR_ADMIN_PASSWORD || 'BrizEmulator#123';

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(30_000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/admin/reports`, { waitUntil: 'domcontentloaded' });
  const loginButton = page.getByRole('button', { name: 'Entrar al Sistema' });
  await Promise.any([
    loginButton.waitFor({ state: 'visible' }),
    page.getByRole('heading', { name: 'Resumen general' }).waitFor({ state: 'visible' }),
  ]);
  if (await loginButton.isVisible().catch(() => false)) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await loginButton.click();
  }
  await page.getByRole('heading', { name: 'Resumen general' }).waitFor({ state: 'visible' });

  for (const viewport of [
    { width: 390, height: 844, name: '390x844' },
    { width: 1280, height: 900, name: '1280x900' },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${baseUrl}/admin/reports`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Resumen general' }).waitFor({ state: 'visible' });
    const summary = page.locator('[aria-labelledby="report-summary-title"]');
    await summary.getByText('Bs. 300.00').waitFor({ state: 'visible' });
    await assert.doesNotReject(async () => assert.match(await summary.innerText(), /Bs\. 300\.00/));
    assert.match(await summary.innerText(), /Efectivo[\s\S]*Bs\. 150\.00/i);
    assert.match(await summary.innerText(), /QR[\s\S]*Bs\. 100\.00/i);
    assert.match(await summary.innerText(), /Transferencia[\s\S]*Bs\. 50\.00/i);
    assert.match(await summary.innerText(), /Pendiente de cobro[\s\S]*Bs\. 60\.00/i);
    assert.match(await page.locator('section[aria-label="Ventas y taller"]').innerText(), /Importe registrado de servicios terminados[\s\S]*Bs\. 90\.00/);
    assert.match(await page.locator('section[aria-label="Ventas y taller"]').innerText(), /no cobro confirmado/i);
    const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    assert.ok(layout.width <= layout.viewport, `Report overview should not overflow horizontally at ${viewport.name}.`);
    await page.screenshot({ path: path.join(outputDir, `reports-${viewport.name}.png`), fullPage: true });
    console.log(`PASS report sections, method totals, pending amount and responsive layout at ${viewport.name}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/rentals`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Nuevo Alquiler' }).click();
  const rentalDialog = page.getByRole('dialog').filter({ hasText: 'Nuevo Alquiler Directo' });
  const bike = page.getByTestId('rental-catalog-card-visual-bike-26');
  await bike.getByRole('button', { name: 'Agregar' }).click();
  await rentalDialog.getByRole('button', { name: /Resumen · 1 producto/i }).click();
  await rentalDialog.getByRole('button', { name: 'Siguiente' }).click();
  const method = page.getByLabel('Método de pago del alquiler');
  const status = page.getByLabel('Estado del pago del alquiler');
  await method.selectOption('qr');
  assert.equal(await status.inputValue(), 'unpaid', 'Choosing QR alone keeps the rental pending.');
  await status.selectOption('paid');
  assert.match(await rentalDialog.innerText(), /Método de pago:[\s\S]*QR/);
  assert.match(await rentalDialog.innerText(), /Estado de pago:[\s\S]*PAGO RECIBIDO/);
  await page.screenshot({ path: path.join(outputDir, 'immediate-rental-payment-confirmation-390x844.png'), fullPage: true });
  console.log('PASS immediate payment selection remains in the confirmation screen; QR does not auto-mark as paid');
  assert.deepEqual(pageErrors, [], 'No client-side errors should occur in the report and payment confirmation flows.');
  console.log(`SCREENSHOTS ${outputDir}`);
} finally {
  await browser.close();
}
