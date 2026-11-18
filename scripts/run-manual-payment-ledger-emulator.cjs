const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync, statSync, writeFileSync, unlinkSync, chmodSync } = require('node:fs');
const path = require('node:path');

const secretFile = path.join(__dirname, '..', 'functions', '.secret.local');
const originalSecretFile = existsSync(secretFile) ? readFileSync(secretFile) : null;
const originalMode = originalSecretFile ? statSync(secretFile).mode : undefined;
const existingSecretText = originalSecretFile?.toString('utf8') || '';
const emulatorSecretText = existingSecretText.split(/\r?\n/)
    .filter(line => !line.startsWith('RESEND_API_KEY='))
    .filter(Boolean)
    .join('\n');
writeFileSync(secretFile, `${emulatorSecretText ? `${emulatorSecretText}\n` : ''}RESEND_API_KEY=re_emulator_only_not_valid\n`, { mode: originalMode || 0o600 });

try {
    const result = spawnSync(
        'firebase emulators:exec --project demo-briz-manual-payments --only "auth,firestore,functions" "npx tsx scripts/manual-payment-ledger-emulator.test.ts"',
        [],
        { env: process.env, stdio: 'inherit', shell: true },
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
