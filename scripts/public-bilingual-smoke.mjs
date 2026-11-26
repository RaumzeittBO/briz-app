import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 5191;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
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
mkdirSync('test-results', { recursive: true });
const publicPaths = ['/', '/about', '/rentals', '/shop', '/routes', '/service', '/community', '/contact', '/profile', '/verify-email'];
const spanishTokens = [
    'acerca', 'nosotros', 'alquila', 'alquiler', 'alquileres', 'bicicleta', 'bicicletas', 'bicis', 'tienda', 'servicio', 'rutas', 'paseo', 'paseos', 'comunidad', 'eventos', 'contacto', 'perfil', 'reservar', 'agregar', 'añadir', 'carrito', 'guardar', 'cancelar', 'nombre', 'teléfono', 'correo', 'contraseña', 'mensaje', 'gracias', 'bienvenido', 'bienvenida', 'elegir', 'disponible', 'disponibles', 'precios', 'envío', 'devolución', 'horario', 'garantía', 'depósito', 'descripción', 'consulta', 'envía', 'confirmar', 'restablecer', 'olvidé', 'diagnóstico', 'ajuste', 'ejes', 'frenos', 'sillín', 'repuestos', 'mantenimiento', 'revisión', 'componentes', 'limpieza', 'engrase', 'delantero', 'trasero', 'horquilla', 'llantas', 'pinchazos', 'recorridos', 'taller', 'solicita', 'incluye', 'cotización', 'mecánica', 'mecánico', 'turno', 'agenda', 'completa', 'reparadas', 'entrega', 'rápida', 'regulado', 'sustitución', 'desmontaje', 'tornillería', 'ruedas', 'cables', 'fundas', 'cambio', 'desviador', 'transmisión', 'cadena', 'piñón', 'platos', 'bielas', 'radios', 'añadido', 'solicitados', 'separado', 'elijas', 'elige', 'también', 'nuestro', 'nuestros', 'técnicos', 'trabajan', 'presupuesto', 'honesto', 'inspección', 'herramientas', 'necesarios', 'reparación', 'impecable', 'lista', 'solicitud', 'enviada', 'contactaremos', 'nuevamente', 'selecciona', 'brevemente', 'opinión', 'anterior', 'siguiente', 'pedalea', 'conecta', 'propósito', 'marca', 'atención', 'rodada', 'semana', 'ciudad', 'experiencia', 'fácil', 'seguro', 'divertido', 'increíble', 'movimiento', 'cuidado'
];
const spanishResiduals = new RegExp(`\\b(?:${spanishTokens.join('|')})\\b`, 'giu');

function getSpanishResiduals(text) {
    return [...new Set([...text.matchAll(spanishResiduals)].map(match => {
        const start = Math.max(0, (match.index || 0) - 55);
        const end = Math.min(text.length, (match.index || 0) + match[0].length + 55);
        return `${match[0]} ← …${text.slice(start, end).replace(/\s+/g, ' ')}…`;
    }))];
}

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
            const renderedText = await page.locator('body').innerText();
            assert.ok(renderedText.trim().length > 0, `${path} renders content`);
            const accessibleText = await page.locator('input, textarea, select, button[aria-label], img[alt]').evaluateAll(elements => elements.map(element => [element.getAttribute('placeholder'), element.getAttribute('aria-label'), element.getAttribute('alt'), element.getAttribute('aria-valuetext')].filter(Boolean).join(' ')).join(' '));
            // Preserve user-authored review language; this is not BRIZ interface copy to translate.
            const userGeneratedText = await page.locator('[data-user-generated-content]').allTextContents();
            const scannedText = userGeneratedText.reduce((text, review) => text.replace(review, ''), `${renderedText} ${accessibleText}`);
            const residuals = getSpanishResiduals(scannedText);
            assert.deepEqual(residuals, [], `Spanish text remains visible on ${path}: ${residuals.join(', ')}`);
            const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
            for (let y = viewport.height; y < pageHeight; y += viewport.height - 120) {
                await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
                await delay(180);
            }
            if (path === '/') {
                const loadedArtwork = await page.locator('img').evaluateAll(images => images.map(image => image.currentSrc));
                assert.ok(loadedArtwork.some(src => src.includes('/menu-principal-celular/Ingles/3.png') || src.includes('/menu-principal-web/Ingles/3.png')), 'the English “Why Choose BRIZ” artwork is loaded');
                assert.ok(loadedArtwork.some(src => src.includes('/menu-principal-celular/Ingles/4.png') || src.includes('/menu-principal-web/Ingles/4.png')), 'the English “The Brand” artwork is loaded');
            }
            await page.evaluate(() => window.scrollTo(0, 0));
            await delay(700);
            await page.screenshot({ path: `test-results/public-${path.slice(1).replaceAll('/', '-') || 'home'}-${viewport.width}x${viewport.height}.png`, fullPage: true });
        }

        await page.goto(`${baseUrl}/service`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Add to quote' }).first().click();
        await page.getByRole('heading', { name: 'Mechanical Quote' }).waitFor({ state: 'visible' });
        assert.ok(await page.locator('input[placeholder="Your name"]').count(), 'service form uses the selected language');
        assert.equal(await page.locator('form').last().evaluate(form => form.checkValidity()), false, 'service form retains required-field validation');
        const fileInput = page.locator('input[type="file"]').first();
        const invalidFileAlert = page.waitForEvent('dialog').then(async dialog => {
            const message = dialog.message();
            await dialog.accept();
            return message;
        });
        await fileInput.setInputFiles({ name: 'fake.txt', mimeType: 'text/plain', buffer: Buffer.from('fixture only') });
        assert.equal(await invalidFileAlert, 'Choose an image of the bicycle.');

        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        if (viewport.width < 768) await page.getByRole('button', { name: 'Open menu' }).click();
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        const authDialog = page.getByRole('dialog').last();
        await authDialog.getByRole('heading', { name: 'SIGN IN' }).waitFor({ state: 'visible' });
        const authCopy = await authDialog.innerText();
        const authFields = await authDialog.locator('input, textarea, button[aria-label], img[alt]').evaluateAll(elements => elements.map(element => [element.getAttribute('placeholder'), element.getAttribute('aria-label'), element.getAttribute('alt')].filter(Boolean).join(' ')).join(' '));
        assert.deepEqual(getSpanishResiduals(`${authCopy} ${authFields}`), [], 'sign-in modal copy and controls are localized');
        await authDialog.getByRole('button', { name: 'Forgot your password?' }).click();
        await authDialog.getByRole('heading', { name: 'RECOVER PASSWORD' }).waitFor({ state: 'visible' });
        const recoveryCopy = await authDialog.innerText();
        const recoveryFields = await authDialog.locator('input, textarea, button[aria-label], img[alt]').evaluateAll(elements => elements.map(element => [element.getAttribute('placeholder'), element.getAttribute('aria-label'), element.getAttribute('alt')].filter(Boolean).join(' ')).join(' '));
        assert.deepEqual(getSpanishResiduals(`${recoveryCopy} ${recoveryFields}`), [], 'password-recovery modal copy and controls are localized');
        await page.keyboard.press('Escape');
        await authDialog.waitFor({ state: 'hidden' });

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
