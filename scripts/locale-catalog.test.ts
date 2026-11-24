import assert from 'node:assert/strict';
import { LOCALES, MESSAGES, tx } from '../src/lib/localeCatalog';
import { t } from '../src/lib/translations';

for (const [key, translations] of Object.entries(MESSAGES)) {
    for (const locale of LOCALES) {
        assert.equal(typeof translations[locale], 'string', `${key} must include ${locale}`);
        assert.ok(translations[locale].trim(), `${key}.${locale} must not be empty`);
    }
}

assert.equal(tx('navRentals', 'en'), 'Bike Rentals');
assert.equal(tx('navTours', 'en'), 'Tours & Routes');
assert.equal(t('Estamos abiertos de lunes a sábado de 8:00 a 19:00 y domingos de 9:00 a 14:00.', 'en'), 'We are open Monday through Saturday from 8:00 AM to 7:00 PM, and Sunday from 9:00 AM to 2:00 PM.');
assert.equal(t('Sí, solicitamos un depósito reembolsable que varía según el tipo de bicicleta. El depósito se devuelve completo al retornar la bicicleta en buen estado.', 'en'), 'Yes. We require a refundable deposit that varies by bicycle type. It is returned in full when the bicycle is returned in good condition.');
assert.equal(t('Los precios varían según el tipo de bicicleta. Consulta nuestra sección de alquileres para ver las tarifas actualizadas.', 'en'), 'Prices vary by bicycle type. Visit our Rentals section for current rates.');

console.log(`PASS semantic locale catalog (${Object.keys(MESSAGES).length} bilingual keys) and verified commercial copy`);
