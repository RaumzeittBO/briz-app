import type { ComboProduct, InventoryItem } from '@/context/StoreContext';

type Prices = [number, number, number, number, number, number, number, number, number];

export const RENTAL_SEED_CATEGORIES = [
  'Urbanas',
  'Montañeras',
  'De ruta',
  'Antiguas',
  'Familiares / con silla',
  'Niñ@s',
  'Especiales urbanas',
  'Tándem',
  'Triciclos',
  'Cuatriciclos',
  'Combinados',
  'Accesorios',
];

const ZERO_PRICES: Prices = [0, 0, 0, 0, 0, 0, 0, 0, 0];

function withPrices<T extends Partial<InventoryItem | ComboProduct>>(target: T, p: Prices): T {
  return {
    ...target,
    pricePerHour: p[0],
    priceFrom5thHour: p[4],
    pricePerDay: p[6],
    pricePerWeek: p[7],
    pricePerMonth: p[8],
    price1Hour: p[0],
    price2Hours: p[1],
    price3Hours: p[2],
    price4Hours: p[3],
    price8Hours: p[5],
    price24Hours: p[6],
    price1Week: p[7],
    price1Month: p[8],
  };
}

function bike(
  id: string,
  name: string,
  category: string,
  description: string,
  wheelSizes: { size: string; stock: number }[],
  prices: Prices,
  details: string,
  visible = true,
): InventoryItem {
  return withPrices({
    id,
    itemType: 'bike',
    name,
    category,
    description,
    details,
    imageUrl: '',
    active: visible,
    availableForRental: visible,
    availableForSale: false,
    hasWheelSizes: true,
    wheelSizes,
  }, prices) as InventoryItem;
}

function accessory(
  id: string,
  name: string,
  description: string,
  stock: number,
  details = '',
): InventoryItem {
  return withPrices({
    id,
    itemType: 'accessory',
    name,
    category: 'Accesorios',
    description,
    details,
    imageUrl: '',
    active: true,
    availableForRental: false,
    availableForSale: false,
    hasWheelSizes: false,
    stock,
  }, ZERO_PRICES) as InventoryItem;
}

function component(inventoryItemId: string, requiresWheelSize = false) {
  return { inventoryItemId, quantity: 1, requiresWheelSize };
}

function combo(
  id: string,
  name: string,
  category: string,
  description: string,
  components: { inventoryItemId: string; quantity: number; requiresWheelSize: boolean }[],
  prices: Prices,
  details: string,
): ComboProduct {
  return withPrices({
    id,
    name,
    category,
    secondaryCategories: ['Combinados'],
    description,
    details,
    imageUrl: '',
    active: true,
    availableForRental: true,
    availableForSale: false,
    components,
  }, prices) as ComboProduct;
}

const URBANA = [25, 45, 55, 60, 10, 80, 100, 300, 600] as Prices;
const URBANA_COMBO = [30, 55, 65, 70, 15, 100, 120, 350, 700] as Prices;
const RUEDAS_ADULTO = [35, 65, 75, 80, 20, 130, 150, 350, 700] as Prices;
const FAMILIAR = [35, 55, 75, 80, 20, 120, 140, 350, 700] as Prices;
const FAMILIAR_MEDIANA = [35, 55, 75, 80, 15, 120, 140, 350, 700] as Prices;
const FAMILIAR_DOBLE = [45, 65, 95, 100, 25, 140, 160, 450, 750] as Prices;
const NINO_16_APOYO = [25, 40, 55, 60, 15, 75, 85, 250, 450] as Prices;

export const RENTAL_SEED_ACCESSORIES: InventoryItem[] = [
  accessory('acc_canasta_metalica', 'Canasta metálica', 'Canasta metálica para bicicleta. Precio suelto aún no definido.', 31),
  accessory('acc_canasta_mimbre', 'Canasta de mimbre', 'Canasta de mimbre para bicicleta. Precio suelto aún no definido.', 14),
  accessory('acc_ruedas_auxiliares_adulto', 'Ruedas auxiliares para adulto', 'Juego de ruedas auxiliares para bicicleta adulta. Precio suelto aún no definido.', 1),
  accessory('acc_silla_delantera_urbana', 'Silla delantera para urbana', 'Silla delantera para bicicleta urbana. Precio suelto aún no definido.', 1),
  accessory('acc_silla_delantera_mamachari', 'Silla delantera para mamachari', 'Silla delantera para mamachari. Precio suelto aún no definido.', 6),
  accessory('acc_silla_mediana_trasera', 'Silla mediana trasera', 'Silla mediana trasera. Precio suelto aún no definido.', 9),
  accessory('acc_silla_trasera_grande', 'Silla trasera grande', 'Silla trasera grande. Precio suelto aún no definido.', 6),
  accessory('acc_set_silla_delantera_canasta_mamachari', 'Conjunto silla delantera + canasta para mamachari', 'Conjunto para mamachari. Precio suelto aún no definido.', 1),
  accessory('acc_ruedas_apoyo_nino_16', 'Ruedas de apoyo aro 16', 'Juego de ruedas de apoyo para bicicleta aro 16. Precio suelto aún no definido.', 2),
  accessory('acc_canasta_trasera_carga', 'Canasta trasera de carga', 'Canasta trasera de carga para triciclo. Precio suelto aún no definido.', 1),
  accessory('acc_remolque_mascotas', 'Remolque para mascotas', 'Remolque para mascotas. Precio suelto aún no definido.', 3, 'Aro 20. Aluminio.'),
  accessory('acc_casco_adulto', 'Casco adulto', 'Casco para adulto. Precio suelto aún no definido.', 13),
  accessory('acc_casco_nino', 'Casco niño', 'Casco para niño. Precio suelto aún no definido.', 4),
  accessory('acc_portacelular', 'Portacelular', 'Portacelular para bicicleta. Precio suelto aún no definido.', 9),
  accessory('acc_linterna_bocina', 'Linterna delantera + bocina', 'Linterna delantera con bocina. Precio suelto aún no definido.', 2),
  accessory('acc_candado_seguridad', 'Candado de seguridad', 'Candado de seguridad. Precio suelto aún no definido.', 9),
  accessory('acc_chaleco_seguridad', 'Chalecos de seguridad', 'Chalecos de seguridad. Precio suelto aún no definido.', 3),
];

export const RENTAL_SEED_BIKES: InventoryItem[] = [
  bike('bike_urbana', 'Urbana', 'Urbanas', 'Ideal para cualquier ruta en la ciudad por caminos asfaltados. Pedalea con comfort, ergonomía y elegancia.', [{ size: '26', stock: 113 }, { size: '27', stock: 26 }], URBANA, 'Aro 26 (113 uds.) y aro 27 (26 uds.). Acero alivianado. Color según disponibilidad.'),
  bike('bike_urbana_cuadro_bajo', 'Urbana cuadro bajo', 'Urbanas', 'Ideal para personas de la 3ra edad y personas que aún no se sienten seguras en bici, debido a su cuadro bajo de un solo tubular. Pedalea con comfort, ergonomía y elegancia.', [{ size: '26', stock: 21 }], URBANA, 'Aro 26. Aluminio. Color según disponibilidad.'),
  bike('bike_montanera_26_basica', 'Montañera aro 26 básica', 'Montañeras', 'Para cualquier tipo de ruta.', [{ size: '26', stock: 1 }], URBANA, 'Aro 26. Acero alivianado.'),
  bike('bike_montanera_24', 'Montañera aro 24', 'Montañeras', 'Para cualquier tipo de ruta.', [{ size: '24', stock: 1 }], [25, 50, 70, 75, 15, 110, 130, 400, 700], 'Aro 24. Aluminio.'),
  bike('bike_montanera_26_venzo_mongoose', 'Montañera aro 26 / Venzo y Mongoose', 'Montañeras', 'Para cualquier tipo de ruta.', [{ size: '26', stock: 2 }], [25, 50, 70, 75, 15, 110, 130, 400, 700], 'Aro 26. Aluminio.'),
  bike('bike_montanera_26_wheeler', 'Montañera aro 26 / Wheeler', 'Montañeras', 'Para cualquier tipo de ruta.', [{ size: '26', stock: 1 }], [30, 55, 80, 85, 15, 130, 150, 450, 750], 'Aro 26. Aluminio. Gama alta.'),
  bike('bike_montanera_29_fera_uforever', 'Montañera aro 29 / Fera y Uforever', 'Montañeras', 'Para cualquier tipo de ruta.', [{ size: '29', stock: 2 }], [30, 55, 80, 85, 15, 130, 150, 450, 750], 'Aro 29. Aluminio.'),
  bike('bike_montanera_29_merrell_circuit', 'Montañera aro 29 / Merrell y Circuit', 'Montañeras', 'Ideal si ascenderás y descenderás en montañas.', [{ size: '29', stock: 3 }], [30, 55, 80, 85, 15, 130, 150, 450, 750], 'Aro 29. Aluminio. Frenos hidráulicos.'),
  bike('bike_rutera_varon_mujer', 'Rutera / Varón y mujer', 'De ruta', 'Ideal para entrenar en pistas o en rutas planas.', [{ size: '27', stock: 2 }], [30, 55, 65, 70, 15, 110, 130, 400, 700], 'Aro 27. Aluminio.'),
  bike('bike_antigua_phoenix', 'Antigua “Phoenix”', 'Antiguas', 'Ideal si te gustan las bicicletas antiguas y de colección. También para sesiones de fotos con caracterización de época, eventos, actividades o presentaciones de bicicletas clásicas y antiguas.', [{ size: '28', stock: 3 }], URBANA, 'Aro 28. Acero.'),
  bike('bike_antigua_chopper', 'Antigua “Chopper”', 'Antiguas', 'Ideal si te gustan las bicicletas antiguas y de colección. También para sesiones de fotos con caracterización de época, eventos, actividades o presentaciones de bicicletas clásicas y antiguas.', [{ size: '20', stock: 1 }], [30, 55, 80, 85, 20, 130, 150, 450, 750], 'Aro 20. Acero.'),
  bike('bike_mamachari', 'Mamachari', 'Familiares / con silla', 'Bicicleta base para productos familiares con silla.', [{ size: '26', stock: 6 }], ZERO_PRICES, 'Aro 26. Acero alivianado. Color según disponibilidad.', false),
  bike('bike_triciclo_nino', 'Triciclo para niño', 'Niñ@s', 'Recomendado para niñ@s de 2 a 3 años.', [{ size: '12', stock: 1 }], [15, 25, 35, 40, 10, 50, 60, 150, 300], 'Aro 12. Acero alivianado.'),
  bike('bike_nino_16', 'Niñ@ aro 16', 'Niñ@s', 'Recomendado para niñ@s de 4 a 7 años.', [{ size: '16', stock: 4 }], [20, 35, 45, 50, 10, 60, 70, 200, 400], 'Aro 16. Acero alivianado.'),
  bike('bike_nino_20', 'Niñ@ aro 20', 'Niñ@s', 'Recomendado para niñ@s de 8 a 12 años.', [{ size: '20', stock: 1 }], [20, 40, 50, 55, 10, 75, 85, 250, 450], 'Aro 20. Acero alivianado.'),
  bike('bike_bmx_cross', 'BMX Cross', 'Especiales urbanas', 'Ideal para quienes buscan diversión y aventuras.', [{ size: '20', stock: 2 }], URBANA, 'Aro 20. Acero. Color según disponibilidad.'),
  bike('bike_plegable', 'Plegable', 'Especiales urbanas', 'Ideal para quienes buscan versatilidad, diversión, aventuras y tienen un espacio pequeño de almacenamiento.', [{ size: '12', stock: 25 }, { size: '16', stock: 0 }, { size: '20', stock: 0 }], URBANA, 'Aro 12, 16 y 20. Acero alivianado. Color según disponibilidad.'),
  bike('bike_chopper', 'Chopper', 'Especiales urbanas', 'Ideal si te gusta lo diferente.', [{ size: '20', stock: 1 }], [45, 65, 85, 100, 20, 130, 150, 400, 700], 'Aro 20. Acero.'),
  bike('bike_tandem_pequena', 'Tándem / Bici doble talla pequeña', 'Tándem', 'Ideal para parejas que quieren experiencias divertidas y diferentes. También para parejas donde algun@ no sabe manejar bicicleta o aún no se siente segur@ en una.', [{ size: '26', stock: 2 }], [50, 90, 100, 120, 30, 220, 250, 500, 800], 'Aro 26. Acero.'),
  bike('bike_tandem_grande', 'Tándem / Bici doble talla grande', 'Tándem', 'Ideal para parejas que quieren experiencias divertidas y diferentes. También para parejas donde algun@ no sabe manejar bicicleta o aún no se siente segur@ en una.', [{ size: '26', stock: 5 }], [50, 90, 100, 120, 30, 220, 250, 500, 800], 'Aro 26. Acero alivianado.'),
  bike('bike_tricitandem', 'Tricitándem', 'Triciclos', 'Ideal para paseos cortos de 3 personas en caminos planos. Pedalean 3.', [{ size: '26', stock: 3 }], [80, 150, 200, 250, 60, 450, 500, 800, 1300], 'Aro 26. Acero.'),
  bike('bike_triciclo_escorpion', 'Triciclo escorpión', 'Triciclos', 'Ideal si deseas entrenar y tonificar piernas y abdomen.', [{ size: '20', stock: 1 }], [35, 65, 100, 120, 25, 190, 220, 500, 800], 'Aro 20. Acero.'),
  bike('bike_triciclo_carga_base', 'Triciclo base para canasta trasera', 'Triciclos', 'Bicicleta base para triciclo con canasta trasera de carga.', [{ size: '20', stock: 1 }], ZERO_PRICES, 'Aro 20. Acero alivianado.', false),
  bike('bike_triciretro', 'Triciretro', 'Triciclos', 'Ideal para paseos cortos en caminos planos, con niños pequeños, ancianos, personas con discapacidad para caminar o pedalear. O simplemente dar un paseo romántico con tu o tus personas especiales.', [{ size: '20', stock: 1 }], [50, 90, 120, 150, 35, 270, 300, 600, 1000], 'Aro 20. Acero.'),
  bike('bike_tricipper', 'Tricipper', 'Triciclos', 'Ideal para paseos cortos en caminos planos, con niños pequeños, ancianos, personas con discapacidad para caminar o pedalear. O simplemente dar un paseo romántico con tu o tus personas especiales.', [{ size: '20', stock: 1 }], [65, 120, 180, 200, 50, 370, 400, 700, 1200], 'Aro 20. Acero.'),
  bike('bike_triciclo_amor', 'Triciclo del amor', 'Triciclos', 'Ideal para paseos cortos en caminos planos, con niños pequeños, ancianos, personas con discapacidad para caminar o pedalear. O simplemente dar un paseo romántico con tu o tus personas especiales.', [{ size: '20', stock: 1 }], [80, 150, 210, 260, 60, 450, 500, 800, 1300], 'Aro 20. Acero.'),
  bike('bike_triciclo_familiar', 'Triciclo familiar', 'Triciclos', 'Ideal para paseos cortos en caminos planos, con niños pequeños, ancianos, personas con discapacidad para caminar o pedalear. O simplemente dar un paseo romántico con tu o tus personas especiales.', [{ size: '20', stock: 1 }], [80, 150, 210, 260, 60, 450, 500, 800, 1300], 'Aro 20. Acero.'),
  bike('bike_cuatriciclo_bipersonal', 'Cuatriciclo bipersonal', 'Cuatriciclos', 'Ideal para paseos cortos en parejas, en caminos planos. Si tienes 2 niñ@s pequeños de hasta 4 años, puedes llevarlos en la parte delantera.', [{ size: '20', stock: 2 }], [80, 150, 200, 250, 60, 450, 500, 800, 1300], 'Aro 20. Acero.'),
  bike('bike_cuatriciclo_familiar', 'Cuatriciclo familiar', 'Cuatriciclos', 'Ideal para paseos cortos familiares y grupo de amig@s, en caminos planos. Diversión para todas las edades. Si tienes 2 niñ@s pequeños de hasta 4 años, puedes llevarlos en la parte delantera.', [{ size: '20', stock: 1 }], [130, 240, 330, 400, 100, 550, 600, 1000, 1500], 'Aro 20. Acero.'),
];

export const RENTAL_SEED_COMBOS: ComboProduct[] = [
  combo('combo_urbana_canasta_metalica', 'Urbana + canasta metálica', 'Urbanas', 'Ideal para llevar tu bote de agua, cartera/billetera o lo esencial para tu rodada. Pedalea con comfort, ergonomía y elegancia.', [component('bike_urbana', true), component('acc_canasta_metalica')], URBANA_COMBO, 'Aro 26 (31 uds.) y aro 27 (26 uds.). Acero alivianado. Color según disponibilidad.'),
  combo('combo_urbana_canasta_mimbre', 'Urbana + canasta de mimbre', 'Urbanas', 'Ideal para llevar tu bote de agua, cartera/billetera o lo esencial para tu rodada. Pedalea con comfort, ergonomía y elegancia.', [component('bike_urbana', true), component('acc_canasta_mimbre')], URBANA_COMBO, 'Aro 26 (14 uds.) y aro 27 (14 uds.). Acero alivianado. Color según disponibilidad.'),
  combo('combo_urbana_cuadro_bajo_canasta_metalica', 'Urbana cuadro bajo + canasta metálica', 'Urbanas', 'Ideal para llevar tu bote de agua, cartera/billetera o lo esencial para tu rodada. Pedalea con comfort, ergonomía y elegancia.', [component('bike_urbana_cuadro_bajo', true), component('acc_canasta_metalica')], URBANA_COMBO, 'Aro 26. Aluminio. Color según disponibilidad.'),
  combo('combo_urbana_cuadro_bajo_canasta_mimbre', 'Urbana cuadro bajo + canasta de mimbre', 'Urbanas', 'Ideal para llevar tu bote de agua, cartera/billetera o lo esencial para tu rodada. Pedalea con comfort, ergonomía y elegancia.', [component('bike_urbana_cuadro_bajo', true), component('acc_canasta_mimbre')], URBANA_COMBO, 'Aro 26. Aluminio. Color según disponibilidad.'),
  combo('combo_urbana_cuadro_bajo_ruedas_auxiliares_adulto', 'Urbana cuadro bajo + ruedas auxiliares para adulto', 'Urbanas', 'Ideal si no sabes manejar bicicleta o aún no te sientes segur@ en una.', [component('bike_urbana_cuadro_bajo', true), component('acc_ruedas_auxiliares_adulto')], RUEDAS_ADULTO, 'Aro 26. Aluminio.'),
  combo('combo_mamachari_silla_delantera', 'Mamachari + silla delantera', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 4 años. Soporta hasta 25 kg aproximadamente.', [component('bike_mamachari', true), component('acc_silla_delantera_mamachari')], FAMILIAR, 'Aro 26. Acero alivianado. Color según disponibilidad.'),
  combo('combo_urbana_silla_delantera', 'Urbana + silla delantera', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 3 años. Soporta hasta 15 kg aproximadamente.', [component('bike_urbana', true), component('acc_silla_delantera_urbana')], FAMILIAR, 'Aro 26 y 27. Acero alivianado. Color según disponibilidad.'),
  combo('combo_urbana_silla_mediana_trasera', 'Urbana + silla mediana trasera', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 5 años. Soporta hasta 20 kg aproximadamente.', [component('bike_urbana', true), component('acc_silla_mediana_trasera')], FAMILIAR_MEDIANA, 'Aro 26 y 27. Acero alivianado. Color según disponibilidad.'),
  combo('combo_urbana_silla_mediana_trasera_canasta', 'Urbana + silla mediana trasera + canasta', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 5 años. Soporta hasta 20 kg aproximadamente.', [component('bike_urbana', true), component('acc_silla_mediana_trasera'), component('acc_canasta_metalica')], [45, 65, 95, 100, 20, 130, 150, 400, 700], 'Aro 26 y 27. Acero alivianado. Color según disponibilidad.'),
  combo('combo_mamachari_silla_trasera', 'Mamachari + silla trasera', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 7 años. Soporta hasta 32 kg aproximadamente.', [component('bike_mamachari', true), component('acc_silla_trasera_grande')], FAMILIAR, 'Aro 26. Acero alivianado. Color según disponibilidad.'),
  combo('combo_mamachari_2_sillas', 'Mamachari + 2 sillas', 'Familiares / con silla', 'Silla delantera recomendada para niñ@ de hasta 4 años y silla trasera para niñ@ de hasta 7 años. La delantera soporta hasta 25 kg aproximadamente y la trasera hasta 32 kg aproximadamente.', [component('bike_mamachari', true), component('acc_silla_delantera_mamachari'), component('acc_silla_trasera_grande')], FAMILIAR_DOBLE, 'Aro 26. Acero alivianado. Color según disponibilidad.'),
  combo('combo_mamachari_silla_delantera_canasta', 'Mamachari + silla delantera + canasta', 'Familiares / con silla', 'La silla se recomienda para niñ@s de hasta 4 años. Soporta hasta 25 kg aproximadamente.', [component('bike_mamachari', true), component('acc_set_silla_delantera_canasta_mamachari')], FAMILIAR_DOBLE, 'Aro 26. Acero alivianado. Color según disponibilidad.'),
  combo('combo_nino_16_ruedas_apoyo', 'Niñ@ aro 16 + ruedas de apoyo', 'Niñ@s', 'Recomendado para niñ@s de 4 a 7 años.', [component('bike_nino_16', true), component('acc_ruedas_apoyo_nino_16')], NINO_16_APOYO, 'Aro 16. Acero alivianado.'),
  combo('combo_triciclo_canasta_trasera_carga', 'Triciclo + canasta trasera de carga', 'Triciclos', 'Ideal si no sabes manejar bicicleta o aún no te sientes segur@ en una. Puedes llevar en la canasta trasera a tu mascota o niñ@ de hasta 8 años.', [component('bike_triciclo_carga_base', true), component('acc_canasta_trasera_carga')], [35, 65, 100, 120, 25, 190, 220, 500, 800], 'Aro 20. Acero alivianado.'),
];

export const RENTAL_SEED_INVENTORY: InventoryItem[] = [
  ...RENTAL_SEED_ACCESSORIES,
  ...RENTAL_SEED_BIKES,
];
