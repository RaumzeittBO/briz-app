/**
 * Standalone seed script - runs directly with Node.js
 * Writes all inventory data to Firestore
 */
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, writeBatch } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const readline = require("readline");

const firebaseConfig = {
  apiKey: "AIzaSyB7qnGS7dlZzJXJ-15WdxUaZu68pABC8go",
  authDomain: "briz-4ef3a.firebaseapp.com",
  projectId: "briz-4ef3a",
  storageBucket: "briz-4ef3a.firebasestorage.app",
  messagingSenderId: "412008664703",
  appId: "1:412008664703:web:57ac271f9feebc77ff794a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function askQuestion(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(q, ans => { rl.close(); resolve(ans); }));
}

// =========================================================================
// CATEGORIES
// =========================================================================
const CATEGORIES = [
    'Urbanas', 'Montañeras', 'De ruta', 'Antiguas',
    'Familiares / con silla', 'Niñ@s', 'Especiales urbanas',
    'Tándem', 'Triciclos', 'Cuatriciclos', 'Combinados',
];

// =========================================================================
// HELPERS
// =========================================================================
function bike(id, name, category, description, wheelSizes, prices) {
    return {
        id, itemType: 'bike', name, category, description,
        imageUrl: '', active: true,
        availableForRental: true, availableForSale: false,
        hasWheelSizes: true, wheelSizes,
        pricePerHour: prices[0], priceFrom5thHour: prices[4],
        pricePerDay: prices[6], pricePerWeek: prices[7], pricePerMonth: prices[8],
        price1Hour: prices[0], price2Hours: prices[1], price3Hours: prices[2],
        price4Hours: prices[3], price8Hours: prices[5], price24Hours: prices[6],
        price1Week: prices[7], price1Month: prices[8],
    };
}

function accessory(id, name, category, description, stock, prices) {
    return {
        id, itemType: 'accessory', name, category, description,
        imageUrl: '', active: true,
        availableForRental: true, availableForSale: false,
        hasWheelSizes: false, stock,
        pricePerHour: prices[0], priceFrom5thHour: prices[4],
        pricePerDay: prices[6], pricePerWeek: prices[7], pricePerMonth: prices[8],
        price1Hour: prices[0], price2Hours: prices[1], price3Hours: prices[2],
        price4Hours: prices[3], price8Hours: prices[5], price24Hours: prices[6],
        price1Week: prices[7], price1Month: prices[8],
    };
}

// =========================================================================
// ACCESSORIES
// =========================================================================
const ACCESSORIES = [
    accessory('acc_canasta_metalica', 'Canasta metálica', 'Accesorios',
        'Canasta metálica para bicicleta.', 31, [0,0,0,0,0,0,0,0,0]),
    accessory('acc_canasta_mimbre', 'Canasta de mimbre', 'Accesorios',
        'Canasta de mimbre artesanal para bicicleta.', 8, [0,0,0,0,0,0,0,0,0]),
    accessory('acc_silla_bebe', 'Silla de bebé', 'Accesorios',
        'Silla de bebé para bicicleta.', 14, [0,0,0,0,0,0,0,0,0]),
];

// =========================================================================
// BIKES
// Precios: 1h / 2h / 3h / 4h / hora adicional / 8h / 24h / semana / mes
// =========================================================================
const BIKES = [
    // URBANAS
    bike('bike_urbana', 'Urbana', 'Urbanas',
        'Ideal para cualquier ruta en la ciudad por caminos asfaltados. Pedalea con comfort, ergonomía y elegancia.',
        [{size:'26',stock:113},{size:'27',stock:26}],
        [25,45,55,60,10,80,100,300,600]),

    // MONTAÑERAS
    bike('bike_montanera', 'Montañera', 'Montañeras',
        'Diseñada para terrenos difíciles y aventuras off-road. Suspensión delantera y frenos de disco.',
        [{size:'26',stock:3},{size:'27',stock:2},{size:'29',stock:13}],
        [30,55,65,70,15,100,130,400,800]),

    // DE RUTA
    bike('bike_ruta', 'De ruta', 'De ruta',
        'Ligera y aerodinámica. Para ciclistas que buscan velocidad en asfalto.',
        [{size:'26',stock:3}],
        [30,55,65,70,15,100,130,400,800]),

    // ANTIGUAS
    bike('bike_antigua', 'Antigua', 'Antiguas',
        'Bicicleta clásica estilo vintage. Pedalea con nostalgia y estilo retro por las calles de la ciudad.',
        [{size:'26',stock:5}],
        [30,55,65,70,15,100,130,400,800]),

    // NIÑ@S
    bike('bike_nino_12', 'Niño/a aro 12', 'Niñ@s',
        'Bicicleta infantil aro 12, ideal para los más pequeños que están aprendiendo a pedalear.',
        [{size:'12',stock:9}],
        [15,25,30,35,5,50,60,180,350]),
    bike('bike_nino_16', 'Niño/a aro 16', 'Niñ@s',
        'Bicicleta infantil aro 16, perfecta para niños que ya dominan el equilibrio.',
        [{size:'16',stock:20}],
        [15,25,30,35,5,50,60,180,350]),
    bike('bike_nino_20', 'Niño/a aro 20', 'Niñ@s',
        'Bicicleta juvenil aro 20, para niños más grandes listos para explorar.',
        [{size:'20',stock:17}],
        [20,35,40,45,5,60,80,250,500]),

    // ESPECIALES URBANAS
    bike('bike_plegable', 'Plegable', 'Especiales urbanas',
        'Compacta y portátil. Se pliega fácilmente para transportarla en cualquier lugar.',
        [{size:'20',stock:4}],
        [35,65,75,80,20,120,150,450,900]),
    bike('bike_fixie', 'Fixie', 'Especiales urbanas',
        'Estilo urbano puro. Piñón fijo para una experiencia de pedaleo directa y minimalista.',
        [{size:'26',stock:3}],
        [30,55,65,70,15,100,130,400,800]),
    bike('bike_electrica', 'Eléctrica', 'Especiales urbanas',
        'Pedaleo asistido con motor eléctrico. Recorre grandes distancias sin esfuerzo.',
        [{size:'26',stock:2}],
        [60,110,130,150,30,200,300,900,2000]),
    bike('bike_crucero', 'Crucero', 'Especiales urbanas',
        'Diseño cómodo tipo beach cruiser. Ideal para paseos tranquilos con mucho estilo.',
        [{size:'26',stock:3}],
        [30,55,65,70,15,100,130,400,800]),

    // TÁNDEM
    bike('bike_tandem', 'Tándem', 'Tándem',
        'Bicicleta para dos personas. Pedalea sincronizado con tu acompañante y disfruta juntos.',
        [{size:'26',stock:4}],
        [50,90,110,120,25,170,200,600,1200]),

    // TRICICLOS
    bike('bike_triciclo_urbano', 'Triciclo urbano', 'Triciclos',
        'Tres ruedas para mayor estabilidad. Perfecto para paseos relajados o llevar carga.',
        [{size:'Único',stock:5}],
        [35,65,75,80,20,120,150,450,900]),
    bike('bike_triciclo_nino', 'Triciclo niño/a', 'Triciclos',
        'Triciclo infantil seguro y divertido. Para los más pequeños que empiezan a explorar.',
        [{size:'Único',stock:5}],
        [15,25,30,35,5,50,60,180,350]),
    bike('bike_triciclo_carguero', 'Triciclo carguero', 'Triciclos',
        'Triciclo de carga con plataforma. Ideal para transportar mercancía o hacer delivery.',
        [{size:'Único',stock:2}],
        [50,90,110,120,25,170,200,600,1200]),
    bike('bike_triciclo_elec_carg', 'Triciclo eléctrico carguero', 'Triciclos',
        'Triciclo carguero con motor eléctrico. Máxima capacidad de carga con mínimo esfuerzo.',
        [{size:'Único',stock:1}],
        [80,150,180,200,40,300,400,1200,2500]),

    // CUATRICICLOS
    bike('bike_cuatriciclo_bi', 'Cuatriciclo biplaza', 'Cuatriciclos',
        'Vehículo de cuatro ruedas para dos personas. Diversión y estabilidad garantizada.',
        [{size:'Único',stock:5}],
        [60,110,130,150,30,200,300,900,2000]),
    bike('bike_cuatriciclo_fam', 'Cuatriciclo familiar (4 personas)', 'Cuatriciclos',
        'Cuatriciclo para toda la familia. Capacidad para 4 personas, perfecto para paseos en grupo.',
        [{size:'Único',stock:3}],
        [80,150,180,200,40,300,400,1200,2500]),
];

// =========================================================================
// COMBOS
// =========================================================================
const COMBOS = [
    // Urbana + canasta metálica
    {
        id: 'combo_urbana_canasta_met',
        name: 'Urbana + canasta metálica',
        category: 'Urbanas',
        description: 'Ideal para llevar tus pertenencias al alcance de tu vista en una canasta metálica firme, asegurada al manubrio de la bicicleta.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 30, priceFrom5thHour: 15, pricePerDay: 120, pricePerWeek: 350, pricePerMonth: 700,
        price1Hour: 30, price2Hours: 55, price3Hours: 65, price4Hours: 70,
        price8Hours: 100, price24Hours: 120, price1Week: 350, price1Month: 700,
    },
    // Urbana + canasta de mimbre
    {
        id: 'combo_urbana_canasta_mim',
        name: 'Urbana + canasta de mimbre',
        category: 'Urbanas',
        description: 'Lleva tus pertenencias con estilo artesanal en una canasta de mimbre clásica y elegante.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35, priceFrom5thHour: 15, pricePerDay: 130, pricePerWeek: 400, pricePerMonth: 800,
        price1Hour: 35, price2Hours: 60, price3Hours: 70, price4Hours: 80,
        price8Hours: 110, price24Hours: 130, price1Week: 400, price1Month: 800,
    },
    // Urbana + canasta metálica + canasta de mimbre
    {
        id: 'combo_urbana_doble_canasta',
        name: 'Urbana + canasta metálica + canasta de mimbre',
        category: 'Urbanas',
        description: 'Máxima capacidad de carga con doble canasta: metálica al frente y mimbre trasera.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40, priceFrom5thHour: 15, pricePerDay: 140, pricePerWeek: 450, pricePerMonth: 900,
        price1Hour: 40, price2Hours: 70, price3Hours: 80, price4Hours: 90,
        price8Hours: 130, price24Hours: 140, price1Week: 450, price1Month: 900,
    },
    // Montañera + canasta metálica
    {
        id: 'combo_montana_canasta_met',
        name: 'Montañera + canasta metálica',
        category: 'Montañeras',
        description: 'Montañera equipada con canasta metálica para llevar tus pertenencias en cualquier terreno.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35, priceFrom5thHour: 15, pricePerDay: 150, pricePerWeek: 450, pricePerMonth: 900,
        price1Hour: 35, price2Hours: 65, price3Hours: 75, price4Hours: 80,
        price8Hours: 120, price24Hours: 150, price1Week: 450, price1Month: 900,
    },
    // Montañera + canasta de mimbre
    {
        id: 'combo_montana_canasta_mim',
        name: 'Montañera + canasta de mimbre',
        category: 'Montañeras',
        description: 'Montañera con canasta de mimbre artesanal, combinando aventura y estilo.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40, priceFrom5thHour: 15, pricePerDay: 160, pricePerWeek: 500, pricePerMonth: 1000,
        price1Hour: 40, price2Hours: 70, price3Hours: 80, price4Hours: 90,
        price8Hours: 130, price24Hours: 160, price1Week: 500, price1Month: 1000,
    },
    // Urbana + silla de bebé
    {
        id: 'combo_urbana_silla',
        name: 'Urbana + silla de bebé',
        category: 'Familiares / con silla',
        description: 'Bicicleta urbana equipada con silla de bebé. Pedalea seguro con tu pequeño/a.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 30, priceFrom5thHour: 15, pricePerDay: 120, pricePerWeek: 350, pricePerMonth: 700,
        price1Hour: 30, price2Hours: 55, price3Hours: 65, price4Hours: 70,
        price8Hours: 100, price24Hours: 120, price1Week: 350, price1Month: 700,
    },
    // Urbana + silla de bebé + canasta metálica
    {
        id: 'combo_urbana_silla_canasta_met',
        name: 'Urbana + silla de bebé + canasta metálica',
        category: 'Familiares / con silla',
        description: 'Bicicleta familiar completa: silla de bebé y canasta metálica para llevar todo lo necesario.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35, priceFrom5thHour: 15, pricePerDay: 140, pricePerWeek: 400, pricePerMonth: 800,
        price1Hour: 35, price2Hours: 65, price3Hours: 75, price4Hours: 80,
        price8Hours: 120, price24Hours: 140, price1Week: 400, price1Month: 800,
    },
    // Urbana + silla de bebé + canasta de mimbre
    {
        id: 'combo_urbana_silla_canasta_mim',
        name: 'Urbana + silla de bebé + canasta de mimbre',
        category: 'Familiares / con silla',
        description: 'Bicicleta familiar con silla de bebé y canasta de mimbre artesanal.',
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40, priceFrom5thHour: 15, pricePerDay: 150, pricePerWeek: 450, pricePerMonth: 900,
        price1Hour: 40, price2Hours: 70, price3Hours: 80, price4Hours: 90,
        price8Hours: 130, price24Hours: 150, price1Week: 450, price1Month: 900,
    },
];

// =========================================================================
// MAIN
// =========================================================================
async function main() {
    console.log('🚀 Seed de inventario Briz');
    console.log('═══════════════════════════════════════════');
    console.log('Primero necesitas iniciar sesión con tu cuenta de administrador.\n');

    const email = await askQuestion('📧 Email: ');
    const password = await askQuestion('🔑 Contraseña: ');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('\n✅ Sesión iniciada correctamente.\n');
    } catch (e) {
        console.error('❌ Error de autenticación:', e.message);
        process.exit(1);
    }

    try {
        console.log('Insertando datos en Firestore...\n');

        // 1. Categories
        console.log('📁 Insertando categorías...');
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: CATEGORIES });
        console.log(`   ✅ ${CATEGORIES.length} categorías insertadas\n`);

        // 2. Accessories
        console.log('🔧 Insertando accesorios...');
        const batchAcc = writeBatch(db);
        ACCESSORIES.forEach(a => batchAcc.set(doc(db, 'inventory', a.id), a));
        await batchAcc.commit();
        console.log(`   ✅ ${ACCESSORIES.length} accesorios insertados\n`);

        // 3. Bikes
        console.log('🚲 Insertando bicicletas...');
        const batchBikes = writeBatch(db);
        BIKES.forEach(b => batchBikes.set(doc(db, 'inventory', b.id), b));
        await batchBikes.commit();
        console.log(`   ✅ ${BIKES.length} bicicletas insertadas\n`);

        // 4. Combos
        console.log('🎁 Insertando combos...');
        const batchCombos = writeBatch(db);
        COMBOS.forEach(c => batchCombos.set(doc(db, 'combos', c.id), c));
        await batchCombos.commit();
        console.log(`   ✅ ${COMBOS.length} combos insertados\n`);

        const total = ACCESSORIES.length + BIKES.length + COMBOS.length;
        console.log('═══════════════════════════════════════════');
        console.log(`🎉 ¡SEED COMPLETADO!`);
        console.log(`   📁 ${CATEGORIES.length} categorías`);
        console.log(`   🔧 ${ACCESSORIES.length} accesorios`);
        console.log(`   🚲 ${BIKES.length} bicicletas`);
        console.log(`   🎁 ${COMBOS.length} combos`);
        console.log(`   📦 ${total} productos totales`);
        console.log('═══════════════════════════════════════════');
        console.log('\n✅ Todos los datos ya están en Firestore.');
        console.log('👉 Ahora puedes agregar las fotos desde el panel de administración.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();

