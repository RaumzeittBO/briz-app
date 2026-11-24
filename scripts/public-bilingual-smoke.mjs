import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 5191;
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
            if ((await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(1000) })).ok) return;
        } catch { /* server is still starting */ }
        await delay(500);
    }
    throw new Error('Vite did not start within 30 seconds');
}

await waitForServer();
const browser = await chromium.launch({ headless: true });
const publicPaths = ['/about', '/rentals', '/shop', '/routes', '/service', '/community', '/contact', '/profile', '/verify-email'];

try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript(() => { if (!localStorage.getItem('briz_language')) localStorage.setItem('briz_language', 'es'); });
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        const pageErrors = [];
        page.on('pageerror', error => { pageErrors.push(error.message); console.error('browser error:', error.message); });

        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        await page.locator('header').first().waitFor({ state: 'visible' });
        // The development-only home layout editor overlaps the language button at 390px.
        // Remove that unrelated dev overlay; production builds do not render it.
        await page.getByRole('button', { name: 'Editar diseño' }).evaluate(element => element.remove());
        const timeOrigin = await page.evaluate(() => performance.timeOrigin);
        await page.locator('button[title="Cambiar idioma"]:visible').last().click();
        await page.getByRole('button', { name: 'English (EN)' }).click();
        assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
        assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin, 'language switch does not reload the document');

        if (viewport.width < 768) {
            await page.getByRole('button', { name: 'Open menu' }).click();
            await page.getByRole('button', { name: 'Our services' }).waitFor({ state: 'visible' });
            await page.getByRole('button', { name: 'Our services' }).click();
            await page.getByRole('link', { name: 'Bike Rentals' }).waitFor({ state: 'visible' });
            await page.getByRole('link', { name: 'Tours & Routes' }).waitFor({ state: 'visible' });
            await page.screenshot({ path: 'test-results/public-bilingual-en-390x844.png', fullPage: false });
            await page.getByRole('button', { name: 'Close menu' }).click();
        } else {
            const navigationText = await page.getByRole('navigation').innerText();
            assert.match(navigationText, /Bike Rentals/);
            assert.match(navigationText, /Tours & Routes/);
            assert.doesNotMatch(navigationText, /Alquileres|Preguntas frecuentes|Mecánica/);
            await page.screenshot({ path: 'test-results/public-bilingual-en-1440x900.png', fullPage: false });
        }

        for (const path of publicPaths) {
            console.log(`checking ${viewport.width}px ${path}`);
            const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
            assert.equal(response?.status(), 200, `${path} should serve the SPA shell`);
            if (path !== '/verify-email') await page.locator('header').first().waitFor({ state: 'visible' });
            assert.equal(await page.evaluate(() => document.documentElement.lang), 'en', `${path} retains English selection`);
            assert.ok(await page.locator('body').innerText().then(text => text.trim().length > 0), `${path} renders content`);
        }

        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Editar diseño' }).evaluate(element => element.remove());
        const englishTimeOrigin = await page.evaluate(() => performance.timeOrigin);
        await page.locator('button[title="Change language"]:visible').last().click();
        await page.getByRole('button', { name: 'Español (ES)' }).click();
        assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');
        assert.equal(await page.evaluate(() => performance.timeOrigin), englishTimeOrigin, 'return to Spanish does not reload the document');
        assert.deepEqual(pageErrors, [], `no page errors at ${viewport.width}x${viewport.height}`);
        console.log(`PASS public route shell, language switch, navigation, and ${viewport.width}x${viewport.height}`);
        await context.close();
    }
} finally {
    await browser.close();
    server.kill();
}
