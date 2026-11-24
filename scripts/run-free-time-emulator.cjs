const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync, statSync, writeFileSync, unlinkSync, chmodSync } = require('node:fs');
const path = require('node:path');

const secretFile = path.join(__dirname, '..', 'functions', '.secret.local');
const originalSecretFile = existsSync(secretFile) ? readFileSync(secretFile) : null;
const originalMode = originalSecretFile ? statSync(secretFile).mode : undefined;
const existingSecretText = originalSecretFile?.toString('utf8') || '';
const emulatorSecretText = existingSecretText.split(/\r?\n/)
    .filter((line) => !/^(RESEND_API_KEY|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=/.test(line))
    .filter(Boolean)
    .join('\n');
const emulatorSecrets = [
    'RESEND_API_KEY=re_emulator_only_not_valid',
    'TELEGRAM_BOT_TOKEN=telegram_emulator_only_not_valid',
    'TELEGRAM_CHAT_ID=0',
].join('\n');
writeFileSync(secretFile, `${emulatorSecretText ? `${emulatorSecretText}\n` : ''}${emulatorSecrets}\n`, { mode: originalMode || 0o600 });

try {
    const result = spawnSync(
        'firebase emulators:exec --config firebase.free-time-emulator.json --project demo-briz-security --only "auth,firestore,functions" "npx tsx scripts/free-time-emulator.test.ts"',
        [],
        { env: { ...process.env, BRIZ_AUTH_EMULATOR_PORT: '20099', BRIZ_FIRESTORE_EMULATOR_PORT: '20080', BRIZ_FUNCTIONS_EMULATOR_PORT: '25001', VITE_FIREBASE_EMULATOR_AUTH_PORT: '20099', VITE_FIREBASE_EMULATOR_FIRESTORE_PORT: '20080', VITE_FIREBASE_EMULATOR_FUNCTIONS_PORT: '25001', FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT || '30000' }, stdio: 'inherit', shell: true },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} finally {
    if (originalSecretFile) {
        writeFileSync(secretFile, originalSecretFile);
        if (originalMode !== undefined) chmodSync(secretFile, originalMode);
    } else if (existsSync(secretFile)) unlinkSync(secretFile);
}
