export type HistoricalRental = {
    id: string;
    reservationCode?: string;
    availabilityGroupId?: string;
    status?: string;
    productId?: string;
    productType?: string;
    selectedWheelSize?: string;
    componentSelections?: Array<{ inventoryItemId?: string; wheelSize?: string }>;
    quantity?: number;
    stockDeducted?: boolean;
    total?: number;
    date?: string;
    duration?: string;
    paymentStatus?: string;
    customerId?: string;
};

export type HistoricalInventory = {
    id: string;
    stock?: number;
    totalStock?: number;
    wheelSizes?: Array<{ size: string; stock?: number; totalStock?: number; maintenanceStock?: number }>;
};

export type HistoricalCustomer = { id: string; authUid?: string };

export const normalizeHistoricalStatus = (status: unknown): string => {
    const value = String(status || 'missing').trim();
    const normalized: Record<string, string> = {
        Pendiente: 'pending', Confirmado: 'confirmed', Entregado: 'delivered',
        Devuelto: 'returned', Cancelado: 'cancelled', Vencido: 'expired',
    };
    return normalized[value] || value.toLowerCase();
};

const holdsStock = (status: string): boolean => ['confirmed', 'delivered'].includes(status);

export function analyzeHistoricalData(input: {
    rentals: HistoricalRental[];
    inventory: HistoricalInventory[];
    customers: HistoricalCustomer[];
}) {
    const { rentals, inventory, customers } = input;
    const inventoryById = new Map(inventory.map((item) => [item.id, item]));
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const statusCounts: Record<string, number> = {};
    const paymentCounts: Record<string, number> = {};
    const issues: Array<{ code: string; id: string; issue: string; details?: Record<string, unknown> }> = [];
    const groups = new Map<string, HistoricalRental[]>();

    for (const row of rentals) {
        const code = row.reservationCode || row.id;
        groups.set(code, [...(groups.get(code) || []), row]);
        const status = normalizeHistoricalStatus(row.status);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        const payment = String(row.paymentStatus || 'missing').toLowerCase();
        paymentCounts[payment] = (paymentCounts[payment] || 0) + 1;
        if (!row.date || !row.duration) issues.push({ code, id: row.id, issue: 'missing_date_or_duration' });
        if (!row.reservationCode) issues.push({ code, id: row.id, issue: 'missing_reservation_group_id' });
        if (!row.availabilityGroupId) issues.push({ code, id: row.id, issue: 'missing_availability_group_projection_unlinked' });
        if (row.productType === 'combo') {
            const selections = Array.isArray(row.componentSelections) ? row.componentSelections : [];
            if (!selections.length) issues.push({ code, id: row.id, issue: 'combo_component_selections_missing' });
            for (const selection of selections) {
                const component = inventoryById.get(String(selection.inventoryItemId || ''));
                if (component?.wheelSizes && component.wheelSizes.length > 1 && !selection.wheelSize) {
                    issues.push({ code, id: row.id, issue: 'combo_component_wheel_size_missing', details: { inventoryItemId: component.id } });
                }
            }
        }
        if (typeof row.total !== 'number' || !Number.isFinite(row.total)) issues.push({ code, id: row.id, issue: 'invalid_or_missing_historical_total' });
        if (holdsStock(status) && row.stockDeducted !== true) {
            issues.push({ code, id: row.id, issue: row.stockDeducted === false ? 'active_status_stock_flag_false_review_required' : 'active_status_stock_state_unknown' });
        }
        if (['returned', 'cancelled', 'expired'].includes(status) && row.stockDeducted === true) {
            issues.push({ code, id: row.id, issue: 'inactive_status_still_marks_stock_deducted' });
        }
        if (row.customerId) {
            const customer = customerById.get(row.customerId);
            if (!customer?.authUid) issues.push({ code, id: row.id, issue: 'historical_customer_auth_link_missing', details: { customerId: row.customerId } });
        }
    }

    for (const [code, group] of groups) {
        const statuses = new Set(group.map((row) => normalizeHistoricalStatus(row.status)));
        if (statuses.size > 1) group.forEach((row) => issues.push({ code, id: row.id, issue: 'group_status_mismatch' }));
    }

    for (const item of inventory) {
        const scopes = item.wheelSizes?.length
            ? item.wheelSizes.map((wheel) => ({ wheelSize: wheel.size, actual: wheel.stock, baseline: wheel.totalStock }))
            : [{ wheelSize: undefined, actual: item.stock, baseline: item.totalStock }];
        for (const scope of scopes) {
            if (typeof scope.baseline !== 'number' || typeof scope.actual !== 'number') {
                issues.push({ code: 'inventory', id: item.id, issue: 'inventory_stock_baseline_missing_review_required', details: { wheelSize: scope.wheelSize, baselineAvailable: typeof scope.baseline === 'number', currentStockAvailable: typeof scope.actual === 'number' } });
                continue;
            }
            const held = rentals.filter((row) => normalizeHistoricalStatus(row.status) !== 'cancelled'
                && normalizeHistoricalStatus(row.status) !== 'returned'
                && normalizeHistoricalStatus(row.status) !== 'expired'
                && row.stockDeducted === true
                && row.productType !== 'combo'
                && row.productId === item.id
                && (!scope.wheelSize || row.selectedWheelSize === scope.wheelSize))
                .reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0);
            const expected = scope.baseline - held;
            if (expected !== scope.actual) {
                issues.push({ code: 'inventory', id: item.id, issue: 'inventory_stock_differs_from_historical_baseline', details: { wheelSize: scope.wheelSize, baseline: scope.baseline, held, expectedAvailable: expected, actualAvailable: scope.actual, delta: scope.actual - expected } });
            }
        }
    }

    return {
        rentalsScanned: rentals.length,
        groupsScanned: groups.size,
        inventoryScanned: inventory.length,
        customersScanned: customers.length,
        statusCounts,
        paymentCounts,
        issueCount: issues.length,
        issues,
    };
}
