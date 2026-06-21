import type { InventoryItem } from '@/context/StoreContext';

const rentalPrices = {
  pricePerHour: 0, priceFrom5thHour: 0, pricePerDay: 0, pricePerWeek: 0, pricePerMonth: 0,
  price1Hour: 0, price2Hours: 0, price3Hours: 0, price4Hours: 0, price8Hours: 0, price24Hours: 0, price1Week: 0, price1Month: 0,
};

function slug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function bike(name: string, category: string, stock: number, salePrice: number, description = '', details = '', wheelSize = ''): InventoryItem {
  return {
    id: `shop_bike_${slug(name)}`, itemType: 'bike', name, category, description, details, imageUrl: '', active: true,
    availableForRental: false, availableForSale: true, hasWheelSizes: true,
    wheelSizes: [{ size: wheelSize || 'N/A', stock }], salePrice, ...rentalPrices,
  };
}

function accessory(name: string, category: string, stock: number, salePrice: number, description = '', details = ''): InventoryItem {
  return {
    id: `shop_accessory_${slug(name)}`, itemType: 'accessory', name, category, description, details, imageUrl: '', active: true,
    availableForRental: false, availableForSale: true, hasWheelSizes: false, stock, salePrice, ...rentalPrices,
  };
}

const URBAN_DESCRIPTION = 'Ingeniería hecha para durar. Pedaleo suave y eficiente. Repuestos accesibles. Menor mantenimiento. Más ahorro a largo plazo.';
const URBAN_DETAILS = 'Acero alivianado. Frenos de balata.';
const BELL_DESCRIPTION = 'Timbres clásicos para bicicleta.';
const BELL_DETAILS = 'Acabado cromado. Aleación metálica resistente. Sonido fuerte y claro.';

export const SHOP_SEED_INVENTORY: InventoryItem[] = [
  // Bicicletas urbanas reacondicionadas japonesas
  bike('Urbana Aro 26 Básica', 'Urbanas reacondicionadas japonesas', 20, 950, URBAN_DESCRIPTION, `Aro 26. ${URBAN_DETAILS}`, '26'),
  bike('Urbana Aro 26 Color Especial', 'Urbanas reacondicionadas japonesas', 22, 1200, URBAN_DESCRIPTION, `Aro 26. ${URBAN_DETAILS}`, '26'),
  bike('Urbana Aro 26 Cuadro Bajo', 'Urbanas reacondicionadas japonesas', 12, 1200, URBAN_DESCRIPTION, `Aro 26. ${URBAN_DETAILS}`, '26'),
  bike('Urbana Aro 26 Bridgestone', 'Urbanas reacondicionadas japonesas', 6, 1600, URBAN_DESCRIPTION, `Aro 26. ${URBAN_DETAILS} Marca Bridgestone.`, '26'),
  bike('Urbana Aro 26 Panasonic', 'Urbanas reacondicionadas japonesas', 1, 1600, URBAN_DESCRIPTION, `Aro 26. ${URBAN_DETAILS} Marca Panasonic.`, '26'),
  bike('Urbana Aro 26 Eleonor', 'Urbanas reacondicionadas japonesas', 3, 1400, '', `Aro 26. ${URBAN_DETAILS} Marca Eleonor.`, '26'),
  bike('Urbana Aro 26 Aluminio', 'Urbanas reacondicionadas japonesas', 6, 1600, '', 'Aro 26. Aluminio. Frenos de balata.', '26'),
  bike('Urbana Aro 26 Acero alivianado', 'Urbanas reacondicionadas japonesas', 2, 1400, '', `Aro 26. ${URBAN_DETAILS}`, '26'),
  bike('Urbana Aro 27 Acero alivianado', 'Urbanas reacondicionadas japonesas', 14, 1400, '', `Aro 27. ${URBAN_DETAILS}`, '27'),
  bike('Urbana Aro 27 Acero alivianado Económica', 'Urbanas reacondicionadas japonesas', 1, 1300, '', `Aro 27. ${URBAN_DETAILS}`, '27'),
  bike('Urbana Aro 26 - 3 Velocidades', 'Urbanas reacondicionadas japonesas', 6, 1400, '', 'Aro 26. 3 velocidades.', '26'),
  bike('Urbana Aro 26 - 6 Velocidades', 'Urbanas reacondicionadas japonesas', 5, 1400, '', 'Aro 26. 6 velocidades.', '26'),
  bike('Urbana Aro 27 - 6 Velocidades', 'Urbanas reacondicionadas japonesas', 2, 1400, '', 'Aro 27. 6 velocidades.', '27'),
  bike('Urbana Premium Aro 26 - 6 Velocidades', 'Urbanas reacondicionadas japonesas', 2, 1600, '', 'Aro 26. 6 velocidades.', '26'),
  bike('Urbana Premium Aro 27 - 6 Velocidades', 'Urbanas reacondicionadas japonesas', 5, 1600, '', 'Aro 27. 6 velocidades.', '27'),
  bike('Urbana Aro 26 Económica', 'Urbanas reacondicionadas japonesas', 2, 1200, '', 'Aro 26.', '26'),
  bike('Urbana Aro 27 Económica', 'Urbanas reacondicionadas japonesas', 3, 1200, '', 'Aro 27.', '27'),

  // Bicicletas plegables y familiares
  bike('Plegable Aro 16 - 6 Velocidades', 'Bicicletas plegables', 1, 1100, '', 'Aro 16. 6 velocidades.', '16'),
  bike('Plegable Aro 16', 'Bicicletas plegables', 1, 1100, '', 'Aro 16.', '16'),
  bike('Plegable Aro 20 - 6 Velocidades', 'Bicicletas plegables', 7, 1200, '', 'Aro 20. 6 velocidades.', '20'),
  bike('Plegable Aro 20', 'Bicicletas plegables', 1, 950, '', 'Aro 20.', '20'),
  bike('Plegable Aro 20 Aluminio - 6 Velocidades', 'Bicicletas plegables', 1, 1500, '', 'Aro 20. Aluminio. 6 velocidades.', '20'),
  bike('Plegable Aro 20 Aluminio', 'Bicicletas plegables', 1, 1500, '', 'Aro 20. Aluminio.', '20'),
  bike('Plegable Marca Especial - 6 Velocidades', 'Bicicletas plegables', 2, 2500, '', '6 velocidades.', 'N/A'),
  bike('Plegable Marca Especial', 'Bicicletas plegables', 2, 2500, '', '', 'N/A'),
  bike('Mamachari / Pelican Reacondicionada', 'Mamachari / Pelican', 2, 2500, 'Bicicleta japonesa familiar. Ideal para transporte urbano.', 'Procedencia japonesa. Reacondicionada.', '26'),

  // Bicicletas montañeras nuevas
  bike('Dynacraft Gauntlet Roja 24"', 'Montañeras nuevas', 1, 1700, '', 'Aro 24.', '24'),
  bike('Roadmaster Granite Peak 26"', 'Montañeras nuevas', 1, 1700, '', 'Aro 26.', '26'),
  bike('Genesis Whirlwind 26"', 'Montañeras nuevas', 1, 2200, '', 'Aro 26.', '26'),
  bike('Ozone 500 Black Canyon 26"', 'Montañeras nuevas', 1, 2200, '', 'Aro 26. 21 velocidades.', '26'),
  bike('Huffy Parkside Comfort 27.5"', 'Montañeras nuevas', 1, 1700, '', 'Aro 27.5.', '27.5'),
  bike('Cranbrook Comfort Cruiser 26"', 'Montañeras nuevas', 1, 1700, '', 'Aro 26.', '26'),
  bike('Schwinn Glenwood 700C', 'Montañeras nuevas', 1, 2900, '', 'Aro 700C. 21 velocidades.', '700C'),
  bike('Decathlon Rockrider ST50 26"', 'Montañeras nuevas', 1, 2900, '', 'Aro 26. 21 velocidades. Aluminio.', '26'),
  bike('Schwinn Junction 27.5"', 'Montañeras nuevas', 1, 3500, '', 'Aro 27.5. 7 velocidades.', '27.5'),
  bike('Ozark Trail Vibe 27.5"', 'Montañeras nuevas', 1, 3500, '', 'Aro 27.5.', '27.5'),
  bike('Oxford Merak 1 Aro 29', 'Montañeras nuevas', 1, 4500, '', 'Aro 29.', '29'),

  // Bicicletas para niños
  bike('Huffy Seastar Aro 12', 'Bicicletas para niños', 1, 500, '', 'Aro 12.', '12'),
  bike('Kend Little Miss Matched Aro 12', 'Bicicletas para niños', 1, 530, '', 'Aro 12. Incluye ruedas de apoyo.', '12'),
  bike('Huffy Disney Princess Aro 12', 'Bicicletas para niños', 1, 600, '', 'Aro 12. Incluye ruedas de apoyo.', '12'),
  bike('Huffy Frozen Aro 12', 'Bicicletas para niños', 1, 700, '', 'Aro 12. Incluye ruedas de apoyo.', '12'),
  bike('HyperSpeed Bicimoto Aro 16', 'Bicicletas para niños', 1, 1200, '', 'Aro 16.', '16'),
  bike('Huffy Rock It Aro 16', 'Bicicletas para niños', 1, 680, '', 'Aro 16. Incluye ruedas de apoyo.', '16'),
  bike('Dynacraft Suspect Aro 16', 'Bicicletas para niños', 1, 700, '', 'Aro 16.', '16'),
  bike('Huffy Frozen Aro 16', 'Bicicletas para niños', 1, 650, '', 'Aro 16.', '16'),
  bike('Huffy Rock It Aro 18', 'Bicicletas para niños', 1, 750, '', 'Aro 18.', '18'),
  bike('Huffy Rock It Aro 20 Azul', 'Bicicletas para niños', 1, 850, '', 'Aro 20. Color azul.', '20'),
  bike('Huffy Rock It Aro 20 Verde', 'Bicicletas para niños', 1, 850, '', 'Aro 20. Color verde.', '20'),

  // Accesorios complementarios
  accessory('Bidón de plástico reciclado 750 ml - Andriolo Proceed', 'Accesorios complementarios', 6, 65, 'Marca italiana.', 'Libre de BPA, plástico PE-LD seguro, flexible y resistente. Capacidad 750 ml.'),
  accessory('Bidón de aluminio 750 ml', 'Accesorios complementarios', 5, 85, 'Conserva la temperatura de las bebidas.', 'Aluminio. Capacidad 750 ml.'),
  accessory('Bolsa de hidratación 2 litros', 'Accesorios complementarios', 2, 100, 'Depósito flexible para mochilas de hidratación.', 'Capacidad 2 litros. Tapa rosca.'),
  accessory('Bolso / Portacelular genérico', 'Accesorios complementarios', 3, 170, 'Amplio espacio para objetos personales y celular.', 'Pantalla táctil, tela impermeable tipo fibra de carbono.'),
  accessory('Bolso trasero TRINX', 'Accesorios complementarios', 3, 95, 'Excelente espacio interno para objetos personales.', 'Nylon encerado 600D resistente.'),
  accessory('Bolso para celular SCHWINN SW777236', 'Accesorios complementarios', 3, 130, 'Protege el smartphone durante los recorridos.'),
  accessory('Bolso para manubrio SCHWINN SW5552', 'Accesorios complementarios', 19, 250, 'Alforja resistente al agua para manubrio.', 'Capacidad 5 a 8 litros. Impermeable. Marca Schwinn.'),
  accessory('Alforja impermeable MONTONERA', 'Accesorios complementarios', 8, 250, 'Alforja de carga para parrilla.', 'Lona impermeable. Capacidad 12 litros.'),
  accessory('Alforja de lana de oveja MONTONERA', 'Accesorios complementarios', 4, 700, 'Alforja artesanal para carga.', 'Lana de oveja. Medidas 33,5 x 42 cm.'),
  accessory('Alforja de cuero MONTONERA', 'Accesorios complementarios', 6, 250, 'Bolsa para manubrio elegante y funcional.', 'Cuero genuino.'),

  // Timbres, canastas y candados
  accessory('Campanilla dorada', 'Timbres y campanas', 84, 35, BELL_DESCRIPTION, BELL_DETAILS),
  accessory('Campanilla plateada', 'Timbres y campanas', 75, 35, BELL_DESCRIPTION, BELL_DETAILS),
  accessory('Campana grande SEA GULL', 'Timbres y campanas', 84, 40, BELL_DESCRIPTION, BELL_DETAILS),
  accessory('Campana pequeña CYCLE BELL', 'Timbres y campanas', 110, 35, BELL_DESCRIPTION, BELL_DETAILS),
  accessory('Canasta de mimbre sin tapa', 'Canastas', 11, 200, 'Estilo vintage para bicicletas urbanas.', 'Capacidad aproximada 5 kg.'),
  accessory('Canasta de mimbre con tapa', 'Canastas', 32, 220, 'Mayor seguridad para transportar objetos.', 'Mimbre natural tejido a mano.'),
  accessory('Canasta de mimbre con estructura metálica', 'Canastas', 2, 350, 'Canasta reforzada para mayor resistencia.', 'Base 45 cm. Profundidad 25 cm. Altura 39 cm.'),
  accessory('Canasta plástica con tapa', 'Canastas', 16, 150, 'Diseño similar al mimbre.', 'Incluye tapa con cierre.'),
  accessory('Canasta delantera de hierro', 'Canastas', 31, 150, 'Canasta urbana resistente.', 'Acero. Color plata.'),
  accessory('Canasta metálica boliviana', 'Canastas', 59, 100, 'Amplia y resistente.', 'Incluye kit de instalación. Colores negro y plateado.'),
  accessory('Canasta metálica lateral', 'Canastas', 38, 100, 'Montaje lateral para transporte.', 'Incluye kit de instalación.'),
  accessory('Candado para llanta trasera', 'Candados', 253, 50),
  accessory('Candado cable simple', 'Candados', 5, 35, '', 'Cable acero 5 mm. Longitud 1,2 m.'),
  accessory('Candado cable ARIA', 'Candados', 13, 70, '', 'Cable acero 10 mm. Longitud 1 m.'),
  accessory('Candado SCHWINN con luz en llave', 'Candados', 11, 200),
  accessory('Candado en U SCHWINN', 'Candados', 42, 200, '', 'Acero endurecido de 12 mm.'),
  accessory('Candado SCHWINN combinación', 'Candados', 32, 200),

  // Bocinas, confort y guardabarros
  accessory('Corneta / Bocina', 'Bocinas y confort', 76, 60, 'Bocina retro metálica.', 'Compatible con manillares 22.2 mm.'),
  accessory('Forro con gel para montura ARIA', 'Bocinas y confort', 14, 60, 'Mayor comodidad para recorridos largos.', 'Gel 3D. Transpirable.'),
  accessory('Guardabarros delantero y trasero ancho color celeste americanos', 'Guardabarros', 1, 130, 'Juego de guardabarros para bicicleta de 20 a 26 pulgadas, ajustable, para bicicleta de montaña o urbana, color azul.', 'Plástico de polipropileno resistente. Universales, compatibles con bicicletas de montaña o urbanas con ruedas de 20 a 27.5 pulgadas.'),
  accessory('Guardabarros delantero y trasero ancho ENLEE', 'Guardabarros', 2, 70, 'Guardabarros para bicicleta de montaña MTB delantero y trasero.', 'Resina termoplástica PP5 duradera y flexible. Universal para bicicletas de montaña y carretera. Instalación con bridas.'),
  accessory('Guardabarros delantero y trasero delgado ENLEE', 'Guardabarros', 1, 70, 'Guardabarros delantero y trasero universal, plegable, resistente al agua y al desgaste.', 'Resina termoplástica PP. Medidas 273 mm x 158 mm. Compatible con rueda delantera y trasera.'),
  accessory('Guardabarros ZTTO', 'Guardabarros', 1, 70, 'Guardabarros trasero para bicicleta de montaña.', 'Diseño gráfico tipo graffiti. Material ligero y resistente. Instalación con bridas.'),
  accessory('Guardabarros para sillín ZTTO', 'Guardabarros', 1, 70, 'Guardabarros trasero ZTTO estilo graffiti colorido.', 'Plástico resistente y duradero. Protege contra barro y agua.'),

  // Luces
  accessory('Luz a pilas (faro)', 'Luces', 187, 80, 'Luz vintage para bicicleta, lámpara delantera retro con soporte de montaje.', 'Luz blanca de 60 lm, focos LED, luz alta, baja e intermitente. Funciona con 3 baterías AAA.'),
  accessory('Luz (dínamo)', 'Luces', 120, 120, 'Lámpara de bicicleta ZHJH de 2.4 W con 6 LED y generador dínamo.', 'Generador de fricción, soporte de acero chapado en zinc, diseño a prueba de agua.'),
  accessory('Luz delantera 250 lm USB + bocina ROCKBROS 7588BL celeste', 'Luces', 1, 140, 'Luz delantera recargable USB con bocina integrada.', '250 lúmenes, bocina 140 dB, protección IPX4, tres modos de iluminación, control remoto.'),
  accessory('Luz delantera 250 lm USB + bocina ROCKBROS 7588G verde', 'Luces', 11, 140, 'Luz delantera recargable USB con bocina integrada.', '250 lúmenes, bocina 140 dB, protección IPX4, tres modos de iluminación, control remoto.'),
  accessory('Luz delantera 250 lm USB + bocina ROCKBROS 7588OR anaranjado', 'Luces', 22, 140, 'Luz delantera recargable USB con bocina integrada.', '250 lúmenes, bocina 140 dB, protección IPX4, tres modos de iluminación, control remoto.'),
  accessory('Luz delantera 350 lm LED recargable RAYPAL', 'Luces', 3, 120, 'Luz LED delantera para recorridos diarios y paseos nocturnos.', '300 lúmenes, recargable USB, incluye cable, correa ajustable para manillar.'),
  accessory('Luz delantera 350 lm USB + bocina ROCKBROS 7588OR roja', 'Luces', 4, 160, 'Faro delantero LED recargable USB, súper brillante, resistente al agua.', '350 lúmenes, bocina 140 dB, protección IPX4, tres modos de iluminación, control remoto.'),
  accessory('Luz trasera china', 'Luces', 1, 60, 'Luz trasera LED recargable por USB.', '4 modos de iluminación, resistente al agua, carga completa en aprox. 2 horas, hasta 12 horas de uso.'),
  accessory('Luz trasera 50 lm USB PROCEED', 'Luces', 1, 60, 'LED trasera recargable USB, flash impermeable.', '4 modos de iluminación, resistente al agua, carga completa en aprox. 2 horas, hasta 12 horas de uso.'),
  accessory('Luz trasera dos montajes ROCKBROS Q1', 'Luces', 2, 180, 'Luz trasera inteligente Rockbros con sensor de frenado.', 'Recargable USB, carcasa de aluminio, resistente al agua, 5 modos, montaje en riel de sillín o tija, batería 300 mAh.'),
  accessory('Luz trasera mini flexible ROCKBROS TL905', 'Luces', 10, 60, 'Lámpara/luz de goma Rockbros.', 'Carcasa de silicona roja, correa ajustable, 3 modos, IPX4, peso aprox. 17 g, funciona con baterías.'),

  // Auxiliares, parrillas y parqueos
  accessory('Llantas auxiliares para niñx color fuccia', 'Llantas auxiliares', 1, 60, 'Ruedas de entrenamiento para bicicleta infantil.', 'Color fuccia, soportes metálicos ajustables, compatibles con bicicletas aro 12.'),
  accessory('Llantas auxiliares BELL para bicicleta de niñx', 'Llantas auxiliares', 2, 150, 'Ruedas de entrenamiento Bell Spotter 500 ajustables.', 'Marca americana Bell. Regulables de aro 12 a 20. Construcción de acero inoxidable. Incluye herrajes.'),
  accessory('Parrilla para bicicleta aro 26', 'Parrillas y parqueos', 9, 85, 'Parrilla trasera cromada para bicicletas urbanas rodado 26 y 27.', 'Acero tubular cromado. Soporta hasta 20 kg. Medidas aprox. 20 cm x 36 cm.'),
  accessory('Parrilla de aluminio PROCEED Racktime Evo', 'Parrillas y parqueos', 5, 250, 'Portaequipajes de aluminio para travesías y carga.', 'Apto para aro 24 a 29. Soporta hasta 28 kg. Apto para portabebés Proceed.'),
  accessory('Parqueo individual', 'Parrillas y parqueos', 4, 200, 'Parador de bici Proceed de acero negro para estacionamiento individual.', 'Cuatro pies de goma, uso interior o garaje, apto para MTB y ruta.'),
  accessory('Parqueo grande metálico para 6 bicis color negro', 'Parrillas y parqueos', 1, 850, 'Parador de acero negro para estacionar 6 bicicletas.', 'Estructura de acero resistente. Uso en garajes, jardines o exteriores.'),
  accessory('Parqueo pequeño metálico para 3 bicis color negro', 'Parrillas y parqueos', 1, 500, 'Soporte para estacionar 3 bicicletas.', 'Acero color negro mate, compatible con neumáticos de hasta 2.5 pulgadas.'),

  // Otros accesorios y accesorios para ciclistas
  accessory('Portacelular SCHWINN SW780304', 'Otros accesorios', 30, 140, 'Soporte universal para smartphone en manubrio.', 'Correas de silicona ajustables, instalación sin herramientas, acceso a botones/cámara/conector, inserciones de espuma.'),
  accessory('Protector de cadena ENLEE', 'Otros accesorios', 5, 70, 'Protector de cadena para evitar impactos y arañazos en el cuadro.', 'Silicona suave y duradera, resistente al agua y aceite, adhesivo autoadhesivo.'),
  accessory('Puños de cuero BIXIE', 'Otros accesorios', 2, 130, 'Puños de bicicleta de cuero marrón con costuras blancas decorativas.', 'No especificado.'),
  accessory('Silla de carga de niño para parrilla azul y rojo', 'Otros accesorios', 37, 200, 'Silla trasera para transportar niños de forma segura y cómoda.', 'Colores azul y rojo. Medidas 50 cm x 39 cm. Para niñxs hasta 5 años. Soporta hasta 23 kg aprox. Incluye kit de instalación y correa de seguridad.'),
  accessory('Casco de niño Bell Sports Grasshopper', 'Accesorios para ciclistas', 1, 150, 'Casco de niño Starburst, verde y azul.', 'Edad 3 a 5 años, sistema TrueFit, ventilaciones, tecnología PinchGuard, cobertura trasera extendida.'),
  accessory('Casco de niña PEPPA PIG', 'Accesorios para ciclistas', 1, 150, 'Casco de bicicleta para niños, multicolor, 48–52 cm.', 'Edad 3 a 5 años, correa ajustable, ligero.'),
  accessory('Casco urbano', 'Accesorios para ciclistas', 6, 180, 'Casco de ciclismo con diseño aerodinámico.', 'Ajuste 360°, dial trasero, ventilaciones, acolchado interior.'),
  accessory('Casco urbano MONGOOSE MG770492 HMT 8+', 'Accesorios para ciclistas', 1, 200, 'Casco Mongoose gris mate, estilo skate/BMX.', 'Juvenil desde 8 años, multideporte, hardshell, ventilación superior, estándar CPSC y ASTM F1492.'),
  accessory('Gafas de ciclista genéricos', 'Accesorios para ciclistas', 2, 85, 'Gafas polarizadas para ciclismo, running y actividades al aire libre.', 'No especificado.'),
  accessory('Guante entero GIYO', 'Accesorios para ciclistas', 4, 200, 'Guantes para bicicleta, running, senderismo y escalada.', 'Talla L, antideslizante, tejido transpirable, compatible con pantalla táctil.'),
  accessory('Guante entero FLY LITE', 'Accesorios para ciclistas', 2, 295, 'Guantes ultraligeros para motocross, BMX y MTB.', 'Colores naranja y azul. Tallas M y S. Palma perforada, refuerzo de malla, agarres de silicona.'),
  accessory('Guante entero G-FORM SORATA GLOVES', 'Accesorios para ciclistas', 1, 340, 'Guantes para ciclismo de montaña BTT/BMX.', 'Talla S, almohadillas SmartFlex, malla transpirable, pantalla táctil, palma sintética Clarino.'),
  accessory('Kit de protección para niñxs SHIMMER & SHINE NICKELODEON', 'Accesorios para ciclistas', 7, 145, 'Kit con rodilleras, coderas y guantes.', 'Protectores de impacto, velcro ajustable, malla transpirable, recomendado 2 a 6 años.'),
  accessory('Kit de protección para niñxs FRIENDS SCHWINN', 'Accesorios para ciclistas', 37, 145, 'Set de protección infantil con rodilleras, coderas y guantes.', 'Carcasa plástica, espuma suave, malla transpirable, velcro ajustable, ideal 3 a 5 años.'),
  accessory('Reflectivos - Bandas para brazos y piernas Solden Elephant', 'Accesorios para ciclistas', 6, 70, 'Bandas reflectantes para ciclistas y corredores.', 'Incluye 2 bandas elásticas ajustables. Colores: verde-amarillo, fuccia y negro.'),
  accessory('Reflectivos - Cintas / chalecos', 'Accesorios para ciclistas', 25, 90, 'Chaleco reflectante tipo arnés de alta visibilidad.', '19 naranjas y 6 negros. Procedencia americana. Poliéster elástico, broche frontal, unitalla.'),

  // Repuestos y herramientas
  accessory('Montura china marrón y beige BC-2', 'Repuestos', 94, 120, 'Sillín vintage con remaches y sistema de suspensión por resortes.', 'Cuero sintético PU, resistente al desgaste e impermeable, doble resorte, diseño ergonómico.'),
  accessory('Montura china camel y blanco BC-1', 'Repuestos', 17, 90, 'Sillín vintage con remaches y sistema de suspensión por resortes.', 'Cuero sintético PU, resistente al desgaste e impermeable, doble resorte, diseño ergonómico.'),
  accessory('Montura china negra', 'Repuestos', 8, 60, 'Sillín vintage con remaches y sistema de suspensión por resortes.', 'Cuero sintético PU, resistente al desgaste e impermeable, doble resorte, diseño ergonómico.'),
  accessory('Montura SELLE ROYAL ONDINA comfortforcyclists classic marrón', 'Repuestos', 2, 550, 'Sillín retro para posición cómoda sentada a 90°.', 'RoyalGel, muelles traseros, longitud 253 mm, ancho 214 mm, peso 690 g.'),
  accessory('Montura SCHWINN Noseless Cruise Bike Seat negra', 'Repuestos', 1, 550, 'Asiento sin presión Schwinn para bicicleta o máquina de ejercicio.', 'Espuma de alta densidad, alivia puntos de presión, resistente al clima.'),
  accessory('Montura SCHWINN Super Midway negra', 'Repuestos', 1, 550, 'Sillín Schwinn grande para máxima comodidad.', 'Espuma suave, cubierta supersuave, transpirable, instalación con llave de 14 mm.'),
  accessory('Puño de caucho color camel / Par', 'Repuestos', 19, 45, 'Puños color camel con textura acanalada.', 'No especificado.'),
  accessory('Herramienta multiusos 10 en 1 ARIA', 'Herramientas', 10, 80, 'Multiherramienta Aria de 10 piezas en acero endurecido Cr-V.', 'Llaves Allen 2 a 8 mm, destornilladores Phillips y planos, llave T25 Torx.'),
  accessory('Herramienta multiusos TOOPRE', 'Herramientas', 1, 85, 'Kit multifuncional TOOPRE para reparaciones de bicicleta.', 'Acero cromo-vanadio y aluminio. Llaves hexagonales 2, 3, 4, 5 y 6 mm, destornillador y llave T25. Peso aprox. 109 g.'),
  accessory('Inflador bombín de pie con medidor SCHWINN SW777773', 'Herramientas', 3, 300, 'Bomba de bicicleta de pie o mano compatible con válvulas Presta y Schrader.', 'Cabezal doble, base ancha, barril de 18 pulgadas, hasta 120 PSI, mango en T, incluye aguja de pelota y cono de inflado.'),
  accessory('Inflador Mini doble válvula BOG', 'Herramientas', 41, 130, 'Inflador portátil compacto BOG.', '116 PSI, 17 cm de largo, manguera flexible, compatible con válvula Presta y de auto.'),
];

export const SHOP_SEED_CATEGORIES = Array.from(new Set(SHOP_SEED_INVENTORY.map(item => item.category).filter(Boolean))) as string[];
