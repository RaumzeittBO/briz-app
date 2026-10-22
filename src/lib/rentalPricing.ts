import type { ComboProduct, InventoryItem } from '@/context/StoreContext';

export interface PricingSource {
    id?: string;
    itemType?: 'bike' | 'accessory';
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
}

/**
 * Default commercial rental addon rates (Bs.) for accessories when their database tier fields are 0.
 * Admins can override any accessory price from InventoryPage by setting pricePerDay / price1Hour / addonFlatPrice > 0.
 */
export const DEFAULT_ACCESSORY_RENTAL_PRICES: Record<string, number> = {
    acc_casco_adulto: 0,      // Included free with rental
    acc_casco_nino: 0,        // Included free with rental
    acc_portacelular: 0,      // Included free with rental
    acc_linterna_bocina: 10,  // 10 Bs
    acc_candado_seguridad: 10,// 10 Bs
    acc_chaleco_seguridad: 10,// 10 Bs
    acc_remolque_mascotas: 40,// 40 Bs
    acc_canasta_plastica: 15,
    acc_canasta_metalica: 15,
    acc_silla_bebe: 25,
    acc_parrilla: 15,
};

/**
 * Parses a human-readable duration string (in Spanish or English) into hours.
 * Examples:
 * - "1 Hora" / "1 Hour" -> 1
 * - "4 Horas (Medio Día)" -> 4
 * - "24 Horas (Full Day)" / "1 Día" -> 24
 * - "3 Días" / "3 Days" -> 72
 * - "1 Semana" / "1 Week" -> 168
 * - "1 Mes" / "1 Month" -> 720
 */
export function parseDurationToHours(duration: string | number): number {
    if (typeof duration === 'number') {
        return Math.max(1, duration);
    }
    const d = (duration || '').toLowerCase().trim();
    if (!d) return 1;

    if (d.includes('mes') || d.includes('month')) {
        const mMatch = d.match(/(\d+)/);
        const months = mMatch ? Math.max(1, parseInt(mMatch[1], 10)) : 1;
        return months * 24 * 30;
    }
    if (d.includes('semana') || d.includes('week')) {
        const wMatch = d.match(/(\d+)/);
        const weeks = wMatch ? Math.max(1, parseInt(wMatch[1], 10)) : 1;
        return weeks * 24 * 7;
    }
    if (d.includes('24 hora') || d.includes('24 hour') || d.includes('full day') || d.includes('día completo') || d.includes('dia completo')) {
        return 24;
    }
    if (d.includes('medio día') || d.includes('medio dia') || d.includes('half day')) {
        return 4;
    }
    if (d.includes('día') || d.includes('dia') || d.includes('day')) {
        const dayMatch = d.match(/(\d+)/);
        const days = dayMatch ? Math.max(1, parseInt(dayMatch[1], 10)) : 1;
        return days * 24;
    }
    const hrMatch = d.match(/(\d+)/);
    if (hrMatch) {
        return Math.max(1, parseInt(hrMatch[1], 10));
    }
    return 1;
}

/**
 * Returns the effective unit price for an accessory added as an extra in a rental.
 * Respects admin-configured prices first, falling back to DEFAULT_ACCESSORY_RENTAL_PRICES.
 */
export function getAccessoryAddonUnitPrice(item: InventoryItem, duration: string = '1 Hora'): number {
    const customFlat = (item as PricingSource).addonFlatPrice;
    if (typeof customFlat === 'number' && customFlat > 0) {
        return customFlat;
    }
    const hasConfiguredTier =
        (item.price1Hour ?? 0) > 0 ||
        (item.price24Hours ?? 0) > 0 ||
        (item.pricePerHour ?? 0) > 0 ||
        (item.pricePerDay ?? 0) > 0;

    if (hasConfiguredTier) {
        const calc = calculateProductRentalPrice(item, duration, 1);
        if (calc > 0) return calc;
    }
    if (item.id in DEFAULT_ACCESSORY_RENTAL_PRICES) {
        return DEFAULT_ACCESSORY_RENTAL_PRICES[item.id];
    }
    return Math.max(0, item.pricePerDay || item.pricePerHour || 0);
}

/**
 * Centralized, bilingual, NaN-safe rental price calculator used by both
 * public checkout (`RentalCheckoutWizard`), `StoreContext.calculatePrice`, and `AdminRentalsPage`.
 *
 * Commercial rules:
 * 1. Uses explicit tier fields (`price1Hour`, `price2Hours`, `price3Hours`, `price4Hours`, `price8Hours`, `price24Hours`, `price1Week`, `price1Month`) when > 0.
 * 2. Commercial 5th-hour rule: for hourly durations from 5h up to 24h, if a specific tier (like 8h) is not set or if 5-24h is selected, caps/matches the 24-Hour (Full Day) rate when `price24Hours` / `pricePerDay` is configured, unless `price8Hours` is specifically requested and configured.
 * 3. Multi-day (`N Días`): `days * fullDayRate` (or `price1Week` when 7 days and `price1Week > 0`).
 */
export function calculateProductRentalPrice(
    pricing: PricingSource | InventoryItem | ComboProduct | undefined | null,
    duration: string,
    quantity: number = 1
): number {
    if (!pricing) return 0;
    const safeQty = Math.max(0, Number.isFinite(quantity) ? Math.floor(quantity) : 0);
    if (safeQty === 0) return 0;

    if ('itemType' in pricing && pricing.itemType === 'accessory') {
        const customFlat = Number(pricing.addonFlatPrice || 0);
        if (customFlat > 0) return customFlat * safeQty;
        const p1hCheck = Number(pricing.price1Hour || 0);
        const p24hCheck = Number(pricing.price24Hours || 0);
        const pHrCheck = Number(pricing.pricePerHour || 0);
        const pDayCheck = Number(pricing.pricePerDay || 0);
        if (p1hCheck === 0 && p24hCheck === 0 && pHrCheck === 0 && pDayCheck === 0 && pricing.id && pricing.id in DEFAULT_ACCESSORY_RENTAL_PRICES) {
            return DEFAULT_ACCESSORY_RENTAL_PRICES[pricing.id] * safeQty;
        }
    }

    const pHr = Math.max(0, Number(pricing.pricePerHour || 0));
    const pFrom5th = Math.max(0, Number(pricing.priceFrom5thHour || 0));
    const pDay = Math.max(0, Number(pricing.pricePerDay || 0));
    const pWeek = Math.max(0, Number(pricing.price1Week || pricing.pricePerWeek || 0));
    const pMonth = Math.max(0, Number(pricing.price1Month || pricing.pricePerMonth || 0));

    const p1h = Math.max(0, Number(pricing.price1Hour || 0)) || pHr;
    const p2h = Math.max(0, Number(pricing.price2Hours || 0)) || (pHr * 2);
    const p3h = Math.max(0, Number(pricing.price3Hours || 0)) || (pHr * 3);
    const p4h = Math.max(0, Number(pricing.price4Hours || 0)) || (pHr * 4);
    const p24h = Math.max(0, Number(pricing.price24Hours || 0)) || pDay || (p4h + 4 * pFrom5th) || (p1h * 5);
    const p8h = Math.max(0, Number(pricing.price8Hours || 0)) || p24h;

    const d = (duration || '').toLowerCase().trim();
    let unitPrice = 0;

    // 1. Month
    if (d.includes('mes') || d.includes('month')) {
        const match = d.match(/(\d+)/);
        const months = match ? Math.max(1, parseInt(match[1], 10)) : 1;
        const monthRate = pMonth > 0 ? pMonth : p24h * 30;
        unitPrice = monthRate * months;
    }
    // 2. Week
    else if (d.includes('semana') || d.includes('week')) {
        const match = d.match(/(\d+)/);
        const weeks = match ? Math.max(1, parseInt(match[1], 10)) : 1;
        const weekRate = pWeek > 0 ? pWeek : p24h * 7;
        unitPrice = weekRate * weeks;
    }
    // 3. Explicit Full Day / 24 Horas
    else if (
        d.includes('24 hora') ||
        d.includes('24 hour') ||
        d.includes('full day') ||
        d.includes('día completo') ||
        d.includes('dia completo') ||
        d.includes('dÃ­a completo')
    ) {
        unitPrice = p24h;
    }
    // 4. Explicit Half Day / 4 Horas
    else if (
        d.includes('medio día') ||
        d.includes('medio dia') ||
        d.includes('medio dÃ­a') ||
        d.includes('half day')
    ) {
        unitPrice = p4h;
    }
    // 5. Multi-day ("1 Día", "2 Días", "3 Days", etc.)
    else if (
        d.includes('día') ||
        d.includes('dia') ||
        d.includes('dÃ­a') ||
        d.includes('day')
    ) {
        const match = d.match(/(\d+)/);
        const days = match ? Math.max(1, parseInt(match[1], 10)) : 1;
        if (days === 7 && pWeek > 0) {
            unitPrice = pWeek;
        } else if (days === 30 && pMonth > 0) {
            unitPrice = pMonth;
        } else {
            unitPrice = p24h * days;
        }
    }
    // 6. Hourly ("1 Hora", "2 Horas", "5 Horas", "8 Hours", etc.)
    else {
        const match = d.match(/(\d+)/);
        const hrs = match ? Math.max(1, parseInt(match[1], 10)) : 1;
        if (hrs === 1) unitPrice = p1h;
        else if (hrs === 2) unitPrice = p2h;
        else if (hrs === 3) unitPrice = p3h;
        else if (hrs === 4) unitPrice = p4h;
        else if (hrs === 8) unitPrice = p8h;
        else if (hrs >= 5 && hrs <= 24) {
            // Commercial rule: from 5th hour up to 24h equals Full Day rate (p24h)
            unitPrice = p24h;
        } else {
            // > 24 hours expressed in hours
            const fullDays = Math.ceil(hrs / 24);
            unitPrice = p24h * fullDays;
        }
    }

    const total = unitPrice * safeQty;
    return Number.isFinite(total) && total >= 0 ? total : 0;
}
