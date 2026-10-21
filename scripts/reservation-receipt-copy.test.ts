import assert from 'node:assert/strict';
import { getReservationReceiptCopy } from '../src/lib/reservationReceiptCopy.ts';

const spanish = getReservationReceiptCopy('es');
assert.equal(spanish.title, 'Solicitud recibida');
assert.match(spanish.description, /pendiente de confirmación/i);
assert.match(spanish.description, /no se envió una notificación automática/i);
assert.doesNotMatch(spanish.title, /confirmad[oa]/i);

const english = getReservationReceiptCopy('en');
assert.equal(english.title, 'Request received');
assert.match(english.description, /pending confirmation/i);
assert.match(english.description, /no automatic notification was sent/i);
assert.doesNotMatch(english.title, /confirmed/i);

console.log('Reservation receipt copy regression passed for ES/EN.');
