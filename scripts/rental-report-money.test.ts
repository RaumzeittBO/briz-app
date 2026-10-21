import assert from 'node:assert/strict';
import { summarizeRentalMoney } from '../src/lib/rentalReportMoney';

const rows = [
  { id: 'future-paid', reservationCode: 'future', date: '2026-10-22', createdAt: '2026-10-21T10:00:00.000Z', paidAt: '2026-10-21T14:00:00.000Z', total: 120, amountPaid: 120, paymentStatus: 'paid', status: 'confirmed' },
  { id: 'returned-paid', reservationCode: 'returned', date: '2026-10-20', paidAt: '2026-10-21T15:00:00.000Z', total: 80, amountPaid: 80, paymentStatus: 'paid', status: 'returned' },
  { id: 'returned-unpaid', reservationCode: 'unpaid', date: '2026-10-21', total: 50, paymentStatus: 'unpaid', status: 'returned' },
  { id: 'cancelled-paid', reservationCode: 'cancelled', date: '2026-10-21', paidAt: '2026-10-21T16:00:00.000Z', total: 15, amountPaid: 15, paymentStatus: 'paid', status: 'cancelled' },
  { id: 'legacy-paid', reservationCode: 'legacy', date: '2025-02-10', total: 40, paymentStatus: 'paid', status: 'Devuelto' },
  { id: 'accessory-line', reservationCode: 'future', date: '2026-10-22', paidAt: '2026-10-21T14:00:00.000Z', total: 20, amountPaid: 20, paymentStatus: 'paid', status: 'confirmed' },
];

const today = summarizeRentalMoney(rows, '2026-10-21', '2026-10-21');
assert.deepEqual(today, { contracted: 50, collected: 235, pending: 50, collectedDateUnknown: 0 });

const allTime = summarizeRentalMoney(rows, '2000-01-01', '2099-12-31', true);
assert.deepEqual(allTime, { contracted: 310, collected: 235, pending: 50, collectedDateUnknown: 40 });

const beforePayment = summarizeRentalMoney(rows, '2026-10-20', '2026-10-20');
assert.deepEqual(beforePayment, { contracted: 80, collected: 0, pending: 0, collectedDateUnknown: 0 });

console.log('Rental report money regression passed: payment date, future rental, returned/unpaid, legacy unknown date, and combo accessory lines.');
