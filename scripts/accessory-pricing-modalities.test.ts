import assert from 'node:assert/strict';
import {
    calculateIndividualAccessoryPrice as serverIndividualPrice,
    calculateAccessoryAddonPrice as serverAddonPrice,
    accessoryUnitPrice as serverAccessoryUnitPrice,
    isAccessoryDurationAllowedForIndividual as serverDurationAllowed,
    CatalogItem,
} from '../functions/src/domain';
import {
    calculateIndividualAccessoryPrice as clientIndividualPrice,
    calculateAccessoryAddonPrice as clientAddonPrice,
    getAccessoryAddonUnitPrice as clientAccessoryUnitPrice,
    isAccessoryDurationAllowedForIndividual as clientDurationAllowed,
    PricingSource,
} from '../src/lib/rentalPricing';

// 1. INDIVIDUAL ACCESSORY RENTAL (Standalone)
const standardHelmet: CatalogItem = {
    id: 'acc_casco_adulto',
    name: 'Casco adulto',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
};

const customPricedItem: CatalogItem = {
    id: 'acc_trailer',
    name: 'Remolque especial',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
    individualRentalPrice: 25,
};

// Durations from 1h to 24h must charge flat Bs 20
const hourlyDurations = ['1 hora', '2 horas', '3 horas', '4 horas (medio día)', '8 horas', '24 horas (full day)'];
for (const dur of hourlyDurations) {
    assert.equal(clientDurationAllowed(dur), true, `Client allows ${dur}`);
    assert.equal(serverDurationAllowed(dur), true, `Server allows ${dur}`);

    // Qty 1 -> 20 Bs
    assert.equal(clientIndividualPrice(standardHelmet as PricingSource, dur, 1), 20);
    assert.equal(serverIndividualPrice(standardHelmet, dur, 1), 20);

    // Qty 3 -> 60 Bs
    assert.equal(clientIndividualPrice(standardHelmet as PricingSource, dur, 3), 60);
    assert.equal(serverIndividualPrice(standardHelmet, dur, 3), 60);

    // Custom individual price 25 Bs
    assert.equal(clientIndividualPrice(customPricedItem as PricingSource, dur, 1), 25);
    assert.equal(serverIndividualPrice(customPricedItem, dur, 1), 25);
}

// Weekly and monthly durations MUST be rejected for individual rentals
const invalidIndividualDurations = ['1 semana', '2 semanas', '1 mes', '2 meses', '7 días', '30 días'];
for (const dur of invalidIndividualDurations) {
    assert.equal(clientDurationAllowed(dur), false, `Client rejects ${dur}`);
    assert.equal(serverDurationAllowed(dur), false, `Server rejects ${dur}`);

    assert.throws(
        () => clientIndividualPrice(standardHelmet as PricingSource, dur, 1),
        /no admite modalidad semanal ni mensual/i,
        `Client throws on ${dur}`
    );
    assert.throws(
        () => serverIndividualPrice(standardHelmet, dur, 1),
        /no admite modalidad semanal ni mensual/i,
        `Server throws on ${dur}`
    );
}

// 2. ACCESSORY COMPLEMENT WITH BIKE (Add-on)
const phoneHolder: CatalogItem = {
    id: 'acc_portacelular',
    name: 'Portacelular',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
};
const lights: CatalogItem = {
    id: 'acc_linterna_bocina',
    name: 'Linterna delantera + bocina',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
};
const lock: CatalogItem = {
    id: 'acc_candado_seguridad',
    name: 'Candado de seguridad',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
};
const freeItem: CatalogItem = {
    id: 'acc_free_band',
    name: 'Cinta reflectiva',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
    rentalAddonFree: true,
};
const customHourlyAddon: CatalogItem = {
    id: 'acc_custom_tool',
    name: 'Herramienta pro',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
    addonPricingMode: 'hourly',
    pricePerHour: 8,
};

// Default add-on supplements: Casco 10, Portacelular 10, Luces 10, Candado 10
assert.equal(clientAccessoryUnitPrice(standardHelmet as PricingSource, '4 horas'), 10);
assert.equal(serverAccessoryUnitPrice(standardHelmet, '4 horas'), 10);

assert.equal(clientAddonPrice(phoneHolder as PricingSource, '4 horas', 2), 20);
assert.equal(serverAddonPrice(phoneHolder, '4 horas', 2), 20);

assert.equal(clientAddonPrice(lights as PricingSource, '24 horas', 1), 10);
assert.equal(serverAddonPrice(lights, '24 horas', 1), 10);

assert.equal(clientAddonPrice(lock as PricingSource, '1 semana', 1), 10);
assert.equal(serverAddonPrice(lock, '1 semana', 1), 10);

// Free addon
assert.equal(clientAccessoryUnitPrice(freeItem as PricingSource, '1 hora'), 0);
assert.equal(serverAccessoryUnitPrice(freeItem, '1 hora'), 0);

// Hourly addon mode: 8 Bs/h * 3h = 24 Bs
assert.equal(clientAddonPrice(customHourlyAddon as PricingSource, '3 horas', 1), 24);
assert.equal(serverAddonPrice(customHourlyAddon, '3 horas', 1), 24);

// 3. CANASTA SPECIAL RATE & DEDUPLICATION
const metalBasket: CatalogItem = {
    id: 'acc_canasta_metalica',
    name: 'Canasta metálica',
    itemType: 'accessory',
    active: true,
    availableForRental: true,
    pricePerHour: 5,
};

// Canasta with urban bike: Bs 5 / hour
assert.equal(
    clientAddonPrice(metalBasket as PricingSource, '1 hora', 1, { isUrbanBike: true }),
    5,
    '1 hour urban basket'
);
assert.equal(
    serverAddonPrice(metalBasket, '1 hora', 1, { isUrbanBike: true }),
    5,
    '1 hour urban basket server'
);
assert.equal(
    clientAddonPrice(metalBasket as PricingSource, '3 horas', 1, { isUrbanBike: true }),
    15,
    '3 hours urban basket'
);
assert.equal(
    serverAddonPrice(metalBasket, '3 horas', 1, { isUrbanBike: true }),
    15,
    '3 hours urban basket server'
);
assert.equal(
    clientAddonPrice(metalBasket as PricingSource, '4 horas', 2, { isUrbanBike: true }),
    40,
    '4 hours urban basket qty 2'
);
assert.equal(
    serverAddonPrice(metalBasket, '4 horas', 2, { isUrbanBike: true }),
    40,
    '4 hours urban basket qty 2 server'
);

// Canasta deduplication: when combo already has a basket, add-on basket is 0 (not double charged)
assert.equal(
    clientAddonPrice(metalBasket as PricingSource, '2 horas', 1, { isUrbanBike: true, comboHasBasket: true }),
    0,
    'Combo already has basket; addon basket is 0'
);
assert.equal(
    serverAddonPrice(metalBasket, '2 horas', 1, { isUrbanBike: true, comboHasBasket: true }),
    0,
    'Combo already has basket; server addon basket is 0'
);

console.log('Accessory pricing modalities tests passed successfully! Client/server parity confirmed.');
