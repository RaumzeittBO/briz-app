import assert from 'node:assert/strict';
import { getCustomerProfileCompletionSnapshot, isCustomerProfileFieldEditable, validateCustomerProfileField } from '../src/lib/customerProfileCompletion';

const snapshot = getCustomerProfileCompletionSnapshot({ name: 'Nombre válido', phone: '', ci: '' });
assert.deepEqual(snapshot.editableFields, ['phone', 'ci']);
assert.deepEqual(snapshot.fieldsNeedingReview, []);

// Regression: typing cannot change the opening snapshot, so a field does not
// disappear when its value becomes valid and remains editable for corrections.
let phoneValue = '';
phoneValue = '7654321';
assert.equal(isCustomerProfileFieldEditable(snapshot.editableFields, 'phone'), true, 'phone remains rendered after becoming valid');
phoneValue = '7654';
assert.equal(isCustomerProfileFieldEditable(snapshot.editableFields, 'phone'), true, 'phone remains rendered while correcting an invalid value');
assert.equal(validateCustomerProfileField('phone', phoneValue), 'phone');
phoneValue = '7654321';
assert.equal(validateCustomerProfileField('phone', phoneValue), null);

assert.deepEqual(
    getCustomerProfileCompletionSnapshot({ name: 'Nombre válido', phone: '+591 70000000', ci: '1234567' }).editableFields,
    [],
    'a complete profile does not expose stored fields for editing',
);
assert.deepEqual(
    getCustomerProfileCompletionSnapshot({ name: 'A', phone: '12', ci: '1' }),
    { editableFields: [], fieldsNeedingReview: ['name', 'phone', 'ci'] },
    'invalid non-empty stored values are routed for review and never overwritten',
);
assert.equal(validateCustomerProfileField('name', ' '), 'name');
assert.equal(validateCustomerProfileField('ci', '12'), 'ci');
assert.equal(validateCustomerProfileField('name', 'Ana'), null);
assert.equal(validateCustomerProfileField('ci', '123'), null);

console.log('Customer profile completion snapshot and correction behavior passed (11 assertions).');
