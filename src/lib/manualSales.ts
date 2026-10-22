import {
    doc,
    runTransaction,
    type DocumentSnapshot,
    type Firestore,
} from 'firebase/firestore';

export type ManualSaleStatus = 'Pendiente' | 'Completado' | 'Cancelado';

export interface ManualSaleItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: string;
    image?: string;
    wheelSizeAllocations?: Array<{ size: string; quantity: number }>;
}

export interface ManualSale {
    id: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    items: ManualSaleItem[];
    total: number;
    status: ManualSaleStatus;
    paymentMethod: string;
    source: 'manual';
    store?: string;
    date: string;
}

interface SaleDraft {
    customerName: string;
    customerCI: string;
    paymentMethod: string;
    store?: string;
    items: Array<{ id: string; quantity: number }>;
}

interface WheelStock {
    size: string;
    stock: number;
    [key: string]: unknown;
}

interface InventoryData {
    name?: unknown;
    itemType?: unknown;
    active?: unknown;
    availableForSale?: unknown;
    salePrice?: unknown;
    imageUrl?: unknown;
    hasWheelSizes?: boolean;
    wheelSizes?: WheelStock[];
    stock?: unknown;
    [key: string]: unknown;
}

function validQuantity(quantity: number): boolean {
    return Number.isSafeInteger(quantity) && quantity > 0;
}

function allocateFromInventory(item: InventoryData, quantity: number) {
    if (item.hasWheelSizes && Array.isArray(item.wheelSizes)) {
        const wheelSizes = item.wheelSizes.map((entry) => ({ ...entry }));
        let remaining = quantity;
        const allocations: Array<{ size: string; quantity: number }> = [];
        const indices = wheelSizes.map((_: unknown, index: number) => index)
            .sort((left, right) => Number(wheelSizes[right].stock || 0) - Number(wheelSizes[left].stock || 0));
        for (const index of indices) {
            if (remaining <= 0) break;
            const size = wheelSizes[index];
            const stock = Number(size.stock || 0);
            const take = Math.min(remaining, stock);
            if (take > 0) {
                size.stock = stock - take;
                allocations.push({ size: String(size.size), quantity: take });
                remaining -= take;
            }
        }
        if (remaining > 0) throw new Error(`Stock insuficiente para ${String(item.name || 'el producto')}.`);
        return { updated: { wheelSizes }, allocations };
    }

    const stock = Number(item.stock || 0);
    if (!Number.isFinite(stock) || stock < quantity) {
        throw new Error(`Stock insuficiente para ${String(item.name || 'el producto')}.`);
    }
    return { updated: { stock: stock - quantity }, allocations: undefined };
}

function restoreToInventory(item: InventoryData, saleItem: ManualSaleItem): Record<string, unknown> {
    if (item.hasWheelSizes && Array.isArray(item.wheelSizes)) {
        const wheelSizes = item.wheelSizes.map((entry) => ({ ...entry }));
        const allocations = saleItem.wheelSizeAllocations;
        if (allocations?.length) {
            for (const allocation of allocations) {
                const target = wheelSizes.find((size) => String(size.size) === allocation.size);
                if (!target) throw new Error(`No se encuentra el aro ${allocation.size} para ${saleItem.name}; reversión detenida.`);
                target.stock = Number(target.stock || 0) + allocation.quantity;
            }
        } else {
            // Legacy sales did not persist a size; preserve the previous fallback for those records.
            let remaining = saleItem.quantity;
            const indices = wheelSizes.map((_: unknown, index: number) => index)
                .sort((left, right) => Number(wheelSizes[right].stock || 0) - Number(wheelSizes[left].stock || 0));
            for (const index of indices) {
                if (remaining <= 0) break;
                wheelSizes[index].stock = Number(wheelSizes[index].stock || 0) + remaining;
                remaining = 0;
            }
            if (remaining > 0) throw new Error(`No se pudo conciliar el aro de ${saleItem.name}.`);
        }
        return { wheelSizes };
    }
    return { stock: Number(item.stock || 0) + saleItem.quantity };
}

export async function createManualSale(db: Firestore, saleId: string, operatorUid: string, draft: SaleDraft): Promise<ManualSale> {
    if (!saleId || !draft.items.length || draft.items.some((item) => !item.id || !validQuantity(item.quantity))) {
        throw new Error('La venta no contiene productos o cantidades válidas.');
    }
    if (new Set(draft.items.map((item) => item.id)).size !== draft.items.length) {
        throw new Error('Un producto aparece más de una vez en el carrito.');
    }

    if (!operatorUid) throw new Error('Inicia sesión para registrar la venta.');
    const saleRef = doc(db, 'sales', saleId);
    const operationRef = doc(db, 'adminUsers', operatorUid, 'manualSaleOperations', saleId);
    return runTransaction(db, async (transaction) => {
        const operation = await transaction.get(operationRef);
        if (operation.exists()) {
            const existing = await transaction.get(saleRef);
            if (existing.exists()) return existing.data() as ManualSale;
            throw new Error('La operación de venta existe sin su registro; requiere revisión antes de reintentar.');
        }

        const itemSnapshots: DocumentSnapshot[] = [];
        for (const line of draft.items) itemSnapshots.push(await transaction.get(doc(db, 'inventory', line.id)));
        const date = new Date().toISOString();
        const items: ManualSaleItem[] = [];
        const updates: Array<{ id: string; data: Record<string, unknown> }> = [];

        draft.items.forEach((line, index) => {
            const snapshot = itemSnapshots[index];
            if (!snapshot.exists()) throw new Error('Uno de los productos ya no está disponible.');
            const inventory = snapshot.data() as InventoryData;
            const quantity = line.quantity;
            const price = Number(inventory.salePrice || 0);
            if (!inventory.active || !inventory.availableForSale || !Number.isFinite(price) || price < 0) {
                throw new Error(`${String(inventory.name || 'Un producto')} ya no está disponible para la venta.`);
            }
            const { updated, allocations } = allocateFromInventory(inventory, quantity);
            items.push({
                id: snapshot.id,
                name: String(inventory.name || 'Producto'),
                price,
                quantity,
                type: String(inventory.itemType || 'accessory'),
                ...(typeof inventory.imageUrl === 'string' ? { image: inventory.imageUrl } : {}),
                ...(allocations ? { wheelSizeAllocations: allocations } : {}),
            });
            updates.push({ id: snapshot.id, data: updated });
        });

        const sale: ManualSale = {
            id: saleId,
            customerName: draft.customerName.trim() || 'Cliente General',
            customerPhone: 'N/A',
            customerCI: draft.customerCI.trim() || 'N/A',
            items,
            total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            status: 'Completado',
            paymentMethod: draft.paymentMethod,
            source: 'manual',
            ...(draft.store ? { store: draft.store } : {}),
            date,
        };

        transaction.set(saleRef, sale);
        for (const update of updates) transaction.update(doc(db, 'inventory', update.id), update.data);
        transaction.set(operationRef, { saleId, createdAt: date });
        return sale;
    });
}

export async function transitionManualSaleStatus(
    db: Firestore,
    saleId: string,
    nextStatus: ManualSaleStatus,
): Promise<ManualSale> {
    const saleRef = doc(db, 'sales', saleId);
    return runTransaction(db, async (transaction) => {
        const saleSnapshot = await transaction.get(saleRef);
        if (!saleSnapshot.exists()) throw new Error('No se encontró la venta.');
        const sale = saleSnapshot.data() as ManualSale;
        if (sale.status === nextStatus) return sale;

        const completedBefore = sale.status === 'Completado';
        const completedAfter = nextStatus === 'Completado';
        const itemSnapshots: DocumentSnapshot[] = [];
        if (completedBefore !== completedAfter) {
            for (const item of sale.items || []) {
                if (!item.id || !validQuantity(item.quantity)) throw new Error('La venta tiene un artículo sin datos suficientes para actualizar stock.');
                itemSnapshots.push(await transaction.get(doc(db, 'inventory', item.id)));
            }
        }

        let updatedItems = sale.items || [];
        if (completedBefore !== completedAfter) {
            const updates: Array<{ id: string; data: Record<string, unknown> }> = [];
            updatedItems = updatedItems.map((saleItem, index) => {
                const snapshot = itemSnapshots[index];
                if (!snapshot.exists()) throw new Error(`No se encuentra inventario para ${saleItem.name}; cambio de estado detenido.`);
                const inventory = snapshot.data() as InventoryData;
                if (completedAfter) {
                    const { updated, allocations } = allocateFromInventory(inventory, saleItem.quantity);
                    updates.push({ id: snapshot.id, data: updated });
                    const saleItemWithoutAllocations = { ...saleItem };
                    delete saleItemWithoutAllocations.wheelSizeAllocations;
                    return allocations
                        ? { ...saleItemWithoutAllocations, wheelSizeAllocations: allocations }
                        : saleItemWithoutAllocations;
                }
                updates.push({ id: snapshot.id, data: restoreToInventory(inventory, saleItem) });
                return saleItem;
            });
            for (const update of updates) transaction.update(doc(db, 'inventory', update.id), update.data);
        }

        const nextSale = { ...sale, status: nextStatus, items: updatedItems };
        transaction.update(saleRef, nextSale);
        return nextSale;
    });
}
