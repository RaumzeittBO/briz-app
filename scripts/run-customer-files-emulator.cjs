const { spawnSync } = require('node:child_process');

const result = spawnSync(
    'firebase emulators:exec --project demo-briz-security --only "auth,firestore,functions,storage" "npx tsx scripts/customer-files-emulator.test.ts"',
    [],
    {
    env: { ...process.env, FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT || '30000' },
    stdio: 'inherit',
    shell: true,
    },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
