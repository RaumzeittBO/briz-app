import assert from 'node:assert/strict';
import { filterRentalMoneyByStore, summarizeRentalMoney } from '../src/lib/rentalReportMoney';

const rows = [
  { id: 'future-paid', reservationCode: 'future', date: '2026-10-22', createdAt: '2026-10-21T10:00:00.000Z', paidAt: '2026-10-21T14:00:00.000Z', total: 120, amountPaid: 120, paymentStatus: 'paid', status: 'confirmed' },
  { id: 'returned-paid', reservationCode: 'returned', date: '2026-10-20', paidAt: '2026-10-21T15:00:00.000Z', total: 80, amountPaid: 80, paymentStatus: 'paid', status: 'returned' },
  { id: 'returned-unpaid', reservationCode: 'unpaid', date: '2026-10-21', total: 50, paymentStatus: 'unpaid', status: 'returned' },
  { id: 'cancelled-paid', reservationCode: 'cancelled', date: '2026-10-21', paidAt: '2026-10-21T16:00:00.000Z', total: 15, amountPaid: 15, paymentStatus: 'paid', status: 'cancelled' },
  { id: 'legacy-paid', reservationCode: 'legacy', date: '2025-02-10', total: 40, paymentStatus: 'paid', status: 'Devuelto' },
  { id: 'accessory-line', reservationCode: 'future', date: '2026-10-22', paidAt: '2026-10-21T14:00:00.000Z', total: 20, amountPaid: 20, paymentStatus: 'paid', status: 'confirmed' },
  { id: 'store-a-advance', store: 'Cochabamba', date: '2026-10-23', paidAt: '2026-10-21T12:00:00.000Z', total: 100, amountPaid: 100, paymentStatus: 'paid', status: 'confirmed' },
  { id: 'store-b-paid', store: 'La Paz', date: '2026-10-21', paidAt: '2026-10-21T13:00:00.000Z', total: 50, amountPaid: 50, paymentStatus: 'paid', status: 'returned' },
  { id: 'store-a-pending', store: 'Cochabamba', date: '2026-10-21', total: 30, amountPaid: 25, paymentStatus: 'pending_review', status: 'confirmed' },
  { id: 'store-b-pending', store: 'La Paz', date: '2026-10-21', total: 40, paymentStatus: 'unpaid', status: 'confirmed' },
];

const today = summarizeRentalMoney(rows, '2026-10-21', '2026-10-21');
assert.deepEqual(today, { contracted: 170, collected: 385, pending: 120, collectedDateUnknown: 0 });

const allTime = summarizeRentalMoney(rows, '2000-01-01', '2099-12-31', true);
assert.deepEqual(allTime, { contracted: 530, collected: 385, pending: 120, collectedDateUnknown: 40 });

const beforePayment = summarizeRentalMoney(rows, '2026-10-20', '2026-10-20');
assert.deepEqual(beforePayment, { contracted: 80, collected: 0, pending: 0, collectedDateUnknown: 0 });

const cochabamba = summarizeRentalMoney(filterRentalMoneyByStore(rows, 'Cochabamba'), '2026-10-21', '2026-10-21');
assert.deepEqual(cochabamba, { contracted: 80, collected: 335, pending: 80, collectedDateUnknown: 0 });
const laPaz = summarizeRentalMoney(filterRentalMoneyByStore(rows, 'La Paz'), '2026-10-21', '2026-10-21');
assert.deepEqual(laPaz, { contracted: 90, collected: 50, pending: 40, collectedDateUnknown: 0 });
const allBranches = summarizeRentalMoney(filterRentalMoneyByStore(rows, 'all'), '2026-10-21', '2026-10-21');
assert.deepEqual(allBranches, { contracted: 170, collected: 385, pending: 120, collectedDateUnknown: 0 });

console.log('Rental report money regression passed: payment date, future rental, returned/unpaid, legacy unknown date, and combo accessory lines.');
