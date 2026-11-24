import assert from 'node:assert/strict';
import { isFreeTimeEmulatorRuntime, elapsedFreeTimeMilliseconds } from '../functions/src/freeTime';
import { isFreeTimeEmulatorUiEnabled } from '../src/lib/freeTimeFeature';

assert.equal(isFreeTimeEmulatorRuntime({ FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-briz-security' }), true);
assert.equal(isFreeTimeEmulatorRuntime({ FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'briz-4ef3a' }), false);
assert.equal(isFreeTimeEmulatorRuntime({ GCLOUD_PROJECT: 'demo-briz-security' }), false);
assert.equal(isFreeTimeEmulatorUiEnabled({ development: true, emulatorEnabled: true, projectId: 'demo-briz-security', explicitFlag: 'true' }), true);
assert.equal(isFreeTimeEmulatorUiEnabled({ development: false, emulatorEnabled: true, projectId: 'demo-briz-security', explicitFlag: 'true' }), false);
assert.equal(isFreeTimeEmulatorUiEnabled({ development: true, emulatorEnabled: false, projectId: 'demo-briz-security', explicitFlag: 'true' }), false);
assert.equal(isFreeTimeEmulatorUiEnabled({ development: true, emulatorEnabled: true, projectId: 'briz-4ef3a', explicitFlag: 'true' }), false);
assert.equal(isFreeTimeEmulatorUiEnabled({ development: true, emulatorEnabled: true, projectId: 'demo-briz-security', explicitFlag: undefined }), false);
assert.equal(elapsedFreeTimeMilliseconds(1000, 1000 + 123_456), 123_456);
assert.throws(() => elapsedFreeTimeMilliseconds(2000, 1000), /intervalo/i);
console.log('PASS Free Time is disabled outside the exact Emulator runtime and UI opt-in; elapsed time uses integer milliseconds.');
