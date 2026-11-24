const { spawnSync } = require('node:child_process');

const result = spawnSync(
    'npm run build && firebase emulators:exec --config firebase.i18n-emulator.json --project demo-briz-i18n --only "auth,firestore,storage" "node scripts/public-bilingual-smoke.mjs"',
    [],
    {
        env: { ...process.env, VITE_USE_FIREBASE_EMULATOR: 'true', VITE_FIREBASE_EMULATOR_AUTH_PORT: '19099', VITE_FIREBASE_EMULATOR_FIRESTORE_PORT: '18080', VITE_FIREBASE_EMULATOR_STORAGE_PORT: '19199', FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT || '30000' },
        stdio: 'inherit',
        shell: true,
    },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
