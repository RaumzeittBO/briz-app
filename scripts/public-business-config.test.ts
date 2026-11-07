import assert from 'node:assert/strict';
import {
  businessMapUrl,
  businessWhatsAppUrl,
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  formatBusinessHours,
  mergePublicBusinessConfig,
  validatePublicBusinessConfig,
} from '../src/lib/businessConfig';

const merged = mergePublicBusinessConfig({
  businessName: 'Briz Centro',
  whatsapp: '+591 7123 4567',
  hours: { sunday: { closed: true, open: '09:00', close: '14:00' } },
});

assert.equal(merged.businessName, 'Briz Centro');
assert.equal(merged.phone, DEFAULT_PUBLIC_BUSINESS_CONFIG.phone);
assert.equal(merged.hours.sunday.closed, true);
assert.equal(merged.hours.monday.open, DEFAULT_PUBLIC_BUSINESS_CONFIG.hours.monday.open);
assert.equal(formatBusinessHours(merged.hours.sunday, 'es'), 'Cerrado');
assert.equal(formatBusinessHours(merged.hours.sunday, 'en'), 'Closed');
assert.equal(businessWhatsAppUrl(merged.whatsapp, 'Consulta rápida'), 'https://wa.me/59171234567?text=Consulta%20r%C3%A1pida');
assert.equal(businessMapUrl('Calle 1, Cochabamba').includes(encodeURIComponent('Calle 1, Cochabamba')), true);
assert.equal(validatePublicBusinessConfig(merged), null);
assert.match(validatePublicBusinessConfig({ ...merged, email: 'invalid' }) || '', /correo/i);
assert.match(validatePublicBusinessConfig({ ...merged, hours: { ...merged.hours, monday: { closed: false, open: '18:00', close: '08:00' } } }) || '', /horarios/i);

console.log('Public business configuration tests passed (10 assertions).');
