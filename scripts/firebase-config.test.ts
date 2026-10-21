import assert from 'node:assert/strict';
import { resolveFirebaseRuntimeConfig } from '../src/lib/firebaseConfig.ts';

const production = {
  VITE_USE_FIREBASE_EMULATOR: 'false',
  VITE_FIREBASE_ENVIRONMENT: 'production',
  VITE_FIREBASE_API_KEY: 'public-web-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'briz-4ef3a.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'briz-4ef3a',
  VITE_FIREBASE_STORAGE_BUCKET: 'briz-4ef3a.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '412008664703',
  VITE_FIREBASE_APP_ID: '1:412008664703:web:test',
};

const local = resolveFirebaseRuntimeConfig({ VITE_USE_FIREBASE_EMULATOR: 'true' }, 'local', 'development');
assert.equal(local.useEmulator, true);
assert.equal(local.config.projectId, 'demo-briz-security');

assert.throws(
  () => resolveFirebaseRuntimeConfig({}, 'local', 'development'),
  /VITE_USE_FIREBASE_EMULATOR=true/,
);
assert.throws(
  () => resolveFirebaseRuntimeConfig({ ...production, VITE_USE_FIREBASE_EMULATOR: 'true' }, 'production', 'production'),
  /cannot be enabled in Vercel production/i,
);
assert.throws(
  () => resolveFirebaseRuntimeConfig(production, 'preview', 'production'),
  /dedicated staging/i,
);
assert.throws(
  () => resolveFirebaseRuntimeConfig({ ...production, VITE_FIREBASE_ENVIRONMENT: 'staging' }, 'preview', 'production'),
  /forbidden outside Vercel Production/i,
);
assert.throws(
  () => resolveFirebaseRuntimeConfig({ ...production, VITE_FIREBASE_ENVIRONMENT: 'staging' }, 'development', 'production'),
  /forbidden outside Vercel Production/i,
);
assert.throws(
  () => resolveFirebaseRuntimeConfig({ ...production, VITE_FIREBASE_PROJECT_ID: 'briz-staging' }, 'production', 'production'),
  /must use Firebase project briz-4ef3a/i,
);
const productionRuntime = resolveFirebaseRuntimeConfig(production, 'production', 'production');
assert.equal(productionRuntime.useEmulator, false);
assert.equal(productionRuntime.config.projectId, 'briz-4ef3a');

const stagingRuntime = resolveFirebaseRuntimeConfig({
  ...production,
  VITE_FIREBASE_ENVIRONMENT: 'staging',
  VITE_FIREBASE_PROJECT_ID: 'briz-staging',
}, 'preview', 'production');
assert.equal(stagingRuntime.config.projectId, 'briz-staging');

console.log('Firebase runtime configuration: 9 checks passed.');
