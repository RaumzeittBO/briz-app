import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  businessMapUrl,
  businessWhatsAppUrl,
  createInitialPublicBusinessConfig,
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
const firstSave = createInitialPublicBusinessConfig({ hours: { monday: { closed: true, open: '08:00', close: '19:00' } } }, 'server-time');
assert.equal(firstSave.hours.monday.closed, true);
for (const day of ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const) {
  assert.deepEqual(firstSave.hours[day], DEFAULT_PUBLIC_BUSINESS_CONFIG.hours[day], `first business settings save must seed ${day}`);
}
assert.equal(formatBusinessHours(merged.hours.sunday, 'es'), 'Cerrado');
assert.equal(formatBusinessHours(merged.hours.sunday, 'en'), 'Closed');
assert.equal(businessWhatsAppUrl(merged.whatsapp, 'Consulta rápida'), 'https://wa.me/59171234567?text=Consulta%20r%C3%A1pida');
const distinctChannels = { phone: '+591 70000001', whatsapp: '+591 70000002' };
assert.equal(businessWhatsAppUrl(distinctChannels.whatsapp), 'https://wa.me/59170000002');
const contactSource = await readFile(new URL('../src/pages/public/ContactPage.tsx', import.meta.url), 'utf8');
assert.match(contactSource, /businessWhatsAppUrl\(publicBusinessConfig\.whatsapp\)[\s\S]{0,500}publicBusinessConfig\.whatsapp/);
assert.match(contactSource, /title: language === 'es' \? 'Teléfono' : 'Phone'[\s\S]{0,250}publicBusinessConfig\.phone/);
assert.equal(businessMapUrl('Calle 1, Cochabamba').includes(encodeURIComponent('Calle 1, Cochabamba')), true);
assert.equal(validatePublicBusinessConfig(merged), null);
assert.match(validatePublicBusinessConfig({ ...merged, email: 'invalid' }) || '', /correo/i);
assert.match(validatePublicBusinessConfig({ ...merged, hours: { ...merged.hours, monday: { closed: false, open: '18:00', close: '08:00' } } }) || '', /horarios/i);

console.log('Public business configuration tests passed.');
