import type { ComboProduct, ComponentSelection, InventoryItem, Rental } from '@/context/StoreContext';
import { parseBoliviaDateTime, toBoliviaDateString } from './dateUtils';
import { parseDurationToHours } from './rentalPricing';

export interface RentalTimeWindow {
    startMs: number;
    endMs: number;
}

export function isRentalHoldingStock(status?: string): boolean {
    return (
        status === 'confirmed' ||
        status === 'Confirmado' ||
        status === 'delivered' ||
        status === 'Entregado'
    );
}

export function isRentalPendingReservation(status?: string): boolean {
    return status === 'pending' || status === 'Pendiente';
}

export function isRentalActiveOrPending(status?: string): boolean {
    return isRentalHoldingStock(status) || isRentalPendingReservation(status);
}

/**
 * Computes the [startMs, endMs] window for a date, pickupTime, and duration.
 */
export function computeRentalWindow(
    date: string,
    pickupTime: string = '09:00',
    duration: string | number = '1 Hora',
    endTimeOverride?: string
): RentalTimeWindow {
    const startMs = parseBoliviaDateTime(date, pickupTime || '09:00');
    const durationHours = parseDurationToHours(duration);
    let endMs = startMs + durationHours * 60 * 60 * 1000;

    if (endTimeOverride && /^\d{1,2}:\d{2}$/.test(endTimeOverride.trim()) && durationHours < 24) {
        const explicitEndMs = parseBoliviaDateTime(date, endTimeOverride.trim());
        if (explicitEndMs > startMs) {
            endMs = explicitEndMs;
        }
    }
    return { startMs, endMs };
}

/**
 * Returns true if two intervals [aStart, aEnd] and [bStart, bEnd] overlap.
 */
export function doWindowsOverlap(a: RentalTimeWindow, b: RentalTimeWindow): boolean {
    return a.startMs < b.endMs && b.startMs < a.endMs;
}

/**
 * Resolves the wheelSize used by a combo component for a given rental,
 * including safe fallback for legacy rentals where componentSelections was omitted.
 */
export function resolveComboComponentWheelSize(
    rental: Pick<Rental, 'selectedWheelSize' | 'componentSelections'>,
    inventoryItemId: string,
    item?: InventoryItem
): string | undefined {
    const explicit = rental.componentSelections?.find(
        cs => cs.inventoryItemId === inventoryItemId && cs.wheelSize
    )?.wheelSize;
    if (explicit) return explicit;
    if (rental.selectedWheelSize) return rental.selectedWheelSize;
    if (item?.hasWheelSizes && item.wheelSizes && item.wheelSizes.length === 1) {
        return item.wheelSizes[0].size;
    }
    return undefined;
}

/**
 * Builds normalized componentSelections for a combo given the user's selected wheel size.
 */
export function buildComboComponentSelections(
    combo: ComboProduct,
    selectedWheelSize?: string,
    inventory?: InventoryItem[]
): ComponentSelection[] {
    return combo.components.map(comp => {
        const invItem = inventory?.find(i => i.id === comp.inventoryItemId);
        const needsWs = comp.requiresWheelSize || Boolean(invItem?.hasWheelSizes);
        return {
            inventoryItemId: comp.inventoryItemId,
            ...(needsWs && selectedWheelSize ? { wheelSize: selectedWheelSize } : {})
        };
    });
}

/**
 * Decomposes a rental (or cart item) into concrete inventory demands:
 * [{ itemId, wheelSize, quantity }]
 */
export function getRentalInventoryDemands(
    rental: {
        productType: 'single' | 'combo';
        productId: string;
        quantity: number;
        selectedWheelSize?: string;
        componentSelections?: ComponentSelection[];
    },
    inventory: InventoryItem[],
    combos: ComboProduct[]
): { itemId: string; wheelSize?: string; quantity: number }[] {
    if (!rental.productId || rental.productId.startsWith('srv_')) return [];
    const qty = Math.max(0, Number(rental.quantity) || 0);
    if (qty <= 0) return [];

    if (rental.productType === 'single') {
        const item = inventory.find(i => i.id === rental.productId);
        const ws = item?.hasWheelSizes
            ? (rental.selectedWheelSize || item.wheelSizes?.[0]?.size)
            : undefined;
        return [{ itemId: rental.productId, wheelSize: ws, quantity: qty }];
    }

    const combo = combos.find(c => c.id === rental.productId);
    if (!combo) return [];

    const item = inventory.find(i => i.id === combo.components[0]?.inventoryItemId);
    void item;
    return combo.components.map(comp => {
        const compItem = inventory.find(i => i.id === comp.inventoryItemId);
        let ws = (comp.requiresWheelSize || compItem?.hasWheelSizes)
            ? resolveComboComponentWheelSize(rental, comp.inventoryItemId, compItem)
            : undefined;
        if (!ws && compItem?.hasWheelSizes && compItem.wheelSizes?.length) {
            ws = compItem.wheelSizes[0].size;
        }
        return {
            itemId: comp.inventoryItemId,
            wheelSize: ws,
            quantity: comp.quantity * qty
        };
    });
}

/**
 * Calculates total physical operational stock for an inventory item (and optional wheelSize).
 * Since `inventory` in Firestore stores current on-shelf stock (where confirmed/delivered rentals
 * have already been deducted from `item.stock` / `ws.stock`), we reconstruct total operational capacity as:
 *   operationalCapacity = currentShelfStock + currentlyCheckedOutCount
 * And then for any requested time window `[reqStart, reqEnd]`, available stock is:
 *   available = operationalCapacity - overlappingActiveRentalsCount
 *
 * Special case:
 * - If a confirmed/delivered rental is OVERDUE (its planned endMs < now, and it has not been returned yet)
 *   and the requested window starts Today or overlaps with now, that physical unit is still out on the street
 *   and remains unavailable until returned.
 */
export function getAvailableStockForInterval(params: {
    inventory: InventoryItem[];
    combos: ComboProduct[];
    rentals: Rental[];
    itemId: string;
    wheelSize?: string;
    date?: string;
    pickupTime?: string;
    duration?: string | number;
    excludeReservationCode?: string;
    excludeRentalId?: string;
    includePendingReservations?: boolean;
}): number {
    const {
        inventory,
        combos,
        rentals,
        itemId,
        wheelSize,
        date,
        pickupTime = '09:00',
        duration = '1 Hora',
        excludeReservationCode,
        excludeRentalId,
        includePendingReservations = false,
    } = params;

    const item = inventory.find(i => i.id === itemId);
    if (!item || !item.active) return 0;

    // 1. Current shelf stock (already has confirmed/delivered rentals deducted)
    let shelfStock = 0;
    if (item.hasWheelSizes && item.wheelSizes) {
        if (!wheelSize) {
            shelfStock = item.wheelSizes.reduce((sum, ws) => sum + Math.max(0, ws.stock || 0), 0);
        } else {
            shelfStock = Math.max(0, item.wheelSizes.find(w => w.size === wheelSize)?.stock ?? 0);
        }
    } else {
        shelfStock = Math.max(0, item.stock ?? 0);
    }

    // If no date is specified, return current shelf stock directly
    if (!date) {
        return shelfStock;
    }

    const reqWindow = computeRentalWindow(date, pickupTime, duration);
    const todayBolivia = toBoliviaDateString(new Date());
    const isRequestToday = date.trim().slice(0, 10) <= todayBolivia;

    // 2. Reconstruct total operational capacity by adding back units currently deducted by confirmed/delivered rentals
    let currentlyDeductedUnits = 0;
    let overlappingReservedUnits = 0;

    for (const r of rentals) {
        const isHolding = isRentalHoldingStock(r.status);
        const isPending = includePendingReservations && isRentalPendingReservation(r.status);
        if (!isHolding && !isPending) continue;

        const demands = getRentalInventoryDemands(r, inventory, combos);
        for (const dem of demands) {
            if (dem.itemId !== itemId) continue;
            if (wheelSize && item.hasWheelSizes && dem.wheelSize && dem.wheelSize !== wheelSize) continue;

            if (isHolding) {
                currentlyDeductedUnits += dem.quantity;
            }

            // Skip excluded rental/group when checking availability for confirming or editing that same group
            if (excludeRentalId && r.id === excludeRentalId) continue;
            if (excludeReservationCode && r.reservationCode === excludeReservationCode) continue;

            const rWindow = computeRentalWindow(r.date, r.pickupTime || '09:00', r.duration || '1 Hora');
            const overlaps = doWindowsOverlap(reqWindow, rWindow);

            // Also treat overdue unreturned rentals as blocking if the request is for today
            const isOverdueStillOut = isHolding && isRequestToday && rWindow.endMs <= reqWindow.startMs;

            if (overlaps || isOverdueStillOut) {
                overlappingReservedUnits += dem.quantity;
            }
        }
    }

    const operationalCapacity = shelfStock + currentlyDeductedUnits;
    return Math.max(0, operationalCapacity - overlappingReservedUnits);
}

/**
 * Calculates combo availability for a specific time window (and optional bike wheel size).
 */
export function getComboAvailabilityForInterval(params: {
    inventory: InventoryItem[];
    combos: ComboProduct[];
    rentals: Rental[];
    comboId: string;
    wheelSize?: string;
    date?: string;
    pickupTime?: string;
    duration?: string | number;
    excludeReservationCode?: string;
    includePendingReservations?: boolean;
}): number {
    const { comboId, combos, inventory, wheelSize } = params;
    const combo = combos.find(c => c.id === comboId);
    if (!combo || !combo.active || combo.components.length === 0) return 0;

    let minAvail = Infinity;
    for (const comp of combo.components) {
        const item = inventory.find(i => i.id === comp.inventoryItemId);
        if (!item || !item.active) return 0;
        const compWs = (comp.requiresWheelSize || item.hasWheelSizes) ? wheelSize : undefined;
        const itemAvail = getAvailableStockForInterval({
            ...params,
            itemId: item.id,
            wheelSize: compWs,
        });
        const possible = Math.floor(itemAvail / Math.max(1, comp.quantity));
        minAvail = Math.min(minAvail, possible);
    }
    return minAvail === Infinity ? 0 : Math.max(0, minAvail);
}
