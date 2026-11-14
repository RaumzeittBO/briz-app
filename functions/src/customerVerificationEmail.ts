export type EmailLanguage = 'es' | 'en';

export type VerificationEmailPayload = {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
};

const PUBLIC_ORIGIN = 'https://www.briz.com.bo';
const BRAND_LOGO_URL = `${PUBLIC_ORIGIN}/logoamarillo.png`;
const SENDER = 'BRIZ <notificaciones@briz.com.bo>';

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]!);
}

export function buildBrizVerificationUrl(
    firebaseActionLink: string,
    language: EmailLanguage,
    projectId: string,
    authEmulatorHost?: string,
): string {
    let source: URL;
    try {
        source = new URL(firebaseActionLink);
    } catch {
        throw new Error('Firebase returned an invalid action link.');
    }

    const expectedHosts = new Set([`${projectId}.firebaseapp.com`, `${projectId}.web.app`]);
    let isLocalAuthEmulator = false;
    if (authEmulatorHost) {
        try {
            const emulatorUrl = new URL(`http://${authEmulatorHost}`);
            isLocalAuthEmulator = source.origin === emulatorUrl.origin && source.pathname === '/emulator/action';
        } catch { /* Invalid emulator config never broadens the production allowlist. */ }
    }
    const officialLink = source.protocol === 'https:' && expectedHosts.has(source.hostname)
        && source.pathname === '/__/auth/action' && !source.port;
    if ((!officialLink && !isLocalAuthEmulator) || source.username || source.password) {
        throw new Error('Firebase returned an action link from an untrusted origin.');
    }

    const allowedParameters = new Set(['apiKey', 'mode', 'oobCode', 'continueUrl', 'lang']);
    for (const key of source.searchParams.keys()) {
        if (!allowedParameters.has(key) || source.searchParams.getAll(key).length !== 1) {
            throw new Error('Firebase returned unexpected action link parameters.');
        }
    }
    if (source.searchParams.get('mode') !== 'verifyEmail') {
        throw new Error('Firebase returned an unexpected action mode.');
    }
    const apiKey = source.searchParams.get('apiKey');
    if (!apiKey || apiKey.length > 256) {
        throw new Error('Firebase returned an action link without a project API key.');
    }
    const sourceLanguage = source.searchParams.get('lang');
    if (sourceLanguage && !['es', 'en'].includes(sourceLanguage.toLowerCase().split('-')[0])) {
        throw new Error('Firebase returned an unsupported action language.');
    }
    const actionCode = source.searchParams.get('oobCode');
    if (!actionCode || actionCode.length > 2048 || /\s/.test(actionCode)) {
        throw new Error('Firebase returned an invalid action code.');
    }

    const continueUrl = source.searchParams.get('continueUrl');
    if (continueUrl) {
        let parsedContinueUrl: URL;
        try {
            parsedContinueUrl = new URL(continueUrl);
        } catch {
            throw new Error('Firebase returned an invalid continuation URL.');
        }
        if (parsedContinueUrl.origin !== PUBLIC_ORIGIN || parsedContinueUrl.pathname !== '/rentals'
            || parsedContinueUrl.username || parsedContinueUrl.password || parsedContinueUrl.hash) {
            throw new Error('Firebase returned an untrusted continuation URL.');
        }
        for (const key of parsedContinueUrl.searchParams.keys()) {
            if (key !== 'lang' || parsedContinueUrl.searchParams.getAll(key).length !== 1
                || !['es', 'en'].includes((parsedContinueUrl.searchParams.get(key) || '').toLowerCase().split('-')[0])) {
                throw new Error('Firebase returned an unexpected continuation parameter.');
            }
        }
    }

    const target = new URL('/verify-email', PUBLIC_ORIGIN);
    target.searchParams.set('mode', 'verifyEmail');
    target.searchParams.set('oobCode', actionCode);
    target.searchParams.set('lang', language);
    return target.toString();
}

export function createVerificationEmail(
    to: string,
    verificationUrl: string,
    language: EmailLanguage,
): VerificationEmailPayload {
    const safeUrl = escapeHtml(verificationUrl);
    if (language === 'en') {
        return {
            from: SENDER,
            to,
            subject: 'Confirm your email and activate your BRIZ account',
            text: [
                'Welcome to BRIZ!',
                '',
                'Thanks for creating your account. You are one step away from your next adventure.',
                'Confirm your email to activate your account and start booking bicycles.',
                '',
                `CONFIRM MY EMAIL: ${verificationUrl}`,
                '',
                'If you did not create this account, you can ignore this message.',
                'The BRIZ Team',
            ].join('\n'),
            html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Welcome to BRIZ</title></head>
<body style="margin:0;padding:0;background:#fff9e8;font-family:Arial,Helvetica,sans-serif;color:#171717;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your email to activate your BRIZ account.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff9e8;"><tr><td align="center" style="padding:32px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #f0e3b7;border-radius:20px;overflow:hidden;">
<tr><td align="center" style="padding:34px 28px 12px;"><img src="${BRAND_LOGO_URL}" width="132" alt="BRIZ" style="display:block;width:132px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:18px 38px 36px;"><p style="margin:0 0 14px;font-size:27px;line-height:1.25;font-weight:700;letter-spacing:-.4px;">Welcome to BRIZ!</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3f3f3f;">Thanks for creating your account. You are one step away from your next adventure.</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#3f3f3f;">Confirm your email to activate your account and start booking bicycles.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="#f3c400" style="border-radius:12px;"><a href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 27px;border-radius:12px;background:#f3c400;color:#171717;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;letter-spacing:.35px;">CONFIRM MY EMAIL</a></td></tr></table>
<p style="margin:28px 0 8px;font-size:12px;line-height:1.6;color:#6b6b6b;">If the button does not work, copy and paste this link into your browser:</p><p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;"><a href="${safeUrl}" style="color:#5a4b00;">${safeUrl}</a></p>
<hr style="height:1px;margin:28px 0 18px;border:0;background:#eee8d6;"><p style="margin:0 0 5px;font-size:13px;line-height:1.6;color:#656565;">If you did not create this account, you can ignore this message.</p><p style="margin:0;font-size:13px;font-weight:700;color:#222;">The BRIZ Team</p></td></tr>
<tr><td align="center" style="padding:15px 24px;background:#171717;color:#e7e1ce;font-size:11px;line-height:1.5;">BRIZ · Centro de la Bicicleta</td></tr></table></td></tr></table></body></html>`,
        };
    }

    return {
        from: SENDER,
        to,
        subject: 'Confirma tu correo y activa tu cuenta BRIZ',
        text: [
            '¡Bienvenido a BRIZ!',
            '',
            'Gracias por crear tu cuenta. Estás a un paso de comenzar tu próxima aventura.',
            'Confirma tu correo electrónico para activar tu cuenta y comenzar a reservar bicicletas.',
            '',
            `CONFIRMAR MI CORREO: ${verificationUrl}`,
            '',
            'Si no creaste esta cuenta, puedes ignorar este mensaje.',
            'Equipo BRIZ',
        ].join('\n'),
        html: `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Bienvenido a BRIZ</title></head>
<body style="margin:0;padding:0;background:#fff9e8;font-family:Arial,Helvetica,sans-serif;color:#171717;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirma tu correo para activar tu cuenta BRIZ.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff9e8;"><tr><td align="center" style="padding:32px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #f0e3b7;border-radius:20px;overflow:hidden;">
<tr><td align="center" style="padding:34px 28px 12px;"><img src="${BRAND_LOGO_URL}" width="132" alt="BRIZ" style="display:block;width:132px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:18px 38px 36px;"><p style="margin:0 0 14px;font-size:27px;line-height:1.25;font-weight:700;letter-spacing:-.4px;">¡Bienvenido a BRIZ!</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3f3f3f;">Gracias por crear tu cuenta. Estás a un paso de comenzar tu próxima aventura.</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#3f3f3f;">Confirma tu correo electrónico para activar tu cuenta y comenzar a reservar bicicletas.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="#f3c400" style="border-radius:12px;"><a href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 27px;border-radius:12px;background:#f3c400;color:#171717;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;letter-spacing:.35px;">CONFIRMAR MI CORREO</a></td></tr></table>
<p style="margin:28px 0 8px;font-size:12px;line-height:1.6;color:#6b6b6b;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p><p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;"><a href="${safeUrl}" style="color:#5a4b00;">${safeUrl}</a></p>
<hr style="height:1px;margin:28px 0 18px;border:0;background:#eee8d6;"><p style="margin:0 0 5px;font-size:13px;line-height:1.6;color:#656565;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p><p style="margin:0;font-size:13px;font-weight:700;color:#222;">Equipo BRIZ</p></td></tr>
<tr><td align="center" style="padding:15px 24px;background:#171717;color:#e7e1ce;font-size:11px;line-height:1.5;">BRIZ · Centro de la Bicicleta</td></tr></table></td></tr></table></body></html>`,
    };
}

export type VerificationRateState = { windowStartedAt: number; lastAttemptAt: number; count: number };

export async function deliverVerificationEmail(
    transport: { send: (payload: VerificationEmailPayload, options: { idempotencyKey: string }) => Promise<{ error?: unknown | null }> },
    payload: VerificationEmailPayload,
    idempotencyKey: string,
): Promise<void> {
    const result = await transport.send(payload, { idempotencyKey });
    if (result.error) throw new Error('resend-send-failed');
}

export function nextVerificationRateState(
    current: VerificationRateState | undefined,
    now: number,
): VerificationRateState {
    const windowMs = 24 * 60 * 60 * 1000;
    const cooldownMs = 60 * 1000;
    const expired = !current || now - current.windowStartedAt >= windowMs;
    const state = expired ? { windowStartedAt: now, lastAttemptAt: 0, count: 0 } : current;
    if (state.lastAttemptAt && now - state.lastAttemptAt < cooldownMs) {
        throw new Error('verification-cooldown');
    }
    if (state.count >= 5) throw new Error('verification-daily-limit');
    return { ...state, lastAttemptAt: now, count: state.count + 1 };
}
