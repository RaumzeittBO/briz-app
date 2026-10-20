/**
 * BRIZ — Suite de Validación Integral (Fase 6)
 * Verifica:
 * 1. Cálculo de tarifas por hora, día, semana, mes, regla de la 5ta hora, duraciones en inglés y seguridad contra NaN.
 * 2. Motor de disponibilidad por intervalos de tiempo, tallas de aro (wheelSizes) y conflictos de combos compartidos.
 * 3. Hashing de contraseñas (SHA-256 + compatibilidad legacy) y sanitización de PII en reservas públicas y sesión.
 * 4. Utilidades de fecha y hora en zona horaria Bolivia (America/La_Paz, UTC-4).
 */
import assert from 'node:assert/strict';
import { calculateProductRentalPrice, parseDurationToHours, getAccessoryAddonUnitPrice } from '../src/lib/rentalPricing';
import {
    computeRentalWindow,
    doWindowsOverlap,
    getAvailableStockForInterval,
    getComboAvailabilityForInterval,
    buildComboComponentSelections,
} from '../src/lib/rentalAvailability';
import {
    hashPassword,
    verifyPassword,
    isPasswordHashed,
    sanitizeRentalForPublicAvailability,
    sanitizeCustomerForSession,
} from '../src/lib/security';
import { toBoliviaDateString, getBoliviaYear } from '../src/lib/dateUtils';
import { RENTAL_SEED_BIKES, RENTAL_SEED_ACCESSORIES, RENTAL_SEED_COMBOS } from '../src/data/rentalSeedData';
import { t, getLocalizedField } from '../src/lib/translations';
import { ARTWORK_REGISTRY, getLocalizedArtwork } from '../src/lib/artworkRegistry';

async function runTests() {
    let passed = 0;
    const test = async (name: string, fn: () => void | Promise<void>) => {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    };

    console.log('\n=======================================================');
    console.log('🚲 BRIZ — EJECUTANDO SUITE DE VALIDACIÓN INTEGRAL');
    console.log('=======================================================\n');

    // 1. PRICING & CALCULATIONS
    console.log('--- 1. Tarifas y Cálculos de Alquiler ---');
    const urbana = RENTAL_SEED_BIKES.find(b => b.id === 'bike_urbana')!;

    await test('Tarifas exactas configuradas para Urbana (1h, 2h, 3h, 4h, 8h, 24h, 1 semana, 1 mes)', () => {
        assert.equal(calculateProductRentalPrice(urbana, '1 hora'), 25);
        assert.equal(calculateProductRentalPrice(urbana, '2 horas'), 45);
        assert.equal(calculateProductRentalPrice(urbana, '3 horas'), 55);
        assert.equal(calculateProductRentalPrice(urbana, '4 horas'), 60);
        assert.equal(calculateProductRentalPrice(urbana, '8 horas'), 80);
        assert.equal(calculateProductRentalPrice(urbana, '24 horas'), 100);
        assert.equal(calculateProductRentalPrice(urbana, '1 semana'), 300);
        assert.equal(calculateProductRentalPrice(urbana, '1 mes'), 600);
    });

    await test('Regla comercial de la 5ta hora (5h a 24h iguala a 24 Horas / Full Day, 8h usa su tramo)', () => {
        assert.equal(calculateProductRentalPrice(urbana, '5 horas'), 100);
        assert.equal(calculateProductRentalPrice(urbana, '6 horas'), 100);
        assert.equal(calculateProductRentalPrice(urbana, '8 horas'), 80);
    });

    await test('Soporte bilingüe (Inglés / Español) y protección contra NaN en duraciones', () => {
        assert.equal(calculateProductRentalPrice(urbana, '2 hours'), 45);
        assert.equal(calculateProductRentalPrice(urbana, '1 day'), 100);
        assert.equal(calculateProductRentalPrice(urbana, '1 week'), 300);
        assert.equal(calculateProductRentalPrice(urbana, '1 month'), 600);
        assert.equal(calculateProductRentalPrice(urbana, 'invalid_text'), 25);
        assert.equal(Number.isNaN(calculateProductRentalPrice(urbana, '')), false);
        assert.equal(parseDurationToHours('1 semana'), 168);
        assert.equal(parseDurationToHours('1 mes'), 720);
    });

    await test('Tarifas de accesorios reales de inventario (addonFlatPrice y defaults)', () => {
        const casco = RENTAL_SEED_ACCESSORIES.find(a => a.id === 'acc_casco_adulto')!;
        const linterna = RENTAL_SEED_ACCESSORIES.find(a => a.id === 'acc_linterna_bocina')!;
        assert.equal(getAccessoryAddonUnitPrice(casco, '2 horas'), 0);
        assert.equal(getAccessoryAddonUnitPrice(linterna, '2 horas'), 10);
        const customAcc = { ...casco, addonFlatPrice: 12 };
        assert.equal(getAccessoryAddonUnitPrice(customAcc, '2 horas'), 12);
    });

    // 2. AVAILABILITY BY TIME INTERVALS & COMBOS
    console.log('\n--- 2. Disponibilidad por Intervalos de Tiempo, Aros y Combos ---');
    const allInventory = [...RENTAL_SEED_ACCESSORIES, ...RENTAL_SEED_BIKES];
    const comboUrbanaMimbre = RENTAL_SEED_COMBOS.find(c => c.id === 'combo_urbana_canasta_mimbre')!;
    const comboAdultWheels = RENTAL_SEED_COMBOS.find(c => c.id === 'combo_urbana_cuadro_bajo_ruedas_auxiliares_adulto')!;

    await test('Solapamiento de ventanas horarias (doWindowsOverlap)', () => {
        const w1 = computeRentalWindow('2026-10-25', '09:00', '2 horas');
        const w2 = computeRentalWindow('2026-10-25', '10:00', '2 horas');
        const w3 = computeRentalWindow('2026-10-25', '11:00', '2 horas');
        const wNextDay = computeRentalWindow('2026-10-26', '09:00', '2 horas');

        assert.equal(doWindowsOverlap(w1, w2), true, '09:00-11:00 y 10:00-12:00 deben solaparse');
        assert.equal(doWindowsOverlap(w1, w3), false, '09:00-11:00 y 11:00-13:00 son contiguos, no se solapan');
        assert.equal(doWindowsOverlap(w1, wNextDay), false, 'Fechas distintas no se solapan');
    });

    await test('Reserva futura pendiente bloquea su propio intervalo horario pero no otros horarios', () => {
        // acc_ruedas_auxiliares_adulto tiene stock = 1
        const pendingTomorrow: any = {
            id: 'r_future_1',
            productId: 'acc_ruedas_auxiliares_adulto',
            productType: 'single',
            productName: 'Ruedas auxiliares para adulto',
            quantity: 1,
            date: '2026-10-28',
            pickupTime: '10:00',
            duration: '2 horas',
            status: 'pending',
        };

        const availSame = getAvailableStockForInterval({
            inventory: allInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [pendingTomorrow],
            itemId: 'acc_ruedas_auxiliares_adulto',
            date: '2026-10-28',
            pickupTime: '10:30',
            duration: '2 horas',
            includePendingReservations: true,
        });
        const availAfternoon = getAvailableStockForInterval({
            inventory: allInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [pendingTomorrow],
            itemId: 'acc_ruedas_auxiliares_adulto',
            date: '2026-10-28',
            pickupTime: '15:00',
            duration: '2 horas',
            includePendingReservations: true,
        });

        assert.equal(availSame, 0, 'Debe ser 0 en el horario solapado');
        assert.equal(availAfternoon, 1, 'Debe estar disponible (1) en la tarde cuando termina la reserva de la mañana');
    });

    await test('Disponibilidad de combos limitada por el aro específico y por el componente más escaso', () => {
        // combo_urbana_canasta_mimbre usa bike_urbana (26: 113, 27: 26) + acc_canasta_mimbre (14)
        const avail26 = getComboAvailabilityForInterval({
            inventory: allInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [],
            comboId: comboUrbanaMimbre.id,
            wheelSize: '26',
            date: '2026-10-29',
            pickupTime: '09:00',
            duration: '2 horas',
        });
        assert.equal(avail26, 14, 'El combo debe estar limitado por las 14 canastas de mimbre, no por las 113 bicis');

        const selections = buildComboComponentSelections(comboUrbanaMimbre, '27', allInventory);
        const bikeComp = selections.find(s => s.inventoryItemId === 'bike_urbana');
        assert.equal(bikeComp?.wheelSize, '27', 'Debe propagar el aro seleccionado al componente bicicleta');
    });

    await test('Combo comparte componente con accesorio individual sin crear unidades ficticias', () => {
        // Si se reserva combo_urbana_cuadro_bajo_ruedas_auxiliares_adulto (que usa acc_ruedas_auxiliares_adulto, stock 1),
        // el stock disponible de acc_ruedas_auxiliares_adulto en ese horario pasa a 0.
        const comboRental: any = {
            id: 'r_combo_1',
            productId: comboAdultWheels.id,
            productType: 'combo',
            productName: comboAdultWheels.name,
            quantity: 1,
            selectedWheelSize: '26',
            componentSelections: buildComboComponentSelections(comboAdultWheels, '26', allInventory),
            date: '2026-10-30',
            pickupTime: '09:00',
            duration: '4 horas',
            status: 'pending',
        };

        const remainingAccessory = getAvailableStockForInterval({
            inventory: allInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [comboRental],
            itemId: 'acc_ruedas_auxiliares_adulto',
            date: '2026-10-30',
            pickupTime: '09:00',
            duration: '4 horas',
            includePendingReservations: true,
        });
        assert.equal(remainingAccessory, 0, 'El accesorio individual debe quedar en 0 cuando el combo lo ocupa');
    });

    await test('No doble descuento de stock físico cuando una reserva pasa a confirmed/delivered', () => {
        // Simular que acc_ruedas_auxiliares_adulto (stock original 1) fue confirmado físicamente (stock en documento pasa a 0)
        const modifiedInventory = allInventory.map(i =>
            i.id === 'acc_ruedas_auxiliares_adulto' ? { ...i, stock: 0 } : i
        );
        const confirmedToday: any = {
            id: 'r_conf_1',
            productId: 'acc_ruedas_auxiliares_adulto',
            productType: 'single',
            productName: 'Ruedas auxiliares para adulto',
            quantity: 1,
            date: '2026-10-20',
            pickupTime: '09:00',
            duration: '2 horas',
            status: 'confirmed',
        };

        // En el mismo horario de hoy: está ocupado (0 disponible)
        const availDuringConfirmed = getAvailableStockForInterval({
            inventory: modifiedInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [confirmedToday],
            itemId: 'acc_ruedas_auxiliares_adulto',
            date: '2026-10-20',
            pickupTime: '09:30',
            duration: '2 horas',
        });
        // Mañana (cuando el alquiler confirmado de 2h ya habrá sido devuelto): vuelve a tener capacidad total 1
        const availTomorrow = getAvailableStockForInterval({
            inventory: modifiedInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [confirmedToday],
            itemId: 'acc_ruedas_auxiliares_adulto',
            date: '2026-10-21',
            pickupTime: '09:30',
            duration: '2 horas',
        });

        assert.equal(availDuringConfirmed, 0, 'Durante la ventana del alquiler confirmado el stock disponible es 0');
        assert.equal(availTomorrow, 1, 'Fuera de la ventana del alquiler confirmado se recupera la capacidad total sin doble descuento');
    });

    await test('Demanda de bicicleta multi-aro sin aro explícito resuelve aro por defecto sin inflar los demás aros', () => {
        // Si un alquiler confirmado de 2 unidades de bike_urbana descontó 2 unidades del aro por defecto (26 -> pasa de 113 a 111)
        const modifiedInventory = allInventory.map(i =>
            i.id === 'bike_urbana'
                ? {
                    ...i,
                    wheelSizes: i.wheelSizes?.map(ws => ws.size === '26' ? { ...ws, stock: 111 } : ws)
                }
                : i
        );
        const legacyRentalWithoutWheelSize: any = {
            id: 'r_legacy_no_ws',
            productId: 'bike_urbana',
            productType: 'single',
            productName: 'Urbana',
            quantity: 2,
            selectedWheelSize: '',
            date: '2026-10-25',
            pickupTime: '09:00',
            duration: '2 horas',
            status: 'confirmed',
        };
        const avail26 = getAvailableStockForInterval({
            inventory: modifiedInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [legacyRentalWithoutWheelSize],
            itemId: 'bike_urbana',
            wheelSize: '26',
            date: '2026-10-29',
            pickupTime: '09:00',
            duration: '2 horas',
        });
        const avail27 = getAvailableStockForInterval({
            inventory: modifiedInventory,
            combos: RENTAL_SEED_COMBOS,
            rentals: [legacyRentalWithoutWheelSize],
            itemId: 'bike_urbana',
            wheelSize: '27',
            date: '2026-10-29',
            pickupTime: '09:00',
            duration: '2 horas',
        });
        assert.equal(avail26, 113, 'El aro 26 recupera su capacidad total real (111 + 2 = 113)');
        assert.equal(avail27, 26, 'El aro 27 NO se infla a 28 cuando un alquiler sin aro está confirmado');
    });

    // 3. SECURITY & DATA PROTECTION
    console.log('\n--- 3. Seguridad, Hashing de Contraseñas (PBKDF2) y Sanitización PII ---');

    await test('Hashing PBKDF2-HMAC-SHA256 con sal aleatoria y compatibilidad con sha256$ y texto plano', async () => {
        const hashed1 = await hashPassword('MiClaveSegura2026');
        const hashed2 = await hashPassword('MiClaveSegura2026');
        assert.equal(isPasswordHashed(hashed1), true);
        assert.equal(hashed1.startsWith('pbkdf2$100000$'), true);
        assert.notEqual(hashed1, hashed2, 'Dos hashes de la misma clave deben diferir por la sal aleatoria de 16 bytes');

        const checkValid = await verifyPassword('MiClaveSegura2026', hashed1);
        assert.equal(checkValid.valid, true);
        assert.equal(checkValid.needsUpgrade, false);

        const checkInvalid = await verifyPassword('OtraClave', hashed1);
        assert.equal(checkInvalid.valid, false);

        // Legacy plaintext compatibility + auto-upgrade flag
        const checkLegacyPlain = await verifyPassword('claveAntigua123', 'claveAntigua123');
        assert.equal(checkLegacyPlain.valid, true);
        assert.equal(checkLegacyPlain.needsUpgrade, true);
    });

    await test('Sanitización de reservas públicas (oculta CI, teléfono, dirección y comprobantes)', () => {
        const rawRental: any = {
            id: 'rental_test_1',
            reservationCode: 'BRIZ-2026-0042',
            customerName: 'Juan Pérez',
            customerPhone: '+59170000000',
            customerCI: '9988776 CB',
            customerAddress: 'Av. América #123',
            documentoUrl: 'https://storage.example/ci_front.jpg',
            paymentProofUrl: 'https://storage.example/receipt.jpg',
            productId: 'bike_urbana',
            productType: 'single',
            quantity: 2,
            date: '2026-10-25',
            pickupTime: '09:00',
            duration: '2 horas',
            status: 'confirmed',
            total: 90,
            notes: 'Notas privadas',
        };

        const sanitized = sanitizeRentalForPublicAvailability(rawRental);
        assert.equal(sanitized.customerName, 'Reservado');
        assert.equal(sanitized.customerPhone, '');
        assert.equal(sanitized.customerCI, '');
        assert.equal(sanitized.documentoUrl, undefined);
        assert.equal(sanitized.paymentProofUrl, undefined);
        assert.equal(sanitized.notes, '');
        assert.equal(sanitized.productId, 'bike_urbana');
        assert.equal(sanitized.quantity, 2);
    });

    await test('Sanitización de sesión de cliente (nunca persiste password en localStorage)', () => {
        const cust: any = {
            id: 'cust_1',
            name: 'María',
            phone: '70011223',
            ci: '1234567',
            password: 'sha256$secret_hash',
        };
        const clean = sanitizeCustomerForSession(cust);
        assert.equal('password' in clean, false);
        assert.equal(clean.name, 'María');
    });

    // 4. TIMEZONE & TRANSLATIONS
    console.log('\n--- 4. Zona Horaria Bolivia (UTC-4) y Traducciones ---');

    await test('Conversión de fecha UTC nocturna a fecha local de Bolivia (America/La_Paz)', () => {
        // 2026-10-21T02:30:00.000Z es 2026-10-20 22:30 en Bolivia (UTC-4)
        const boliviaDate = toBoliviaDateString('2026-10-21T02:30:00.000Z');
        assert.equal(boliviaDate, '2026-10-20');
        assert.equal(getBoliviaYear(new Date('2026-10-21T02:30:00.000Z')), 2026);
    });

    await test('Traducciones al inglés limpias y sin textos internos ("Precio suelto aún no definido")', () => {
        for (const acc of RENTAL_SEED_ACCESSORIES) {
            const enName = t(acc.name, 'en');
            const enDesc = t(acc.description, 'en');
            assert.equal(enDesc.includes('Price not defined yet'), false, `Descripción en inglés de ${acc.name} no debe mostrar 'Price not defined yet'`);
            assert.equal(enDesc.includes('Precio suelto'), false);
            assert.ok(enName.length > 0);
        }
        for (const combo of RENTAL_SEED_COMBOS) {
            const enCombo = t(combo.name, 'en');
            assert.notEqual(enCombo, combo.name, `El combo '${combo.name}' debe tener traducción al inglés`);
        }
        assert.equal(getLocalizedField('Urbana', 'Custom Urban Bike', 'en'), 'Custom Urban Bike');
        assert.equal(getLocalizedField('Urbana', undefined, 'en'), 'Urban Bike');
    });

    await test('Registro de artes (artworkRegistry) aplica fallback seguro cuando la versión en inglés no está verificada o falta en disco', () => {
        assert.equal(Object.keys(ARTWORK_REGISTRY).length, 9, 'El registro de artes debe contener los 9 slots principales de Home y Conócenos');
        // Bento 3: web en inglés verificada (/menu-principal-web/Ingles/3.png), móvil en inglés NO verificada (debe hacer fallback a /menu-principal-celular/3.webp)
        const bento3En = getLocalizedArtwork('home_bento_3_shop', 'en');
        assert.equal(bento3En.webSrc, '/menu-principal-web/Ingles/3.png');
        assert.equal(bento3En.mobileSrc, '/menu-principal-celular/3.webp');

        // Bento 1: web y móvil en inglés están verificadas (/menu-principal-web/Ingles/1.png y /menu-principal-celular/Ingles/1.png)
        const bento1En = getLocalizedArtwork('home_bento_1_rentals', 'en');
        assert.equal(bento1En.webSrc, '/menu-principal-web/Ingles/1.png');
        assert.equal(bento1En.mobileSrc, '/menu-principal-celular/Ingles/1.png');

        // About 2: antes apuntaba a /Conocenos-web/Ingles/2.webp (404), ahora hace fallback seguro a /Conocenos-web/2.webp?v=2 y /Conocenos-celular/2.webp?v=2 hasta que se entregue el arte en inglés
        const about2En = getLocalizedArtwork('about_slide_2', 'en');
        assert.equal(about2En.webSrc, '/Conocenos-web/2.webp?v=2');
        assert.equal(about2En.mobileSrc, '/Conocenos-celular/2.webp?v=2');
    });

    console.log(`\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE (${passed}/${passed})\n`);
}

runTests().catch(err => {
    console.error('\n❌ FALLÓ LA SUITE DE VALIDACIÓN:', err);
    process.exit(1);
});
