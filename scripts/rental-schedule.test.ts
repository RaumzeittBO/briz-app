import assert from 'node:assert/strict';
import { DEFAULT_PUBLIC_BUSINESS_CONFIG } from '../src/lib/businessConfig';
import { getRentalPickupOptions, validateRentalSchedule } from '../src/lib/rentalSchedule';
import { validateRentalBusinessHours } from '../functions/src/businessHours';

const hours = { ...DEFAULT_PUBLIC_BUSINESS_CONFIG.hours, monday: { closed: false, open: '08:00', close: '12:00', secondShift: { open: '13:00', close: '19:30' } } };
const check = (date: string, time: string, duration: string) => {
  const frontend = validateRentalSchedule(hours, date, time, duration);
  const backend = validateRentalBusinessHours(hours, date, time, duration);
  assert.equal(frontend.valid, backend === null, `${date} ${time} ${duration}: frontend/backend parity`);
  return frontend;
};

assert.equal(check('2026-11-16', '17:30', '2 horas').valid, true, 'return exactly at 19:30 is allowed');
const afterClose = check('2026-11-16', '18:00', '3 horas');
assert.equal(afterClose.valid, false);
if (!afterClose.valid) assert.match(afterClose.reason, /19:30/);
assert.equal(check('2026-11-16', '11:00', '3 horas').valid, true, 'rental may span the lunch closure if its return is open');
assert.equal(check('2026-11-15', '10:00', '1 hora').valid, true, 'Sunday remains open per configured default');
assert.equal(check('2026-11-16', '12:30', '1 hora').valid, false, 'pickup during split-shift closure is rejected');
assert.equal(check('2026-11-16', '09:00', '1 día').valid, true, '24h rental validates next day endpoint');
const closedHours = { ...hours, tuesday: { closed: true, open: '08:00', close: '19:00' } };
assert.equal(validateRentalSchedule(closedHours, '2026-11-17', '10:00', '1 hora').valid, false, 'closed day rejected');
assert.ok(getRentalPickupOptions(hours, '2026-11-16', '2 horas').includes('17:30'));
assert.ok(!getRentalPickupOptions(hours, '2026-11-16', '2 horas').includes('18:00'));
assert.equal(check('2026-11-16', '09:00', '2 días').valid, true, 'multi-day rental checks its end date and time');
assert.match(validateRentalBusinessHours(hours, '2026-11-16', '17:30', '2 horas', '21:00') || '', /no coincide/);
console.log('Rental schedule policy passed (12 assertions).');
