import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    findComboComponentItem,
    getComboAvailabilityDiagnostics,
} from '../src/lib/rentalAvailability';
import { validateComboComponentLink } from '../src/lib/comboComponentLink';
import { describeComboAvailabilityIssue } from '../src/lib/comboAvailabilityStatus';
import {
    bucketNamesMatch,
    getPathVariants,
    ownedCustomerStoragePath,
} from '../functions/src/customerPrivateFiles';
import type { InventoryItem, ComboProduct } from '../src/context/StoreContext';

console.log('Testing Mamachari availability, workshop reconciliation & customer documents...');

const inventoryAdminSource = readFileSync(fileURLToPath(new URL('../src/pages/admin/InventoryPage.tsx', import.meta.url)), 'utf8');
assert.match(inventoryAdminSource, /Seleccionar producto existente/);
assert.match(inventoryAdminSource, /Vincular producto existente/);
assert.match(inventoryAdminSource, /disabled=\{editItem\.components\.length <= 1\}/);
assert.match(inventoryAdminSource, /getComboAvailabilityReport\(c\.id\)/);
assert.doesNotMatch(inventoryAdminSource, /getComboAvailability\(c\.id\)/);

// Test 1: findComboComponentItem alias and exact resolution
{
    const mockInventory: InventoryItem[] = [
        {
            id: 'inv_1794862331711_tcyv5',
            name: 'Mamachari',
            itemType: 'bike',
            active: true,
            availableForRental: true,
            hasWheelSizes: true,
            wheelSizes: [{ size: '26', stock: 6, maintenanceStock: 0 }],
        } as InventoryItem,
        {
            id: 'acc_silla_delantera',
            name: 'Silla Delantera',
            itemType: 'accessory',
            active: true,
            availableForRental: false,
            hasWheelSizes: false,
            stock: 2,
            maintenanceStock: 0,
        } as InventoryItem,
    ];

    // Exact match
    const exact = findComboComponentItem('acc_silla_delantera', mockInventory);
    assert.equal(exact.item?.id, 'acc_silla_delantera');
    assert.equal(exact.isAliasMatch, false);

    // Alias match: 'bike_mamachari' matches 'Mamachari'
    const alias = findComboComponentItem('bike_mamachari', mockInventory);
    assert.equal(alias.item?.id, 'inv_1794862331711_tcyv5');
    assert.equal(alias.isAliasMatch, true);

    // Non-existent item
    const missing = findComboComponentItem('bike_non_existent', mockInventory);
    assert.equal(missing.item, undefined);
    assert.equal(missing.isAliasMatch, false);
}

// Test 6: quantity, interval, workshop, missing-link, and branch diagnostics
{
    const date = '2027-01-15';
    const item = (overrides: Partial<InventoryItem>): InventoryItem => ({
        id: 'mamachari-existing', itemType: 'bike', name: 'Mamachari', active: true, store: 'central',
        availableForRental: true, availableForSale: false, hasWheelSizes: false, stock: 3, maintenanceStock: 0,
        description: '', imageUrl: '', pricePerHour: 20, priceFrom5thHour: 20, pricePerDay: 60,
        pricePerWeek: 300, pricePerMonth: 600, ...overrides,
    });
    const bike = item({});
    const accessory = item({ id: 'acc-chair', itemType: 'accessory', name: 'Silla', stock: 2 });
    assert.deepEqual(validateComboComponentLink('bike_mamachari', bike, 'central'), { valid: true }, 'Mamachari is offered as an explicit, valid bike candidate.');
    assert.equal(validateComboComponentLink('bike_mamachari', accessory, 'central').valid, false, 'A component keeps its expected type.');
    assert.equal(validateComboComponentLink('bike_mamachari', item({ store: 'north' }), 'central').valid, false, 'A candidate from another branch cannot be linked.');
    assert.equal(validateComboComponentLink('bike_mamachari', item({ stock: 0 }), 'central').valid, false, 'A candidate without physical stock cannot be linked.');
    assert.equal(validateComboComponentLink('bike_mamachari', item({ active: false }), 'central').valid, false, 'An inactive candidate cannot be linked.');
    const combo: ComboProduct = {
        id: 'combo-qty', name: 'Mamachari con silla', store: 'central', active: true,
        availableForRental: true, availableForSale: false, description: '', imageUrl: '',
        pricePerHour: 30, priceFrom5thHour: 30, pricePerDay: 70, pricePerWeek: 0, pricePerMonth: 0,
        components: [
            { inventoryItemId: bike.id, quantity: 2, requiresWheelSize: false },
            { inventoryItemId: accessory.id, quantity: 1, requiresWheelSize: false },
        ],
    };
    const report = getComboAvailabilityDiagnostics({ inventory: [bike, accessory], combos: [combo], rentals: [], combo, date, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(report.available, 1, 'Three bikes divided by a required quantity of two limits this combo to one.');
    assert.equal(describeComboAvailabilityIssue(report, [bike, accessory]), '1 disponible');
    assert.equal(report.components.find(component => component.inventoryItemId === bike.id)?.requiredQuantity, 2);

    const missingCombo = { ...combo, components: [{ inventoryItemId: 'bike-missing', quantity: 1, requiresWheelSize: false }] };
    const missing = getComboAvailabilityDiagnostics({ inventory: [bike], combos: [missingCombo], rentals: [], combo: missingCombo, date, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(missing.components[0].reasonCode, 'missing_item');
    assert.equal(describeComboAvailabilityIssue(missing, [bike]), 'Falta vincular bicicleta');

    const otherBranch = { ...bike, store: 'north' };
    const mismatch = getComboAvailabilityDiagnostics({ inventory: [otherBranch], combos: [combo], rentals: [], combo, date, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(mismatch.components[0].reasonCode, 'store_mismatch');
    assert.equal(describeComboAvailabilityIssue(mismatch, [otherBranch]), 'Otra sucursal');

    const inWorkshop = item({ stock: 0, maintenanceStock: 2, hasWheelSizes: false });
    const workshopCombo = { ...combo, components: [{ inventoryItemId: inWorkshop.id, quantity: 1, requiresWheelSize: false }] };
    const workshop = getComboAvailabilityDiagnostics({ inventory: [inWorkshop], combos: [workshopCombo], rentals: [], combo: workshopCombo });
    assert.equal(workshop.components[0].reasonCode, 'in_maintenance');
    assert.equal(describeComboAvailabilityIssue(workshop, [inWorkshop]), 'En taller');
    const workshopForSlot = getComboAvailabilityDiagnostics({ inventory: [inWorkshop], combos: [workshopCombo], rentals: [], combo: workshopCombo, date, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(workshopForSlot.components[0].reasonCode, 'in_maintenance');
    assert.match(workshopForSlot.components[0].reasonMessage, /horario consultado.*2 unidad/);

    const confirmed = {
        id: 'rented-today', reservationCode: 'SIM-ONLY', customerName: 'Fictional', customerPhone: '', customerCI: '',
        productType: 'single', productId: bike.id, productName: bike.name, quantity: 1, duration: '1 hora', date,
        pickupTime: '10:00', total: 20, paymentMethod: 'Efectivo', paymentStatus: 'unpaid', notes: '',
        status: 'confirmed', createdAt: '', updatedAt: '',
    } as const;
    const occupied = getComboAvailabilityDiagnostics({ inventory: [{ ...bike, stock: 0 }, accessory], combos: [combo], rentals: [confirmed as never], combo, date, pickupTime: '10:00', duration: '1 hora' });
    assert.equal(occupied.components[0].reasonCode, 'reserved');
    assert.match(occupied.components[0].reasonMessage, /horario consultado/);

    const noStockAccessory = item({ id: 'acc-no-stock', itemType: 'accessory', name: 'Candado', stock: 0 });
    const accessoryOnlyCombo = { ...combo, components: [{ inventoryItemId: noStockAccessory.id, quantity: 1, requiresWheelSize: false }] };
    const noAccessoryStock = getComboAvailabilityDiagnostics({ inventory: [noStockAccessory], combos: [accessoryOnlyCombo], rentals: [], combo: accessoryOnlyCombo });
    assert.equal(describeComboAvailabilityIssue(noAccessoryStock, [noStockAccessory]), 'Accesorio sin stock');
}

// Test 2: Combo availability diagnostics & bottleneck identification
{
    const mockInventory: InventoryItem[] = [
        {
            id: 'inv_1794862331711_tcyv5',
            name: 'Mamachari',
            itemType: 'bike',
            active: true,
            availableForRental: true,
            hasWheelSizes: true,
            wheelSizes: [{ size: '26', stock: 6, maintenanceStock: 0 }],
        } as InventoryItem,
        {
            id: 'acc_silla_delantera',
            name: 'Silla Delantera',
            itemType: 'accessory',
            active: true,
            availableForRental: false,
            hasWheelSizes: false,
            stock: 2,
            maintenanceStock: 0,
        } as InventoryItem,
    ];

    const mamachariCombo: ComboProduct = {
        id: 'combo_mamachari_silla_delantera',
        name: 'Mamachari + Silla Delantera',
        active: true,
        availableForRental: true,
        components: [
            { inventoryItemId: 'bike_mamachari', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_delantera', quantity: 1 },
        ],
    } as ComboProduct;

    const report = getComboAvailabilityDiagnostics({
        comboId: mamachariCombo.id,
        combo: mamachariCombo,
        inventory: mockInventory,
        combos: [mamachariCombo],
        rentals: [],
    });

    // 6 bikes, 2 chairs -> limited by chairs = 2
    assert.equal(report.available, 2);
    assert.equal(report.components.length, 2);

    const chairDiag = report.components.find(d => d.inventoryItemId === 'acc_silla_delantera');
    assert.ok(chairDiag);
    assert.equal(chairDiag?.isBottleneck, true);
    assert.equal(chairDiag?.capacity, 2);

    const bikeDiag = report.components.find(d => d.inventoryItemId === 'bike_mamachari');
    assert.ok(bikeDiag);
    assert.equal(bikeDiag?.isAliasMatch, true);
    assert.equal(bikeDiag?.capacity, 6);
    assert.equal(bikeDiag?.isBottleneck, false);

    const linkedWithoutDuplicate = { ...mamachariCombo, components: mamachariCombo.components.map(component => component.inventoryItemId === 'bike_mamachari'
        ? { ...component, inventoryItemId: mockInventory[0].id }
        : component) };
    const linkedReport = getComboAvailabilityDiagnostics({ comboId: linkedWithoutDuplicate.id, combo: linkedWithoutDuplicate, inventory: mockInventory, combos: [linkedWithoutDuplicate], rentals: [] });
    assert.equal(linkedReport.available, 2, 'Linking the existing Mamachari inventory row does not require a duplicate item.');
    const deletedComponentReport = getComboAvailabilityDiagnostics({
        comboId: mamachariCombo.id, combo: mamachariCombo, inventory: mockInventory.filter(item => item.id !== mockInventory[0].id), combos: [mamachariCombo], rentals: [],
    });
    assert.equal(deletedComponentReport.isAvailable, false, 'A deleted physical component is diagnosed as unavailable until relinked.');
}

// Test 3: Storage bucket normalization and format variants
{
    // Both appspot.com and firebasestorage.app normalize to briz-4ef3a
    assert.equal(bucketNamesMatch('briz-4ef3a.appspot.com', 'briz-4ef3a.firebasestorage.app'), true);
    assert.equal(bucketNamesMatch('briz-4ef3a.firebasestorage.app', 'briz-4ef3a.firebasestorage.app'), true);
    assert.equal(bucketNamesMatch('other-project.appspot.com', 'briz-4ef3a.firebasestorage.app'), false);

    // Path variants: .jpg <-> .jpeg
    const jpgVariants = getPathVariants('customerUploads/uid123/document-back.jpg');
    assert.deepEqual(jpgVariants, [
        'customerUploads/uid123/document-back.jpg',
        'customerUploads/uid123/document-back.jpeg',
    ]);

    const jpegVariants = getPathVariants('customerUploads/uid123/document-front.jpeg');
    assert.deepEqual(jpegVariants, [
        'customerUploads/uid123/document-front.jpeg',
        'customerUploads/uid123/document-front.jpg',
    ]);

    // ownedCustomerStoragePath with cross-bucket notation
    const gsUrl = 'gs://briz-4ef3a.appspot.com/customerUploads/uid123/selfie.jpg';
    const resolvedPath = ownedCustomerStoragePath('uid123', '', gsUrl, 'briz-4ef3a.firebasestorage.app');
    assert.equal(resolvedPath, 'customerUploads/uid123/selfie.jpg');

    // Reject traversal
    const badPath = 'customerUploads/uid123/../otherUid/selfie.jpg';
    assert.equal(ownedCustomerStoragePath('uid123', '', badPath, 'briz-4ef3a.firebasestorage.app'), '');
}

// Test 4: Workshop reconciliation follows per-item linked orders, not a universal unit count
{
    // Emulator-style quad fixture: 5 units available and 3 workshop units recorded,
    // but only two active service orders (one unit in each wheel size).
    const itemBefore = {
        id: 'bike_cuatriciclo_familiar',
        name: 'Cuatriciclo Familiar',
        stock: 0,
        maintenanceStock: 3,
        hasWheelSizes: true,
        wheelSizes: [
            { size: '20', stock: 3, maintenanceStock: 2 },
            { size: '22', stock: 2, maintenanceStock: 1 },
        ],
    };

    const activeOrdersByWheel = { '20': 1, '22': 1 };
    const activeOrdersCount = Object.values(activeOrdersByWheel).reduce((sum, value) => sum + value, 0);
    const reconciledItem = {
        ...itemBefore,
        maintenanceStock: activeOrdersCount,
        wheelSizes: itemBefore.wheelSizes.map(w => ({ ...w, maintenanceStock: activeOrdersByWheel[w.size as keyof typeof activeOrdersByWheel] || 0 })),
    };

    assert.equal(reconciledItem.maintenanceStock, 2, 'System workshop quantity must follow the two active service orders.');
    assert.deepEqual(reconciledItem.wheelSizes.map(w => [w.size, w.stock, w.maintenanceStock]), [['20', 3, 1], ['22', 2, 1]]);
    assert.equal(reconciledItem.wheelSizes.reduce((sum, wheel) => sum + wheel.stock, 0), 5, 'Reconciliation leaves available physical stock unchanged.');
}

// Test 5: Branch/Store isolation and anti-ambiguity
{
    const inventory = [
        {
            id: 'item_mama_central',
            name: 'Bicicleta Mamachari',
            itemType: 'bike' as const,
            active: true,
            store: 'central',
            stock: 2,
            hasWheelSizes: false,
            availableForRental: true,
            availableForSale: false,
            pricePerHour: 25, priceFrom5thHour: 25, pricePerDay: 80, pricePerWeek: 250, pricePerMonth: 600,
            description: '', imageUrl: '',
        },
        {
            id: 'item_silla_norte',
            name: 'Silla Infantil Mamachari',
            itemType: 'accessory' as const,
            active: true,
            store: 'norte',
            stock: 3,
            hasWheelSizes: false,
            availableForRental: true,
            availableForSale: false,
            pricePerHour: 10, priceFrom5thHour: 10, pricePerDay: 20, pricePerWeek: 0, pricePerMonth: 0,
            description: '', imageUrl: '',
        },
    ];

    // Attempting to resolve silla from norte in central combo
    const resMismatch = findComboComponentItem('acc_silla', inventory as any, 'central');
    assert.equal(resMismatch.storeMismatch, true);
    assert.equal(resMismatch.mismatchedStore, 'norte');

    // Diagnostics report flags store mismatch
    const combo: ComboProduct = {
        id: 'combo_mamachari_test',
        name: 'Mamachari con Silla',
        store: 'central',
        active: true,
        availableForRental: true,
        availableForSale: false,
        description: '', imageUrl: '',
        components: [
            { inventoryItemId: 'item_mama_central', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_silla', quantity: 1, requiresWheelSize: false },
        ],
    };

    const report = getComboAvailabilityDiagnostics({
        inventory: inventory as any,
        combos: [combo],
        rentals: [],
        combo,
    });
    assert.equal(report.isAvailable, false);
    assert.equal(report.bottleneckReason.includes('Stock registrado en otra sucursal'), true);
}

console.log('All Mamachari availability, workshop reconciliation & customer document tests passed!');
