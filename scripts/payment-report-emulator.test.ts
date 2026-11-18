import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { filterCompletedSales, filterCompletedServiceOrders, serviceOrderRevenue, sumServiceOrderRevenue } from '../src/lib/adminReportScope';
import { filterRentalMoneyByStore, summarizeRentalMoney, summarizeRentalReceiptsByMethod, summarizeSalesByMethod } from '../src/lib/rentalReportMoney';

const projectId = 'demo-briz-payment-reports';
const reportDay = '2026-11-15';
const previousDay = '2026-11-14';
const at = (day: string, time = '12:00') => `${day}T${time}:00-04:00`;
let env: RulesTestEnvironment;

const rentals = [
  { id: 'cash-today', reservationCode: 'cash-today', store: 'Cochabamba', date: reportDay, total: 120, amountPaid: 120, paidAt: at(reportDay), paymentMethod: 'Efectivo', paymentStatus: 'paid', status: 'delivered' },
  { id: 'qr-today', reservationCode: 'qr-today', store: 'Cochabamba', date: reportDay, total: 80, amountPaid: 80, paidAt: at(reportDay), paymentMethod: 'QR', paymentStatus: 'paid', status: 'returned' },
  { id: 'pending-today', reservationCode: 'pending-today', store: 'Cochabamba', date: reportDay, total: 60, paymentStatus: 'unpaid', status: 'confirmed' },
  { id: 'partial-later', reservationCode: 'partial-later', store: 'Cochabamba', date: reportDay, total: 100, amountPaid: 100, paidAt: at(reportDay), paymentMethod: 'QR', paymentStatus: 'paid', status: 'delivered' },
  { id: 'refund-correction', reservationCode: 'refund-correction', store: 'Cochabamba', date: reportDay, total: 50, amountPaid: 50, paidAt: at(reportDay), paymentMethod: 'Transferencia', paymentStatus: 'paid', status: 'returned' },
  { id: 'branch-lpz', reservationCode: 'branch-lpz', store: 'La Paz', date: reportDay, total: 70, amountPaid: 70, paidAt: at(reportDay), paymentMethod: 'Efectivo', paymentStatus: 'paid', status: 'delivered' },
  { id: 'old-payment', reservationCode: 'old-payment', store: 'Cochabamba', date: previousDay, total: 35, amountPaid: 35, paidAt: at(previousDay), paymentMethod: 'Efectivo', paymentStatus: 'paid', status: 'delivered' },
  { id: 'legacy-qr', reservationCode: 'legacy-qr', store: 'Cochabamba', date: reportDay, total: 25, amountPaid: 25, paidAt: at(reportDay), paymentMethod: 'qr', paymentStatus: 'paid', status: 'delivered' },
  { id: 'legacy-unknown', reservationCode: 'legacy-unknown', store: 'Cochabamba', date: reportDay, total: 15, amountPaid: 15, paidAt: at(reportDay), paymentStatus: 'paid', status: 'delivered' },
];

const movements = [
  { id: 'cash-movement', reservationCode: 'cash-today', rentalIds: ['cash-today'], store: 'Cochabamba', type: 'receipt', amount: 120, method: 'Efectivo', actualAt: at(reportDay) },
  { id: 'qr-movement', reservationCode: 'qr-today', rentalIds: ['qr-today'], store: 'Cochabamba', type: 'receipt', amount: 80, method: 'QR', actualAt: at(reportDay) },
  { id: 'partial-first', reservationCode: 'partial-later', rentalIds: ['partial-later'], store: 'Cochabamba', type: 'receipt', amount: 40, method: 'Efectivo', actualAt: at(previousDay) },
  { id: 'partial-final', reservationCode: 'partial-later', rentalIds: ['partial-later'], store: 'Cochabamba', type: 'receipt', amount: 60, method: 'QR', actualAt: at(reportDay) },
  { id: 'transfer-receipt', reservationCode: 'refund-correction', rentalIds: ['refund-correction'], store: 'Cochabamba', type: 'receipt', amount: 50, method: 'Transferencia', actualAt: at(reportDay) },
  { id: 'transfer-refund', reservationCode: 'refund-correction', rentalIds: ['refund-correction'], store: 'Cochabamba', type: 'refund', amount: 10, method: 'Transferencia', actualAt: at(reportDay), referenceMovementId: 'transfer-receipt' },
  { id: 'transfer-correction', reservationCode: 'refund-correction', rentalIds: ['refund-correction'], store: 'Cochabamba', type: 'correction', amount: 5, method: 'Transferencia', actualAt: at(reportDay), referenceMovementId: 'transfer-receipt' },
  { id: 'lapaz-movement', reservationCode: 'branch-lpz', rentalIds: ['branch-lpz'], store: 'La Paz', type: 'receipt', amount: 70, method: 'Efectivo', actualAt: at(reportDay) },
  { id: 'old-movement', reservationCode: 'old-payment', rentalIds: ['old-payment'], store: 'Cochabamba', type: 'receipt', amount: 35, method: 'Efectivo', actualAt: at(previousDay) },
];

const sales = [
  { id: 'sale-cash', store: 'Cochabamba', date: reportDay, status: 'Completado', total: 30, paymentMethod: 'efectivo' },
  { id: 'sale-qr', store: 'Cochabamba', date: reportDay, status: 'Completado', total: 20, paymentMethod: 'qr' },
  { id: 'sale-transfer', store: 'Cochabamba', date: reportDay, status: 'Completado', total: 10, paymentMethod: 'Transferencia' },
  { id: 'sale-unknown', store: 'La Paz', date: reportDay, status: 'Completado', total: 7, paymentMethod: '' },
  { id: 'sale-cancelled', store: 'Cochabamba', date: reportDay, status: 'Cancelado', total: 90, paymentMethod: 'efectivo' },
];

const serviceOrders = [
  { id: 'service-received', store: 'Cochabamba', date: reportDay, status: 'Recibido', costEstimate: 0 },
  { id: 'service-progress', store: 'Cochabamba', date: reportDay, status: 'En reparación', costEstimate: 55 },
  { id: 'service-finished', store: 'Cochabamba', date: reportDay, status: 'Entregado', costEstimate: 90 },
  { id: 'service-finished-lpz', store: 'La Paz', date: reportDay, status: 'Listo', costEstimate: 40 },
  { id: 'service-cancelled', store: 'Cochabamba', date: reportDay, status: 'Cancelado', costEstimate: 600 },
];

try {
  env = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const row of rentals) await setDoc(doc(db, 'rentals', row.id), row);
    for (const movement of movements) await setDoc(doc(db, 'rentalPaymentMovements', movement.id), movement);
    for (const sale of sales) await setDoc(doc(db, 'sales', sale.id), sale);
    for (const order of serviceOrders) await setDoc(doc(db, 'serviceOrders', order.id), order);
  });

  let rentalRows: typeof rentals = [];
  let movementRows: typeof movements = [];
  let saleRows: typeof sales = [];
  let serviceRows: typeof serviceOrders = [];
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const [rentalDocs, movementDocs, salesDocs, serviceDocs] = await Promise.all([
      getDocs(collection(db, 'rentals')),
      getDocs(collection(db, 'rentalPaymentMovements')),
      getDocs(collection(db, 'sales')),
      getDocs(collection(db, 'serviceOrders')),
    ]);
    rentalRows = rentalDocs.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })) as typeof rentals;
    movementRows = movementDocs.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })) as typeof movements;
    saleRows = salesDocs.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })) as typeof sales;
    serviceRows = serviceDocs.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })) as typeof serviceOrders;
  });
  const allStores = filterRentalMoneyByStore(rentalRows, 'all');
  const allMovements = filterRentalMoneyByStore(movementRows, 'all');
  const todayRentalPayments = summarizeRentalMoney(allStores, reportDay, reportDay, false, allMovements);
  const todayMethods = summarizeRentalReceiptsByMethod(allStores, allMovements, reportDay, reportDay);
  const pass = (message: string) => console.log(`PASS ${message}`);

  assert.equal(todayMethods.byMethod.Efectivo, 190);
  assert.equal(todayMethods.byMethod.QR, 165);
  assert.equal(todayMethods.byMethod.Transferencia, 50);
  assert.equal(todayMethods.byMethod['Sin especificar'], 15);
  assert.equal(todayMethods.total, 420);
  assert.equal(todayRentalPayments.collected, todayMethods.total, 'Method totals must exactly reconcile to dated receipts.');
  pass('Immediate cash/QR receipts and a historical payment with no verified method remain separated');

  assert.equal(todayRentalPayments.pending, 60);
  assert.equal(todayRentalPayments.contracted, 520);
  pass('Pending contract value is not treated as a receipt');

  const fullHistory = summarizeRentalReceiptsByMethod(allStores, allMovements, previousDay, reportDay);
  assert.equal(fullHistory.byMethod.Efectivo, 265);
  assert.equal(fullHistory.byMethod.QR, 165);
  assert.equal(fullHistory.total, 495);
  pass('A later payment and a split payment use each movement’s actual date and method');

  assert.equal(todayRentalPayments.refunded, 10);
  assert.equal(todayRentalPayments.corrected, 5);
  assert.equal(todayRentalPayments.netCash, 410);
  assert.equal(todayRentalPayments.netRecognized, 405);
  assert.equal(todayMethods.byMethod.Transferencia, 50, 'Refund and accounting correction are not double-counted as receipts.');
  pass('Refund and correction reduce net figures without duplicating or changing gross method receipts');

  const branchRentals = filterRentalMoneyByStore(rentalRows, 'Cochabamba');
  const branchMovements = filterRentalMoneyByStore(movementRows, 'Cochabamba');
  const branchMethods = summarizeRentalReceiptsByMethod(branchRentals, branchMovements, reportDay, reportDay);
  assert.equal(branchMethods.total, 350);
  assert.equal(branchMethods.byMethod.Efectivo, 120);
  pass('Date and branch filters exclude the La Paz collection and the previous-day receipt');

  const completedSales = filterCompletedSales(saleRows, { start: reportDay, end: reportDay }, 'all', sale => sale.date);
  const salesMethods = summarizeSalesByMethod(completedSales);
  assert.equal(completedSales.length, 4);
  assert.deepEqual(salesMethods.byMethod, { Efectivo: 30, QR: 20, Transferencia: 10, 'Sin especificar': 7 });
  assert.equal(salesMethods.total, 67);
  pass('Completed store sales reconcile by payment method and exclude canceled sales');

  const completedServices = filterCompletedServiceOrders(serviceRows, { start: reportDay, end: reportDay }, 'all', order => order.date);
  assert.equal(completedServices.length, 2);
  assert.equal(sumServiceOrderRevenue(completedServices), 130);
  assert.equal(serviceOrderRevenue(completedServices[0]), 90);
  assert.equal(completedServices.some(order => 'amountPaid' in order), false, 'A finished service estimate is not a payment record.');
  pass('Workshop counts distinguish received, in-progress, finished and canceled; service value stays separate from receipts');

  const branchSales = filterCompletedSales(saleRows, { start: reportDay, end: reportDay }, 'Cochabamba', sale => sale.date);
  const branchServices = filterCompletedServiceOrders(serviceRows, { start: reportDay, end: reportDay }, 'Cochabamba', order => order.date);
  assert.equal(branchSales.length, 3);
  assert.equal(branchServices.length, 1);
  pass('The existing branch scope applies consistently to sales and workshop records');

  console.log(`FIXTURE TOTALS — alquileres recibidos Bs. ${todayMethods.total}; métodos ${JSON.stringify(todayMethods.byMethod)}; pendiente Bs. ${todayRentalPayments.pending}; ventas completadas Bs. ${salesMethods.total}; taller registrado Bs. ${sumServiceOrderRevenue(completedServices)} (cobro no registrado).`);
} finally {
  await env?.cleanup();
}
