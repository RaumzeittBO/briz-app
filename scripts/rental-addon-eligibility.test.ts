import assert from 'node:assert/strict';
import { isEligibleRentalAddon as isEligibleServerAddon, hasConfiguredRentalAddonPrice as hasServerPrice, accessoryUnitPrice } from '../functions/src/domain';
import { isEligibleRentalAddon as isEligibleClientAddon } from '../src/lib/rentalAddonEligibility';
import { getAccessoryAddonUnitPrice } from '../src/lib/rentalPricing';

const rentalCombo = { id: 'combo-family', active: true, availableForRental: true, components: [{ inventoryItemId: 'basket' }] };
const saleOnly = { id: 'sale-only', itemType: 'accessory' as const, name: 'Sale only', active: true, availableForRental: false, availableForSale: true };
const legacyCatalog = { ...saleOnly, id: 'legacy-catalog', availableForRental: true, availableAsRentalAddon: false, availableForSale: false };
const rentalCatalogWithoutLegacyFlags = { ...saleOnly, id: 'rental-catalog-no-flags', availableForRental: false, availableAsRentalAddon: false, availableForSale: false, rentalCatalog: true };
const legacyUnspecifiedCatalog = { ...saleOnly, id: 'legacy-unspecified-catalog', availableForRental: false, availableAsRentalAddon: false, availableForSale: false };
const unclassifiedSaleStatus = { ...saleOnly, id: 'unknown-sale-status', availableForRental: false, availableAsRentalAddon: false, availableForSale: undefined };
const comboPart = { ...saleOnly, id: 'basket', availableForSale: false };
const excluded = { ...legacyCatalog, id: 'excluded', excludeFromRentalAddons: true };
const inactive = { ...legacyCatalog, id: 'inactive', active: false };
const explicitSaleOnly = { ...rentalCatalogWithoutLegacyFlags, id: 'explicit-sale-only', rentalCatalog: false };

for (const [item, combos, expected] of [
  [legacyCatalog, [], true],
  [rentalCatalogWithoutLegacyFlags, [], true],
  [legacyUnspecifiedCatalog, [], true],
  [unclassifiedSaleStatus, [], false],
  [saleOnly, [], false],
  [explicitSaleOnly, [rentalCombo], false],
  [comboPart, [rentalCombo], true],
  [excluded, [rentalCombo], false],
  [inactive, [rentalCombo], false],
] as const) {
  assert.equal(isEligibleClientAddon(item, combos), expected, `${item.id}: frontend eligibility`);
  assert.equal(isEligibleServerAddon(item, combos), expected, `${item.id}: backend eligibility`);
}

const missingRate = { ...legacyCatalog, id: 'basket', price1Hour: 0, price24Hours: 0 };
assert.equal(hasServerPrice(missingRate), false, 'missing price is not treated as a gift');
assert.equal(getAccessoryAddonUnitPrice(missingRate as never, '1 hora'), null);
assert.throws(() => accessoryUnitPrice(missingRate, '1 hora'), /tarifa de alquiler/i);

const explicitlyFree = { ...missingRate, rentalAddonFree: true };
assert.equal(hasServerPrice(explicitlyFree), true);
assert.equal(getAccessoryAddonUnitPrice(explicitlyFree as never, '1 hora'), 0);
assert.equal(accessoryUnitPrice(explicitlyFree, '1 hora'), 0);

const configuredRate = { ...missingRate, price24Hours: 30 };
assert.equal(getAccessoryAddonUnitPrice(configuredRate as never, '24 horas'), 30);
assert.equal(getAccessoryAddonUnitPrice(configuredRate as never, '1 hora'), null, 'a configured daily rate is not silently charged as a free hourly add-on');

console.log('Rental add-on eligibility and explicit pricing passed (18 assertions).');
