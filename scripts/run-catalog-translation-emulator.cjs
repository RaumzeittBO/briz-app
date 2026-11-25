const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync, statSync, writeFileSync, unlinkSync, chmodSync } = require('node:fs');
const path = require('node:path');

const secretFile = path.join(__dirname, '..', 'functions', '.secret.local');
const originalSecretFile = existsSync(secretFile) ? readFileSync(secretFile) : null;
const originalMode = originalSecretFile ? statSync(secretFile).mode : undefined;
writeFileSync(secretFile, [
    'TELEGRAM_BOT_TOKEN=emulator-disabled',
    'TELEGRAM_CHAT_ID=emulator-disabled',
    'RESEND_API_KEY=re_emulator_only_not_valid',
    'GOOGLE_TRANSLATE_API_KEY=emulator-only-placeholder',
].join('\n') + '\n', { mode: originalMode || 0o600 });

try {
    const result = spawnSync(
        'firebase emulators:exec --config firebase.translation-emulator.json --project demo-briz-translations --only "firestore,functions" "node scripts/catalog-translation-emulator.test.mjs"',
        [],
        {
            env: {
                ...process.env,
                BRIZ_TRANSLATION_PROVIDER: 'mock',
                BRIZ_FIRESTORE_EMULATOR_PORT: '20080',
                BRIZ_FUNCTIONS_EMULATOR_PORT: '25002',
                FIRESTORE_EMULATOR_HOST: '127.0.0.1:20080',
                FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT || '30000',
            },
            stdio: 'inherit',
            shell: true,
        },
    );

    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} finally {
    if (originalSecretFile) {
        writeFileSync(secretFile, originalSecretFile);
        if (originalMode !== undefined) chmodSync(secretFile, originalMode);
    } else if (existsSync(secretFile)) {
        unlinkSync(secretFile);
    }
}
