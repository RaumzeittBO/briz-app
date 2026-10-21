import assert from 'node:assert/strict';
import { analyzeHistoricalData } from './reconcile-rentals-analysis';

const report = analyzeHistoricalData({
    rentals: [
        { id: 'legacy-pending', status: 'Pendiente', productId: 'bike-legacy', productType: 'single', quantity: 1, total: 20, paymentStatus: 'unpaid', date: '2025-03-01', duration: '1 hora', customerId: 'customer-no-auth' },
        { id: 'legacy-confirmed', reservationCode: 'legacy-mixed', status: 'Confirmado', productId: 'bike-legacy', productType: 'single', selectedWheelSize: '26', quantity: 1, total: 20, paymentStatus: 'paid', date: '2025-03-02', duration: '1 hora', stockDeducted: true },
        { id: 'legacy-delivered', reservationCode: 'legacy-mixed', status: 'Entregado', productId: 'bike-legacy', productType: 'single', selectedWheelSize: '26', quantity: 1, total: 30, paymentStatus: 'paid', date: '2025-03-02', duration: '2 horas', stockDeducted: true },
        { id: 'legacy-returned', status: 'Devuelto', productId: 'bike-legacy', productType: 'single', selectedWheelSize: '26', quantity: 1, total: 20, paymentStatus: 'paid', date: '2025-03-03', duration: '1 hora', stockDeducted: false },
        { id: 'legacy-cancelled', status: 'Cancelado', productId: 'bike-legacy', productType: 'single', quantity: 1, total: 20, paymentStatus: 'unpaid', date: '2025-03-04', duration: '1 hora', stockDeducted: false },
        { id: 'legacy-combo-no-selection', status: 'Pendiente', productType: 'combo', productId: 'combo-legacy', quantity: 1, date: '2025-03-05', duration: '1 hora', total: 40 },
        { id: 'legacy-combo-no-size', status: 'Confirmado', productType: 'combo', productId: 'combo-legacy', quantity: 1, date: '2025-03-06', duration: '1 hora', total: 40, stockDeducted: true, componentSelections: [{ inventoryItemId: 'bike-legacy' }] },
        { id: 'legacy-fields-absent', status: 'Vencido', productType: 'single', productId: 'bike-legacy' },
    ],
    inventory: [{ id: 'bike-legacy', wheelSizes: [{ size: '26', totalStock: 4, stock: 1, maintenanceStock: 0 }, { size: '27', totalStock: 2, stock: 2, maintenanceStock: 0 }] }],
    customers: [{ id: 'customer-authenticated', authUid: 'auth-uid' }],
});

assert.equal(report.rentalsScanned, 8, 'Historical verification must use a non-empty, representative fixture.');
assert.ok(report.issueCount > 0);
assert.equal(report.statusCounts.pending, 2);
assert.equal(report.statusCounts.confirmed, 2);
assert.equal(report.statusCounts.delivered, 1);
assert.equal(report.statusCounts.returned, 1);
assert.equal(report.statusCounts.cancelled, 1);
assert.equal(report.paymentCounts.paid, 3);
assert.ok(report.issues.some((issue) => issue.id === 'legacy-pending' && issue.issue === 'missing_reservation_group_id'));
assert.ok(report.issues.some((issue) => issue.id === 'legacy-combo-no-selection' && issue.issue === 'combo_component_selections_missing'));
assert.ok(report.issues.some((issue) => issue.id === 'legacy-combo-no-size' && issue.issue === 'combo_component_wheel_size_missing'));
assert.ok(report.issues.some((issue) => issue.id === 'legacy-fields-absent' && issue.issue === 'missing_date_or_duration'));
assert.ok(report.issues.some((issue) => issue.code === 'legacy-mixed' && issue.issue === 'group_status_mismatch'));
assert.ok(report.issues.some((issue) => issue.id === 'legacy-pending' && issue.issue === 'historical_customer_auth_link_missing'));
assert.ok(report.issues.some((issue) => issue.issue === 'inventory_stock_differs_from_historical_baseline'
    && issue.details?.delta === -1));
console.log(`Historical reconciliation fixture passed: ${report.rentalsScanned} rentals, ${report.issueCount} actionable findings.`);
