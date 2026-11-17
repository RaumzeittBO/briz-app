import type { InventoryItem } from '@/context/StoreContext';

export type ComboComponentLinkResult = { valid: true } | { valid: false; reason: string };

/** Validates an explicit manual component relink without mutating inventory or the combo. */
export function validateComboComponentLink(
    sourceComponentId: string,
    candidate: InventoryItem | undefined,
    comboStore?: string,
): ComboComponentLinkResult {
    if (!candidate || !candidate.id || !candidate.active || !['bike', 'accessory'].includes(candidate.itemType)) {
        return { valid: false, reason: 'Selecciona un producto existente y activo.' };
    }

    const sourceId = sourceComponentId.toLowerCase();
    const expectedType = sourceId.startsWith('bike_') ? 'bike' : sourceId.startsWith('acc_') ? 'accessory' : undefined;
    if (expectedType && candidate.itemType !== expectedType) {
        return { valid: false, reason: `El producto seleccionado no coincide con el tipo esperado (${expectedType}).` };
    }

    const targetStore = comboStore || 'all';
    if (targetStore !== 'all' && candidate.store && candidate.store !== 'all' && candidate.store !== targetStore) {
        return { valid: false, reason: 'El producto seleccionado pertenece a otra sucursal.' };
    }

    const hasStock = candidate.hasWheelSizes
        ? (candidate.wheelSizes || []).some(wheel => Number(wheel.stock) > 0)
        : Number(candidate.stock || 0) > 0;
    if (!hasStock) return { valid: false, reason: 'El producto seleccionado no tiene stock físico disponible.' };

    return { valid: true };
}
