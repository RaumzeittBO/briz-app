export interface RentalAddonItem {
    id: string;
    active: boolean;
    itemType: 'bike' | 'accessory';
    availableForRental: boolean;
    availableAsRentalAddon?: boolean;
    excludeFromRentalAddons?: boolean;
    rentalAddonFree?: boolean;
    addonFlatPrice?: number;
    price1Hour?: number;
    price2Hours?: number;
    price3Hours?: number;
    price4Hours?: number;
    price8Hours?: number;
    price24Hours?: number;
    price1Week?: number;
    price1Month?: number;
    pricePerHour?: number;
    priceFrom5thHour?: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
}

export interface RentalAddonCombo {
    active: boolean;
    availableForRental: boolean;
    components: Array<{ inventoryItemId: string }>;
}

/** Mirrors the server rule and is parity-tested against the Functions helper. */
export function isEligibleRentalAddon(item: RentalAddonItem, combos: RentalAddonCombo[] = []): boolean {
    if (item.active !== true || item.itemType !== 'accessory' || item.excludeFromRentalAddons === true) return false;
    if (item.availableForRental === true || item.availableAsRentalAddon === true) return true;
    return combos.some(combo => combo.active === true && combo.availableForRental === true
        && combo.components.some(component => component.inventoryItemId === item.id));
}

export function hasConfiguredRentalAddonPrice(item: RentalAddonItem): boolean {
    if (item.rentalAddonFree === true) return true;
    return [item.addonFlatPrice, item.price1Hour, item.price2Hours, item.price3Hours, item.price4Hours,
        item.price8Hours, item.price24Hours, item.price1Week, item.price1Month, item.pricePerHour,
        item.priceFrom5thHour, item.pricePerDay, item.pricePerWeek, item.pricePerMonth]
        .some(value => Number.isFinite(Number(value)) && Number(value) > 0);
}
