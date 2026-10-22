export interface CatalogItem {
    id: string;
    itemType?: 'bike' | 'accessory';
    name: string;
    active: boolean;
    availableForRental: boolean;
    hasWheelSizes?: boolean;
    wheelSizes?: Array<{ size: string; stock: number; maintenanceStock?: number }>;
    stock?: number;
    maintenanceStock?: number;
    pricePerHour?: number;
    priceFrom5thHour?: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
    price1Hour?: number;
    price2Hours?: number;
    price3Hours?: number;
    price4Hours?: number;
    price8Hours?: number;
    price24Hours?: number;
    price1Week?: number;
    price1Month?: number;
    addonFlatPrice?: number;
    store?: string;
}

export interface Combo {
    id: string;
    name: string;
    active: boolean;
    availableForRental: boolean;
    components: Array<{ inventoryItemId: string; quantity: number; requiresWheelSize: boolean }>;
    pricePerHour?: number;
    priceFrom5thHour?: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
    price1Hour?: number;
    price2Hours?: number;
    price3Hours?: number;
    price4Hours?: number;
    price8Hours?: number;
    price24Hours?: number;
    price1Week?: number;
    price1Month?: number;
    store?: string;
}

export interface Demand {
    itemId: string;
    wheelSize?: string;
    quantity: number;
}

export interface RentalLike {
    productType: 'single' | 'combo';
    productId: string;
    quantity: number;
    selectedWheelSize?: string;
    componentSelections?: Array<{ inventoryItemId: string; wheelSize?: string }>;
    selectedAccessories?: Array<{ itemId: string; quantity: number }>;
    status: string;
    date: string;
    pickupTime?: string;
    endTime?: string;
    duration: string | number;
    startTimestamp?: number;
    endTimestamp?: number;
}

export interface RentalWindow {
    startMs: number;
    endMs: number;
}

export function parseDurationHours(duration: string | number): number {
    if (typeof duration === 'number') return Math.max(1, duration);
    const value = duration.toLowerCase().trim();
    const count = Math.max(1, Number(value.match(/\d+/)?.[0] || 1));
    if (value.includes('month') || value.includes('mes')) return count * 720;
    if (value.includes('week') || value.includes('semana')) return count * 168;
    if (value.includes('medio día') || value.includes('medio dia') || value.includes('half day')) return 4;
    if (value.includes('24 hora') || value.includes('24 hour') || value.includes('full day') || value.includes('día completo') || value.includes('dia completo')) return 24;
    if (value.includes('day') || value.includes('día') || value.includes('dia')) return count * 24;
    return count;
}

export function calculatePrice(pricing: CatalogItem | Combo | undefined, duration: string, quantity: number): number {
    if (!pricing || !Number.isInteger(quantity) || quantity < 1) return 0;
    const pHr = Math.max(0, Number(pricing.pricePerHour || 0));
    const pFrom5th = Math.max(0, Number(pricing.priceFrom5thHour || 0));
    const pDay = Math.max(0, Number(pricing.pricePerDay || 0));
    const pWeek = Math.max(0, Number(pricing.price1Week || pricing.pricePerWeek || 0));
    const pMonth = Math.max(0, Number(pricing.price1Month || pricing.pricePerMonth || 0));
    const p1 = Math.max(0, Number(pricing.price1Hour || 0)) || pHr;
    const p2 = Math.max(0, Number(pricing.price2Hours || 0)) || 2 * pHr;
    const p3 = Math.max(0, Number(pricing.price3Hours || 0)) || 3 * pHr;
    const p4 = Math.max(0, Number(pricing.price4Hours || 0)) || 4 * pHr;
    const p24 = Math.max(0, Number(pricing.price24Hours || 0)) || pDay || p4 + 4 * pFrom5th || p1 * 5;
    const p8 = Math.max(0, Number(pricing.price8Hours || 0)) || p24;
    const normalized = duration.toLowerCase().trim();
    const count = Math.max(1, Number(normalized.match(/\d+/)?.[0] || 1));
    let unit = 0;
    if (normalized.includes('month') || normalized.includes('mes')) unit = (pMonth || p24 * 30) * count;
    else if (normalized.includes('week') || normalized.includes('semana')) unit = (pWeek || p24 * 7) * count;
    else if (normalized.includes('24 hora') || normalized.includes('24 hour') || normalized.includes('full day') || normalized.includes('día completo') || normalized.includes('dia completo')) unit = p24;
    else if (normalized.includes('medio día') || normalized.includes('medio dia') || normalized.includes('half day')) unit = p4;
    else if (normalized.includes('day') || normalized.includes('día') || normalized.includes('dia')) unit = count === 7 && pWeek ? pWeek : count === 30 && pMonth ? pMonth : p24 * count;
    else if (count === 1) unit = p1;
    else if (count === 2) unit = p2;
    else if (count === 3) unit = p3;
    else if (count === 4) unit = p4;
    else if (count === 8) unit = p8;
    else if (count <= 24) unit = p24;
    else unit = p24 * Math.ceil(count / 24);
    return Number.isFinite(unit) && unit >= 0 ? unit * quantity : 0;
}

export const DEFAULT_ACCESSORY_PRICES: Record<string, number> = {
    acc_casco_adulto: 0,
    acc_casco_nino: 0,
    acc_portacelular: 0,
    acc_linterna_bocina: 10,
    acc_candado_seguridad: 10,
    acc_chaleco_seguridad: 10,
    acc_remolque_mascotas: 40,
    acc_canasta_plastica: 15,
    acc_canasta_metalica: 15,
    acc_silla_bebe: 25,
    acc_parrilla: 15,
};

export function accessoryUnitPrice(item: CatalogItem, duration: string): number {
    if (typeof item.addonFlatPrice === 'number' && item.addonFlatPrice > 0) return item.addonFlatPrice;
    const configured = [item.price1Hour, item.price24Hours, item.pricePerHour, item.pricePerDay].some(value => Number(value || 0) > 0);
    if (configured) return calculatePrice(item, duration, 1);
    return DEFAULT_ACCESSORY_PRICES[item.id] ?? Math.max(0, item.pricePerDay || item.pricePerHour || 0);
}

export function parseDateTime(date: string, time: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new Error('Fecha u hora inválida.');
    }
    const timestamp = Date.parse(`${date}T${time}:00-04:00`);
    if (!Number.isFinite(timestamp)) throw new Error('Fecha u hora inválida.');
    return timestamp;
}

export function getRentalWindow(rental: RentalLike): RentalWindow {
    if (typeof rental.startTimestamp === 'number' && typeof rental.endTimestamp === 'number') {
        return { startMs: rental.startTimestamp, endMs: rental.endTimestamp };
    }
    const startMs = parseDateTime(rental.date, rental.pickupTime || '09:00');
    let endMs = startMs + parseDurationHours(rental.duration) * 3_600_000;
    if (rental.endTime && parseDurationHours(rental.duration) < 24) {
        const candidate = parseDateTime(rental.date, rental.endTime);
        if (candidate > startMs) endMs = candidate;
    }
    return { startMs, endMs };
}

export function rentalDemands(rental: Pick<RentalLike, 'productType' | 'productId' | 'quantity' | 'selectedWheelSize' | 'componentSelections' | 'selectedAccessories'>, inventory: CatalogItem[], combos: Combo[]): Demand[] {
    if (rental.productId.startsWith('srv_')) return [];
    const qty = Math.floor(Number(rental.quantity));
    if (!Number.isFinite(qty) || qty <= 0) return [];
    const result: Demand[] = [];
    if (rental.productType === 'single') {
        const item = inventory.find(candidate => candidate.id === rental.productId);
        const wheelSize = item?.hasWheelSizes ? rental.selectedWheelSize || item.wheelSizes?.[0]?.size : undefined;
        result.push({ itemId: rental.productId, ...(wheelSize ? { wheelSize } : {}), quantity: qty });
    } else {
        const combo = combos.find(candidate => candidate.id === rental.productId);
        if (!combo) return [];
        for (const component of combo.components) {
            const item = inventory.find(candidate => candidate.id === component.inventoryItemId);
            if (!item) continue;
            const selected = rental.componentSelections?.find(candidate => candidate.inventoryItemId === component.inventoryItemId)?.wheelSize;
            const wheelSize = item.hasWheelSizes
                ? selected || (combo.components.length === 1 ? rental.selectedWheelSize : undefined) || item.wheelSizes?.[0]?.size
                : undefined;
            result.push({ itemId: item.id, ...(wheelSize ? { wheelSize } : {}), quantity: component.quantity * qty });
        }
    }
    for (const accessory of rental.selectedAccessories || []) {
        if (accessory.quantity > 0) result.push({ itemId: accessory.itemId, quantity: accessory.quantity });
    }
    return aggregateDemands(result);
}

export function aggregateDemands(demands: Demand[]): Demand[] {
    const aggregated = new Map<string, Demand>();
    for (const demand of demands) {
        const key = `${demand.itemId}:${demand.wheelSize || ''}`;
        const prior = aggregated.get(key);
        if (prior) prior.quantity += demand.quantity;
        else aggregated.set(key, { ...demand });
    }
    return [...aggregated.values()];
}

export function isHolding(status: string): boolean {
    return ['confirmed', 'Confirmado', 'delivered', 'Entregado'].includes(status);
}

export function isBlocking(status: string): boolean {
    return isHolding(status) || ['pending', 'Pendiente'].includes(status);
}

export function isInsideDeliveryZone(lat: number, lng: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -17.413 && lat <= -17.345
        && lng >= -66.182 && lng <= -66.071;
}

export function shippingFee(bikes: number): number {
    if (bikes <= 0) return 0;
    if (bikes === 1) return 30;
    if (bikes === 2) return 45;
    if (bikes === 3) return 55;
    if (bikes === 4) return 65;
    return 65 + (bikes - 4) * 10;
}
