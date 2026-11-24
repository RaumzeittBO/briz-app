const { spawnSync } = require('node:child_process');

const result = spawnSync(
    'firebase emulators:exec --project demo-briz-i18n --only "auth,firestore,storage" "node scripts/public-bilingual-smoke.mjs"',
    [],
    {
        env: { ...process.env, FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT || '30000' },
        stdio: 'inherit',
        shell: true,
    },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
