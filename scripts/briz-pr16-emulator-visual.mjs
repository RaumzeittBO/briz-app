import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.resolve(root, process.env.BRIZ_VISUAL_OUTPUT || 'test-results/pr16-visual');
const baseUrl = process.env.BRIZ_VISUAL_BASE_URL || 'http://127.0.0.1:5173';
const email = process.env.BRIZ_EMULATOR_ADMIN_EMAIL || 'admin-visual@example.test';
const password = process.env.BRIZ_EMULATOR_ADMIN_PASSWORD || 'BrizEmulator#123';

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(60_000);

try {
    await page.goto(`${baseUrl}/admin/customers`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const loginButton = page.getByRole('button', { name: 'Entrar al Sistema' });
    await Promise.any([
        loginButton.waitFor({ state: 'visible', timeout: 60_000 }),
        page.getByRole('button', { name: 'Nuevo Cliente' }).waitFor({ state: 'visible', timeout: 60_000 }),
    ]);
    if (await loginButton.isVisible().catch(() => false)) {
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await loginButton.click();
    }
    await page.getByRole('button', { name: 'Nuevo Cliente' }).waitFor({ state: 'visible', timeout: 60_000 });

    await page.locator('input[placeholder="Busca por nombre, CI o teléfono..."]').fill('Cliente Ficticio de Prueba');
    await page.getByText('Cliente Ficticio de Prueba', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Ver detalles' }).click();
    await page.getByRole('button', { name: 'Ver anverso' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'Ver anverso' }).click();
    await page.getByRole('button', { name: 'Descargar archivo privado' }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-slot="dialog-content"]').count(), 2, 'The document viewer is layered above the customer details dialog.');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar archivo privado' }).click();
    const download = await downloadPromise;
    const downloadedDocument = path.join(outputDir, download.suggestedFilename());
    await download.saveAs(downloadedDocument);
    const pdfBytes = await readFile(downloadedDocument);
    assert.equal(pdfBytes.subarray(0, 5).toString('ascii'), '%PDF-', 'The private document download must contain the fictional PDF bytes.');
    console.log('PASS private fictional PDF download saved and signature checked');

    await page.getByRole('button', { name: 'Cerrar documento' }).click();
    await page.getByRole('button', { name: 'Ver anverso' }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-slot="dialog-content"]').count(), 1, 'One click closes only the top document viewer.');
    await page.getByRole('button', { name: 'Ver anverso' }).click();
    await page.getByRole('button', { name: 'Cerrar documento' }).waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Ver anverso' }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-slot="dialog-content"]').count(), 1, 'Escape closes only the top document viewer and leaves customer details open.');
    await page.screenshot({ path: path.join(outputDir, 'private-document-details-390x844.png') });
    console.log('PASS private document closes by one click and Escape without a ghost overlay');

    const expectedCategoryCards = Array.from({ length: 8 }, (_, index) => `rental-catalog-card-visual-grid-bike-${index + 1}`);
    for (const viewport of [
        { width: 390, height: 844, name: '390x844' },
        { width: 1280, height: 900, name: '1280x900' },
        { width: 1440, height: 900, name: '1440x900' },
    ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${baseUrl}/admin/rentals`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.getByRole('button', { name: 'Nuevo Alquiler' }).click();
        const rentalDialog = page.getByRole('dialog').filter({ hasText: 'Nuevo Alquiler Directo' });
        await rentalDialog.waitFor({ state: 'visible' });
        assert.equal(await rentalDialog.getByText('1. Productos y datos', { exact: true }).count(), 1);
        assert.equal(await rentalDialog.getByText('2. Confirmación y entrega', { exact: true }).count(), 1);

        const bounds = await rentalDialog.boundingBox();
        assert.ok(bounds, `Rental modal should be measurable at ${viewport.name}.`);
        assert.ok(bounds.width <= viewport.width && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1, `Modal width must fit ${viewport.name}.`);
        assert.ok(bounds.height <= viewport.height && bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1, `Modal height must fit ${viewport.name}.`);

        if (viewport.width === 1280) {
            const catalogOrder = await page.locator('[data-testid^="rental-catalog-card-visual-grid-bike-"]').evaluateAll(cards => cards.map(card => card.getAttribute('data-testid')));
            assert.deepEqual(catalogOrder, expectedCategoryCards, 'The catalog preserves the configured bike-category order.');
        }

        for (const itemId of ['visual-bike-26', 'visual-mamachari', 'visual-combo']) {
            const card = page.getByTestId(`rental-catalog-card-${itemId}`);
            await card.waitFor({ state: 'visible' });
            await card.getByRole('button', { name: 'Agregar' }).click();
        }
        assert.equal(await page.getByTestId('rental-cart-item').count(), 3, `Three fictional products must be in the cart at ${viewport.name}.`);

        if (viewport.width === 390) {
            await page.getByRole('button', { name: /Resumen · 3 producto/ }).click();
        }
        await page.getByLabel('Hora de retiro').fill('09:00');
        assert.equal(await page.getByTestId('rental-cart-item').first().isVisible(), true, `The multi-item cart should be visible at ${viewport.name}.`);
        if (viewport.width >= 1280) {
            const visibleCartRows = await page.getByTestId('rental-cart-item').evaluateAll(items => items.filter(item => {
                const rect = item.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
            }).length);
            assert.ok(visibleCartRows >= 2, `At least two cart products should be simultaneously visible at ${viewport.name}.`);
        }
        await page.screenshot({ path: path.join(outputDir, `rental-modal-${viewport.name}.png`) });
        console.log(`PASS rental modal fits ${viewport.name}; two-step immediate flow; three-item cart; catalog category order checked`);
        await rentalDialog.getByRole('button', { name: 'Cerrar' }).click();
        await rentalDialog.waitFor({ state: 'hidden' });
    }

    for (const viewport of [
        { width: 390, height: 844, name: '390x844' },
        { width: 1280, height: 900, name: '1280x900' },
        { width: 1440, height: 900, name: '1440x900' },
    ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${baseUrl}/admin/inventory`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.getByRole('tab', { name: 'Combinados' }).click();
        const missingComboRow = page.getByTestId('combo-row-visual-missing-combo');
        await missingComboRow.waitFor({ state: 'visible' });
        assert.match(await missingComboRow.innerText(), /Falta vincular bicicleta/i);
        const mamachariRow = page.getByTestId('combo-row-visual-legacy-combo');
        await mamachariRow.waitFor({ state: 'visible' });
        assert.match(await mamachariRow.innerText(), /disponible/i);
        assert.doesNotMatch(await mamachariRow.innerText(), /Falta vincular|sin stock|Otra sucursal|En taller/i);
        await mamachariRow.getByRole('button', { name: 'Editar componentes de Combo legacy · Mamachari' }).click();
        await page.getByRole('heading', { name: 'Componentes' }).waitFor({ state: 'visible' });
        const componentSelect = page.getByLabel('Producto existente para componente 1');
        assert.ok((await componentSelect.locator('option').allTextContents()).some(option => /Mamachari visual/.test(option)));
        const componentRow = page.getByTestId('combo-component-row-1');
        const quantity = page.getByLabel('Cantidad componente 1');
        await quantity.scrollIntoViewIfNeeded();
        const rowBounds = await componentRow.boundingBox();
        const quantityBounds = await quantity.boundingBox();
        assert.ok(rowBounds && quantityBounds, `Component quantity must be measurable at ${viewport.name}.`);
        assert.ok(quantityBounds.x >= rowBounds.x && quantityBounds.x + quantityBounds.width <= rowBounds.x + rowBounds.width + 1, `Quantity stays inside the component row at ${viewport.name}.`);
        assert.ok(quantityBounds.x >= 0 && quantityBounds.x + quantityBounds.width <= viewport.width + 1, `Quantity stays inside the viewport at ${viewport.name}.`);
        await page.screenshot({ path: path.join(outputDir, `mamachari-components-edit-${viewport.name}.png`) });
        console.log(`PASS combo diagnostics and Mamachari component editor remain usable at ${viewport.name}; quantity control stays within its row`);
        await page.getByRole('button', { name: 'Cancelar' }).last().click();
    }

    console.log(`SCREENSHOTS ${outputDir}`);
} finally {
    await browser.close();
}
