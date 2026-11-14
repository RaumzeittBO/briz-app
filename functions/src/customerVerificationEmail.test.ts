import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildBrizVerificationUrl,
    createVerificationEmail,
    deliverVerificationEmail,
    nextVerificationRateState,
    rollbackDefinitiveVerificationAttempt,
    type VerificationRateState,
} from './customerVerificationEmail';

const firebaseActionLink = 'https://briz-4ef3a.firebaseapp.com/__/auth/action?apiKey=public-test-key&mode=verifyEmail&oobCode=fictional_code_123';

test('rewrites only Firebase generated verification actions to the published BRIZ handler', () => {
    const link = buildBrizVerificationUrl(firebaseActionLink, 'es', 'briz-4ef3a');
    const parsed = new URL(link);
    assert.equal(parsed.origin, 'https://www.briz.com.bo');
    assert.equal(parsed.pathname, '/verify-email');
    assert.equal(parsed.searchParams.get('mode'), 'verifyEmail');
    assert.equal(parsed.searchParams.get('oobCode'), 'fictional_code_123');
    assert.equal(parsed.searchParams.get('lang'), 'es');
    assert.equal(parsed.searchParams.has('apiKey'), false);
});

test('rejects untrusted Firebase link origins, modes, paths, continuation URLs, and query parameters', () => {
    const rejected = [
        firebaseActionLink.replace('briz-4ef3a.firebaseapp.com', 'attacker.example'),
        firebaseActionLink.replace('/__/auth/action', '/other/action'),
        firebaseActionLink.replace('mode=verifyEmail', 'mode=resetPassword'),
        firebaseActionLink.replace('apiKey=public-test-key&', ''),
        `${firebaseActionLink}&lang=fr`,
        `${firebaseActionLink}&oobCode=second_code`,
        `${firebaseActionLink}&unexpected=1`,
        `${firebaseActionLink}&continueUrl=https%3A%2F%2Fevil.example%2Frentals`,
        `${firebaseActionLink}&continueUrl=${encodeURIComponent('https://www.briz.com.bo/rentals?redirect=https://evil.example')}`,
    ];
    for (const candidate of rejected) {
        assert.throws(() => buildBrizVerificationUrl(candidate, 'en', 'briz-4ef3a'));
    }
});

test('renders Spanish and English responsive brand messages with HTML and plain text', () => {
    const url = 'https://www.briz.com.bo/verify-email?mode=verifyEmail&oobCode=fictional&lang=es&x=1';
    const es = createVerificationEmail('rider@example.test', url, 'es');
    const en = createVerificationEmail('rider@example.test', url, 'en');

    assert.equal(es.from, 'BRIZ <notificaciones@briz.com.bo>');
    assert.match(es.html, /<html lang="es">/);
    assert.match(es.html, /logoamarillo\.png/);
    assert.match(es.html, /CONFIRMAR MI CORREO/);
    assert.match(es.html, /background:#f3c400/);
    assert.match(es.html, /max-width:600px/);
    assert.match(es.html, /oobCode=fictional&amp;lang=es&amp;x=1/);
    assert.match(es.text, /¡Bienvenido a BRIZ!/);
    assert.match(es.text, /Si no creaste esta cuenta, puedes ignorar este mensaje\./);
    assert.match(en.html, /<html lang="en">/);
    assert.match(en.html, /CONFIRM MY EMAIL/);
    assert.match(en.text, /Welcome to BRIZ!/);
});

test('uses provider idempotency and classifies provider failures without exposing details', async () => {
    const payload = createVerificationEmail('rider@example.test', 'https://www.briz.com.bo/verify-email?oobCode=fake', 'es');
    const attempts: Array<{ key: string; to: string }> = [];
    const transport = {
        async send(email: typeof payload, options: { idempotencyKey: string }) {
            attempts.push({ key: options.idempotencyKey, to: email.to });
            return { error: null };
        },
    };
    await deliverVerificationEmail(transport, payload, 'verification-attempt-1');
    await deliverVerificationEmail(transport, payload, 'verification-attempt-1');
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].key, attempts[1].key);
    assert.equal(attempts[0].to, 'rider@example.test');

    await assert.rejects(
        () => deliverVerificationEmail({ send: async () => ({ error: { message: 'sensitive provider detail' } }) }, payload, 'attempt-2'),
        error => error instanceof Error && error.message === 'resend-send-ambiguous' && !error.message.includes('sensitive'),
    );
    await assert.rejects(
        () => deliverVerificationEmail({ send: async () => ({ error: { statusCode: 422, message: 'sensitive provider detail' } }) }, payload, 'attempt-3'),
        error => error instanceof Error && error.message === 'resend-send-rejected' && !error.message.includes('sensitive'),
    );
    await assert.rejects(
        () => deliverVerificationEmail({ send: async () => ({ error: { statusCode: 503 } }) }, payload, 'attempt-4'),
        error => error instanceof Error && error.message === 'resend-send-ambiguous',
    );
    await assert.rejects(
        () => deliverVerificationEmail({ send: async () => { throw new Error('sensitive transport detail'); } }, payload, 'attempt-5'),
        error => error instanceof Error && error.message === 'resend-send-ambiguous' && !error.message.includes('sensitive'),
    );
});

test('applies a per-account cooldown and a five-attempt rolling daily limit', () => {
    const now = 1_800_000_000_000;
    let state = nextVerificationRateState(undefined, now);
    assert.equal(state.count, 1);
    assert.throws(() => nextVerificationRateState(state, now + 30_000), /verification-cooldown/);
    state = { ...state, deliveryState: 'sent' };
    state = nextVerificationRateState(state, now + 60_000);
    state = { ...state, deliveryState: 'sent' };
    state = nextVerificationRateState(state, now + 120_000);
    state = { ...state, deliveryState: 'sent' };
    state = nextVerificationRateState(state, now + 180_000);
    state = { ...state, deliveryState: 'sent' };
    state = nextVerificationRateState(state, now + 240_000);
    state = { ...state, deliveryState: 'sent' };
    assert.equal(state.count, 5);
    assert.throws(() => nextVerificationRateState(state, now + 300_000), /verification-daily-limit/);
    assert.equal(nextVerificationRateState(state, now + 24 * 60 * 60 * 1000).count, 1);

    const rejectedAttempt = rollbackDefinitiveVerificationAttempt(
        { windowStartedAt: now, lastAttemptAt: now, count: 1, deliveryState: 'pending' },
        0,
    );
    assert.equal(rejectedAttempt.count, 0);
    assert.equal(rejectedAttempt.lastAttemptAt, 0);
    assert.equal(nextVerificationRateState(rejectedAttempt, now + 1_000).count, 1);

    const ambiguousAttempt: VerificationRateState = {
        windowStartedAt: now,
        lastAttemptAt: now,
        count: 1,
        deliveryState: 'ambiguous',
    };
    assert.throws(() => nextVerificationRateState(ambiguousAttempt, now + 60_000), /verification-result-ambiguous/);
    assert.equal(nextVerificationRateState(ambiguousAttempt, now + 24 * 60 * 60 * 1000).count, 1);
    assert.throws(
        () => nextVerificationRateState({ ...ambiguousAttempt, deliveryState: 'pending' }, now + 60_000),
        /verification-result-ambiguous/,
    );
});
