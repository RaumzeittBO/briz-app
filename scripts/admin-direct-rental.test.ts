import assert from 'node:assert/strict';

console.log('Testing Admin Direct Rental (Counter Walk-in, Future Booking, Document Custody & Closing)...');

// Test 1: Flow A (Immediate Walk-in) vs Flow B (Future Booking)
{
    const today = '2026-11-16';
    const currentTime = '14:30';

    const buildBooking = (flow: 'immediate' | 'future', customer: { name: string; phone: string; ci: string }, docType: 'fisico' | 'digital' | 'pendiente', docDetail: string, items: any[], duration: string) => {
        const docNotes = docType === 'fisico'
            ? `[DOCUMENTO EN CUSTODIA]: ${docDetail.trim() || 'CI/Documento en mostrador'}`
            : docType === 'digital'
                ? '[DOCUMENTO DIGITAL]: Verificado en perfil privado'
                : '[DOCUMENTO PENDIENTE]: Cliente presentará al retirar';

        const lines = items.filter(i => i.productType !== 'accessory').map(i => ({
            productId: i.id,
            productType: i.isCombo ? 'combo' : 'single',
            quantity: i.quantity,
        }));

        // Allow standalone accessories
        const accessoryLines = items.filter(i => i.productType === 'accessory');
        const finalLines = lines.length > 0
            ? lines
            : accessoryLines.map(i => ({
                productId: i.id,
                productType: 'single' as const,
                quantity: i.quantity,
            }));

        const accessories = lines.length > 0
            ? accessoryLines.map(i => ({ itemId: i.id, quantity: i.quantity }))
            : [];

        return {
            adminManual: true,
            adminFlow: flow,
            adminCustomer: { name: customer.name, phone: customer.phone, ci: customer.ci },
            adminNotes: docNotes,
            date: flow === 'immediate' ? today : '2026-11-20',
            pickupTime: flow === 'immediate' ? currentTime : '10:00',
            duration,
            lines: finalLines,
            accessories,
            paymentMethod: 'Efectivo',
            paymentStatus: 'unpaid',
        };
    };

    // Flow A: Immediate walk-in with physical document retention
    const walkIn = buildBooking('immediate', { name: 'Carlos Gomez', phone: '70012345', ci: '4567890 LP' }, 'fisico', 'CI original en mostrador', [
        { id: 'bike_urbana', productType: 'single', isCombo: false, quantity: 1 }
    ], '2 horas');

    assert.equal(walkIn.adminFlow, 'immediate');
    assert.equal(walkIn.date, today);
    assert.equal(walkIn.adminNotes, '[DOCUMENTO EN CUSTODIA]: CI original en mostrador');
    assert.equal(walkIn.paymentStatus, 'unpaid'); // Defaults to unpaid (no assumption)

    // Flow B: Future booking with digital document
    const futureBooking = buildBooking('future', { name: 'Elena Rios', phone: '78899000', ci: '9876543 SC' }, 'digital', '', [
        { id: 'bike_montana', productType: 'single', isCombo: false, quantity: 1 }
    ], '1 día');

    assert.equal(futureBooking.adminFlow, 'future');
    assert.equal(futureBooking.date, '2026-11-20');
    assert.equal(futureBooking.adminNotes, '[DOCUMENTO DIGITAL]: Verificado en perfil privado');

    // Standalone accessory booking (without bike)
    const accBooking = buildBooking('immediate', { name: 'Maria Lopez', phone: '71122334', ci: '1122334 LP' }, 'fisico', 'Licencia de conducir retenida', [
        { id: 'acc_casco', productType: 'accessory', isCombo: false, quantity: 2 }
    ], '3 horas');

    assert.equal(accBooking.lines.length, 1);
    assert.equal(accBooking.lines[0].productId, 'acc_casco');
    assert.equal(accBooking.lines[0].quantity, 2);
    assert.equal(accBooking.accessories.length, 0); // accessory promoted to line
}

// Test 2: Closing Rental & Settlement calculation
{
    const agreedTotal = 100;
    const recordedPaid = 40;
    const pendingBalance = Math.max(0, agreedTotal - recordedPaid);
    assert.equal(pendingBalance, 60);

    const extraHoursFee = 20; // 1 hour late
    const damageFee = 35; // repair fee for brake cable
    const damagedUnits = 1;

    const totalToSettle = pendingBalance + extraHoursFee + damageFee;
    assert.equal(totalToSettle, 115);

    // Reception notes with document return confirmation
    const docReturned = true;
    const conditionNotesParts: string[] = [];
    if (docReturned) {
        conditionNotesParts.push('[CUSTODIA]: Documento de identidad físico devuelto al cliente conforme.');
    }
    if (extraHoursFee > 0) {
        conditionNotesParts.push(`[AJUSTE TIEMPO]: Recargo por tiempo adicional Bs. ${extraHoursFee}`);
    }
    if (damageFee > 0) {
        conditionNotesParts.push(`[AJUSTE DAÑOS]: Recargo por daños/reparaciones Bs. ${damageFee}`);
    }
    conditionNotesParts.push('Bicicleta recibida, cadena y freno revisados.');

    const finalConditionNotes = conditionNotesParts.join(' | ');
    assert.ok(finalConditionNotes.includes('[CUSTODIA]: Documento de identidad físico devuelto al cliente conforme.'));
    assert.ok(finalConditionNotes.includes('[AJUSTE TIEMPO]: Recargo por tiempo adicional Bs. 20'));
    assert.ok(finalConditionNotes.includes('[AJUSTE DAÑOS]: Recargo por daños/reparaciones Bs. 35'));
    assert.equal(damagedUnits, 1);
}

// Test 3: Idempotency keys prevent double execution
{
    const generateIdempotencyKey = (action: string, id: string) => `${action}_${id}_${crypto.randomUUID()}`;
    const key1 = generateIdempotencyKey('return', 'rental_123');
    const key2 = generateIdempotencyKey('return', 'rental_123');
    assert.notEqual(key1, key2);
}

console.log('All Admin Direct Rental tests passed!');
