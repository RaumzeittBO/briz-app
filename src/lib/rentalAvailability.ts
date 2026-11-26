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
 * Resolves an inventory item for a combo component, supporting strict ID lookup
 * and resilient alias matching if an item was recreated with a generated ID.
 */
export function findComboComponentItem(
    componentId: string,
    inventory: InventoryItem[],
    targetStore?: string
): { item?: InventoryItem; isAliasMatch: boolean; storeMismatch?: boolean; mismatchedStore?: string } {
    const exact = inventory.find(i => i.id === componentId);
    if (exact) {
        if (targetStore && exact.store && targetStore !== 'all' && exact.store !== 'all' && exact.store !== targetStore) {
            return { item: exact, isAliasMatch: false, storeMismatch: true, mismatchedStore: exact.store };
        }
        return { item: exact, isAliasMatch: false };
    }

    // Fallback alias resolution (e.g. 'bike_mamachari' -> item with name 'Mamachari')
    const lowerId = componentId.toLowerCase();
    const expectedType: 'bike' | 'accessory' | undefined = lowerId.startsWith('bike_')
        ? 'bike'
        : lowerId.startsWith('acc_')
            ? 'accessory'
            : undefined;

    const norm = lowerId.replace(/^(bike_|acc_|inv_)/, '').replace(/_/g, ' ').trim();
    if (norm && norm.length >= 3) {
        // 1. Try exact normalized name match (respecting expected type if known)
        const exactMatches = inventory.filter(i => {
            if (!i.active) return false;
            if (expectedType && i.itemType && i.itemType !== expectedType) return false;
            return i.name.toLowerCase().trim() === norm;
        });
        if (exactMatches.length === 1) {
            const candidate = exactMatches[0];
            if (targetStore && candidate.store && targetStore !== 'all' && candidate.store !== 'all' && candidate.store !== targetStore) {
                return { item: candidate, isAliasMatch: true, storeMismatch: true, mismatchedStore: candidate.store };
            }
            return { item: candidate, isAliasMatch: true };
        }

        // 2. Try substring match, but strictly reject generic words and ambiguous multiple matches
        const genericWords = new Set(['bike', 'bici', 'bicicleta', 'acc', 'accesorio', 'combo', 'item']);
        if (!genericWords.has(norm)) {
            const partialMatches = inventory.filter(i => {
                if (!i.active) return false;
                if (expectedType && i.itemType && i.itemType !== expectedType) return false;
                return i.name.toLowerCase().includes(norm);
            });
            // Strictly require exactly 1 unique match to prevent ambiguous substitutions
            if (partialMatches.length === 1) {
                const candidate = partialMatches[0];
                if (targetStore && candidate.store && targetStore !== 'all' && candidate.store !== 'all' && candidate.store !== targetStore) {
                    return { item: candidate, isAliasMatch: true, storeMismatch: true, mismatchedStore: candidate.store };
                }
                return { item: candidate, isAliasMatch: true };
            }
        }
    }
    return { item: undefined, isAliasMatch: false };
}

export interface ComboComponentDiagnostic {
    inventoryItemId: string;
    resolvedItemId?: string;
    isAliasMatch: boolean;
    name: string;
    requiredQuantity: number;
    availableStock: number;
    capacity: number;
    isBottleneck: boolean;
    reasonCode: 'ok' | 'missing_item' | 'inactive_item' | 'out_of_stock' | 'reserved' | 'in_maintenance' | 'wheel_size_unavailable' | 'store_mismatch';
    reasonMessage: string;
}

export interface ComboAvailabilityReport {
    comboId: string;
    comboName: string;
    available: number;
    isAvailable: boolean;
    bottleneckReason: string;
    bottleneckComponentName?: string;
    components: ComboComponentDiagnostic[];
}

/**
 * Detailed diagnostic breakdown explaining why a combo is available or unavailable,
 * pinpointing missing components, wheel size issues, workshop/maintenance, or stock limits.
 */
export function getComboAvailabilityDiagnostics(params: {
    inventory: InventoryItem[];
    combos: ComboProduct[];
    rentals: Rental[];
    comboId?: string;
    combo?: ComboProduct;
    wheelSize?: string;
    date?: string;
    pickupTime?: string;
    duration?: string | number;
    excludeReservationCode?: string;
    includePendingReservations?: boolean;
}): ComboAvailabilityReport {
    const { combos, inventory, wheelSize } = params;
    const combo = params.combo || combos.find(c => c.id === params.comboId);
    const comboId = combo?.id || params.comboId || '';
    if (!combo) {
        return {
            comboId,
            comboName: 'Combinada desconocida',
            available: 0,
            isAvailable: false,
            bottleneckReason: 'Combinada inexistente',
            components: [],
        };
    }
    if (!combo.active) {
        return {
            comboId,
            comboName: combo.name,
            available: 0,
            isAvailable: false,
            bottleneckReason: 'Combinada inactiva en el catálogo',
            components: [],
        };
    }
    if (combo.components.length === 0) {
        return {
            comboId,
            comboName: combo.name,
            available: 0,
            isAvailable: false,
            bottleneckReason: 'Sin componentes configurados',
            components: [],
        };
    }

    const componentReports: ComboComponentDiagnostic[] = [];
    let minCapacity = Infinity;

    for (const comp of combo.components) {
        const { item, isAliasMatch, storeMismatch, mismatchedStore } = findComboComponentItem(comp.inventoryItemId, inventory, combo.store);
        const reqQty = Math.max(1, comp.quantity);

        if (storeMismatch) {
            componentReports.push({
                inventoryItemId: comp.inventoryItemId,
                resolvedItemId: item?.id,
                isAliasMatch,
                name: item?.name || comp.inventoryItemId,
                requiredQuantity: reqQty,
                availableStock: 0,
                capacity: 0,
                isBottleneck: true,
                reasonCode: 'store_mismatch',
                reasonMessage: `Stock registrado en otra sucursal (${mismatchedStore || 'diferente'})`,
            });
            minCapacity = 0;
            continue;
        }

        if (!item || !item.active) {
            componentReports.push({
                inventoryItemId: comp.inventoryItemId,
                resolvedItemId: item?.id,
                isAliasMatch,
                name: item?.name || comp.inventoryItemId,
                requiredQuantity: reqQty,
                availableStock: 0,
                capacity: 0,
                isBottleneck: true,
                reasonCode: item ? 'inactive_item' : 'missing_item',
                reasonMessage: item ? 'Componente inactivo en inventario' : `Componente inexistente en inventario (${comp.inventoryItemId})`,
            });
            minCapacity = 0;
            continue;
        }

        const compWs = (comp.requiresWheelSize || item.hasWheelSizes) ? wheelSize : undefined;
        if (compWs && item.hasWheelSizes && !item.wheelSizes?.some(w => w.size === compWs)) {
            componentReports.push({
                inventoryItemId: comp.inventoryItemId,
                resolvedItemId: item.id,
                isAliasMatch,
                name: item.name,
                requiredQuantity: reqQty,
                availableStock: 0,
                capacity: 0,
                isBottleneck: true,
                reasonCode: 'wheel_size_unavailable',
                reasonMessage: `Aro ${compWs} no disponible para ${item.name}`,
            });
            minCapacity = 0;
            continue;
        }

        const itemAvail = getAvailableStockForInterval({
            ...params,
            itemId: item.id,
            wheelSize: compWs,
        });
        const capacity = Math.floor(itemAvail / reqQty);

        let reasonCode: ComboComponentDiagnostic['reasonCode'] = 'ok';
        let reasonMessage = 'Disponible';

        if (capacity <= 0) {
            if (params.date && itemAvail === 0) {
                const workshopUnits = Number(item.maintenanceStock) || (item.hasWheelSizes
                    ? (item.wheelSizes || []).reduce((sum, wheel) => sum + Math.max(0, Number(wheel.maintenanceStock) || 0), 0)
                    : 0);
                if (workshopUnits > 0) {
                    reasonCode = 'in_maintenance';
                    reasonMessage = `${item.name}: sin disponibilidad para el horario consultado; ${workshopUnits} unidad(es) registrada(s) en taller`;
                } else {
                    reasonCode = 'reserved';
                    reasonMessage = `${item.name}: sin disponibilidad para el horario consultado`;
                }
            } else if ((Number(item.maintenanceStock) || 0) > 0) {
                reasonCode = 'in_maintenance';
                reasonMessage = `${item.name}: unidades en mantenimiento / taller`;
            } else if (itemAvail === 0) {
                reasonCode = 'out_of_stock';
                reasonMessage = `${item.name}: sin existencias disponibles`;
            }
        }

        componentReports.push({
            inventoryItemId: comp.inventoryItemId,
            resolvedItemId: item.id,
            isAliasMatch,
            name: item.name,
            requiredQuantity: reqQty,
            availableStock: itemAvail,
            capacity,
            isBottleneck: false, // determined below
            reasonCode,
            reasonMessage,
        });

        minCapacity = Math.min(minCapacity, capacity);
    }

    const effectiveAvailable = minCapacity === Infinity ? 0 : Math.max(0, minCapacity);

    // Flag bottlenecks
    componentReports.forEach(c => {
        if (c.capacity === effectiveAvailable) {
            c.isBottleneck = true;
        }
    });

    const bottleneck = componentReports.find(c => c.isBottleneck && c.capacity === 0) ||
        componentReports.find(c => c.isBottleneck);

    let bottleneckReason = 'Disponible';
    if (effectiveAvailable === 0) {
        if (bottleneck) {
            if (bottleneck.reasonCode === 'store_mismatch') {
                bottleneckReason = `Stock registrado en otra sucursal (${bottleneck.name})`;
            } else if (bottleneck.reasonCode === 'inactive_item') {
                bottleneckReason = `Componente inactivo (${bottleneck.name})`;
            } else if (bottleneck.reasonCode === 'missing_item') {
                bottleneckReason = `Componente no registrado (${bottleneck.name})`;
            } else if (bottleneck.reasonCode === 'in_maintenance') {
                bottleneckReason = `${bottleneck.name} en taller/mantenimiento`;
            } else if (bottleneck.reasonCode === 'wheel_size_unavailable') {
                bottleneckReason = `Aro no disponible para ${bottleneck.name}`;
            } else if (bottleneck.reasonCode === 'reserved') {
                bottleneckReason = `${bottleneck.name}: sin disponibilidad para el horario consultado`;
            } else {
                bottleneckReason = `${bottleneck.name} sin stock disponible`;
            }
        } else {
            bottleneckReason = 'Sin disponibilidad para este horario';
        }
    }

    return {
        comboId,
        comboName: combo.name,
        available: effectiveAvailable,
        isAvailable: effectiveAvailable > 0,
        bottleneckReason,
        bottleneckComponentName: bottleneck?.name,
        components: componentReports,
    };
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
    const report = getComboAvailabilityDiagnostics(params);
    return report.available;
}
