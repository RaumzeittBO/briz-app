import type { ComboProduct, InventoryItem } from '@/context/StoreContext';

export interface PricingSource {
    id?: string;
    itemType?: 'bike' | 'accessory';
    name?: string;
    category?: string;
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
    rentalAddonFree?: boolean;
    individualRentalPrice?: number;
    addonPricingMode?: 'flat' | 'hourly';
}

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

export const DEFAULT_INDIVIDUAL_ACCESSORY_PRICE = 20;

export interface AccessoryPricingContext {
    modality?: 'individual' | 'addon';
    isUrbanBike?: boolean;
    comboHasBasket?: boolean;
}

/**
 * Checks if the requested duration is allowed for individual accessory rental.
 * Individual accessory rentals are strictly capped at 24 hours (1 to 24 hours)
 * and reject weekly ("semana", "week") and monthly ("mes", "month") rentals.
 */
export function isAccessoryDurationAllowedForIndividual(duration: string | number): boolean {
    const d = (typeof duration === 'number' ? `${duration} horas` : duration || '').toLowerCase().trim();
    if (!d) return true;
    if (d.includes('mes') || d.includes('month') || d.includes('semana') || d.includes('week')) {
        return false;
    }
    const hours = parseDurationToHours(duration);
    return hours <= 24;
}

/**
 * Calculates individual accessory rental price (rented without a bike or as an independent line).
 * Rule: Flat rate of Bs 20 per accessory from 1 hour to 24 hours.
 * Rejects weekly and monthly rentals.
 */
export function calculateIndividualAccessoryPrice(
    pricing: PricingSource | InventoryItem,
    duration: string | number,
    quantity: number = 1
): number {
    const safeQty = Math.max(0, Number.isFinite(quantity) ? Math.floor(quantity) : 0);
    if (safeQty === 0) return 0;
    if (!isAccessoryDurationAllowedForIndividual(duration)) {
        throw new Error('El alquiler individual de accesorios no admite modalidad semanal ni mensual (máximo 24 horas).');
    }
    const configuredPrice = typeof pricing.individualRentalPrice === 'number' && pricing.individualRentalPrice > 0
        ? pricing.individualRentalPrice
        : DEFAULT_INDIVIDUAL_ACCESSORY_PRICE;
    return configuredPrice * safeQty;
}

/**
 * Returns the effective unit price for an accessory added as an extra in a rental (complement with bike).
 * Respects admin-configured prices, addonPricingMode, urban basket special rates and basket deduplication.
 */
export function getAccessoryAddonUnitPrice(
    item: InventoryItem | PricingSource,
    duration: string = '1 Hora',
    context?: AccessoryPricingContext
): number | null {
    if (item.rentalAddonFree === true) return 0;

    const isBasket = Boolean(
        item.id?.includes('canasta') ||
        item.category?.toLowerCase().includes('canasta') ||
        (item as { name?: string }).name?.toLowerCase().includes('canasta')
    );

    // Basket deduplication: if the combo already includes a basket, do not double-charge
    if (isBasket && context?.comboHasBasket) {
        return 0;
    }

    // Special rate for basket when paired with an urban bike: Bs 5 per hour
    if (isBasket && context?.isUrbanBike) {
        const hours = Math.min(24, Math.max(1, parseDurationToHours(duration)));
        const hourlyRate = typeof item.pricePerHour === 'number' && item.pricePerHour > 0 ? item.pricePerHour : 5;
        return hourlyRate * hours;
    }

    // Explicit pricing mode: hourly
    if (item.addonPricingMode === 'hourly') {
        const hours = parseDurationToHours(duration);
        const hourlyRate = typeof item.pricePerHour === 'number' && item.pricePerHour > 0
            ? item.pricePerHour
            : (typeof item.addonFlatPrice === 'number' && item.addonFlatPrice > 0 ? item.addonFlatPrice : 5);
        return hourlyRate * Math.max(1, hours);
    }

    // Explicit custom flat supplement configured by admin
    const customFlat = item.addonFlatPrice;
    if (typeof customFlat === 'number' && customFlat > 0) {
        return customFlat;
    }

    // Default known add-on supplements when not explicitly configured
    if (item.id === 'acc_casco_adulto' || item.id === 'acc_casco_nino' || item.id === 'acc_portacelular' || item.id === 'acc_linterna_bocina' || item.id === 'acc_candado_seguridad') {
        return 10;
    }
    if (isBasket) {
        const hours = Math.min(24, Math.max(1, parseDurationToHours(duration)));
        return 5 * hours;
    }

    // Fall back to tiered pricing
    const calc = calculateProductRentalPrice(item, duration, 1, { modality: 'addon', ...context });
    return calc > 0 ? calc : null;
}

/**
 * Calculates add-on complement price for an accessory line.
 */
export function calculateAccessoryAddonPrice(
    item: InventoryItem | PricingSource,
    duration: string,
    quantity: number = 1,
    context?: AccessoryPricingContext
): number {
    const safeQty = Math.max(0, Number.isFinite(quantity) ? Math.floor(quantity) : 0);
    if (safeQty === 0) return 0;
    const unitPrice = getAccessoryAddonUnitPrice(item, duration, context);
    if (unitPrice === null) {
        throw new Error(`El accesorio ${(item as { name?: string }).name || item.id} no tiene una tarifa de complemento configurada.`);
    }
    return unitPrice * safeQty;
}

/**
 * Centralized, bilingual, NaN-safe rental price calculator used by both
 * public checkout (`RentalCheckoutWizard`), `StoreContext.calculatePrice`, and `AdminRentalsPage`.
 *
 * Commercial rules:
 * 1. For individual accessories (modality: 'individual' or standalone): flat rate of Bs 20 up to 24h, weekly/monthly rejected.
 * 2. Uses explicit tier fields (`price1Hour`, `price2Hours`, `price3Hours`, `price4Hours`, `price8Hours`, `price24Hours`, `price1Week`, `price1Month`) when > 0.
 * 3. Commercial 5th-hour rule: for hourly durations from 5h up to 24h, caps/matches the 24-Hour (Full Day) rate.
 * 4. Multi-day (`N Días`): `days * fullDayRate` (or `price1Week` when 7 days and `price1Week > 0`).
 */
export function calculateProductRentalPrice(
    pricing: PricingSource | InventoryItem | ComboProduct | undefined | null,
    duration: string,
    quantity: number = 1,
    context?: AccessoryPricingContext
): number {
    if (!pricing) return 0;
    const safeQty = Math.max(0, Number.isFinite(quantity) ? Math.floor(quantity) : 0);
    if (safeQty === 0) return 0;

    if ('itemType' in pricing && pricing.itemType === 'accessory') {
        if (pricing.rentalAddonFree === true) return 0;
        if (context?.modality === 'addon') {
            const customFlat = Number(pricing.addonFlatPrice || 0);
            if (customFlat > 0) return customFlat * safeQty;
        } else {
            // Standalone / individual rental
            return calculateIndividualAccessoryPrice(pricing, duration, safeQty);
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
