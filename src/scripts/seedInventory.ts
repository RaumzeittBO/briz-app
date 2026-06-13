/**
 * Seed script for Briz inventory data.
 * Run from a React component that has Firebase access (e.g., a hidden admin page).
 */
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { InventoryItem, ComboProduct } from '../context/StoreContext';

// =========================================================================
// CATEGORIES (will be set on settings/bike_categories)
// =========================================================================
export const SEED_CATEGORIES = [
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
];

// =========================================================================
// HELPER: shorthand to create an InventoryItem
// =========================================================================
function bike(
    id: string,
    name: string,
    category: string,
    description: string,
    wheelSizes: { size: string; stock: number }[],
    prices: [number, number, number, number, number, number, number, number, number], // 1h,2h,3h,4h,extra,8h,24h,week,month
): InventoryItem {
    return {
        id,
        itemType: 'bike',
        name,
        category,
        description,
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        hasWheelSizes: true,
        wheelSizes,
        pricePerHour: prices[0],
        priceFrom5thHour: prices[4],
        pricePerDay: prices[6],
        pricePerWeek: prices[7],
        pricePerMonth: prices[8],
        price1Hour: prices[0],
        price2Hours: prices[1],
        price3Hours: prices[2],
        price4Hours: prices[3],
        price8Hours: prices[5],
        price24Hours: prices[6],
        price1Week: prices[7],
        price1Month: prices[8],
    };
}

function accessory(
    id: string,
    name: string,
    category: string,
    description: string,
    stock: number,
    prices: [number, number, number, number, number, number, number, number, number],
): InventoryItem {
    return {
        id,
        itemType: 'accessory',
        name,
        category,
        description,
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        hasWheelSizes: false,
        stock,
        pricePerHour: prices[0],
        priceFrom5thHour: prices[4],
        pricePerDay: prices[6],
        pricePerWeek: prices[7],
        pricePerMonth: prices[8],
        price1Hour: prices[0],
        price2Hours: prices[1],
        price3Hours: prices[2],
        price4Hours: prices[3],
        price8Hours: prices[5],
        price24Hours: prices[6],
        price1Week: prices[7],
        price1Month: prices[8],
    };
}

// =========================================================================
// STANDALONE ACCESSORIES (created first, referenced by combos)
// =========================================================================
export const SEED_ACCESSORIES: InventoryItem[] = [
    accessory(
        'acc_canasta_metalica',
        'Canasta metálica',
        'Accesorios',
        'Canasta metálica para bicicleta.',
        31,
        [0, 0, 0, 0, 0, 0, 0, 0, 0], // Precios por accesorio suelto aún no definidos
    ),
    accessory(
        'acc_canasta_mimbre',
        'Canasta de mimbre',
        'Accesorios',
        'Canasta de mimbre artesanal para bicicleta.',
        8,
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ),
    accessory(
        'acc_silla_bebe',
        'Silla de bebé',
        'Accesorios',
        'Silla de bebé para bicicleta.',
        14,
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ),
];

// =========================================================================
// BIKES – INVENTORY ITEMS
// =========================================================================
export const SEED_INVENTORY: InventoryItem[] = [
    // ---- URBANAS ----
    // 1. Urbana
    bike('bike_urbana', 'Urbana', 'Urbanas',
        'Ideal para cualquier ruta en la ciudad por caminos asfaltados. Pedalea con comfort, ergonomía y elegancia.',
        [{ size: '26', stock: 113 }, { size: '27', stock: 26 }],
        [25, 45, 55, 60, 10, 80, 100, 300, 600],
    ),

    // ---- MONTAÑERAS ----
    // 5. Montañera
    bike('bike_montanera', 'Montañera', 'Montañeras',
        'Diseñada para terrenos difíciles y aventuras off-road. Suspensión delantera y frenos de disco.',
        [{ size: '26', stock: 3 }, { size: '27', stock: 2 }, { size: '29', stock: 13 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800],
    ),

    // ---- DE RUTA ----
    // 8. De ruta
    bike('bike_ruta', 'De ruta', 'De ruta',
        'Ligera y aerodinámica. Para ciclistas que buscan velocidad en asfalto.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800],
    ),

    // ---- ANTIGUAS ----
    // 9. Antigua
    bike('bike_antigua', 'Antigua', 'Antiguas',
        'Bicicleta clásica estilo vintage. Pedalea con nostalgia y estilo retro por las calles de la ciudad.',
        [{ size: '26', stock: 5 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800],
    ),

    // ---- FAMILIARES / CON SILLA ----
    // 10. Urbana + silla de bebé (base bike - uses urbana stock)
    // This is actually a combo, handled separately below

    // ---- NIÑ@S ----
    // 13. Niño/a aro 12
    bike('bike_nino_12', 'Niño/a aro 12', 'Niñ@s',
        'Bicicleta infantil aro 12, ideal para los más pequeños que están aprendiendo a pedalear.',
        [{ size: '12', stock: 9 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350],
    ),
    // 14. Niño/a aro 16
    bike('bike_nino_16', 'Niño/a aro 16', 'Niñ@s',
        'Bicicleta infantil aro 16, perfecta para niños que ya dominan el equilibrio.',
        [{ size: '16', stock: 20 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350],
    ),
    // 15. Niño/a aro 20
    bike('bike_nino_20', 'Niño/a aro 20', 'Niñ@s',
        'Bicicleta juvenil aro 20, para niños más grandes listos para explorar.',
        [{ size: '20', stock: 17 }],
        [20, 35, 40, 45, 5, 60, 80, 250, 500],
    ),

    // ---- ESPECIALES URBANAS ----
    // 16. Plegable
    bike('bike_plegable', 'Plegable', 'Especiales urbanas',
        'Compacta y portátil. Se pliega fácilmente para transportarla en cualquier lugar.',
        [{ size: '20', stock: 4 }],
        [35, 65, 75, 80, 20, 120, 150, 450, 900],
    ),
    // 17. Fixie
    bike('bike_fixie', 'Fixie', 'Especiales urbanas',
        'Estilo urbano puro. Piñón fijo para una experiencia de pedaleo directa y minimalista.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800],
    ),
    // 18. Eléctrica
    bike('bike_electrica', 'Eléctrica', 'Especiales urbanas',
        'Pedaleo asistido con motor eléctrico. Recorre grandes distancias sin esfuerzo.',
        [{ size: '26', stock: 2 }],
        [60, 110, 130, 150, 30, 200, 300, 900, 2000],
    ),
    // 19. Crucero
    bike('bike_crucero', 'Crucero', 'Especiales urbanas',
        'Diseño cómodo tipo beach cruiser. Ideal para paseos tranquilos con mucho estilo.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800],
    ),

    // ---- TÁNDEM ----
    // 20. Tándem
    bike('bike_tandem', 'Tándem', 'Tándem',
        'Bicicleta para dos personas. Pedalea sincronizado con tu acompañante y disfruta juntos.',
        [{ size: '26', stock: 4 }],
        [50, 90, 110, 120, 25, 170, 200, 600, 1200],
    ),

    // ---- TRICICLOS ----
    // 21. Triciclo urbano
    bike('bike_triciclo_urbano', 'Triciclo urbano', 'Triciclos',
        'Tres ruedas para mayor estabilidad. Perfecto para paseos relajados o llevar carga.',
        [{ size: 'Único', stock: 5 }],
        [35, 65, 75, 80, 20, 120, 150, 450, 900],
    ),
    // 22. Triciclo niño/a
    bike('bike_triciclo_nino', 'Triciclo niño/a', 'Triciclos',
        'Triciclo infantil seguro y divertido. Para los más pequeños que empiezan a explorar.',
        [{ size: 'Único', stock: 5 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350],
    ),
    // 23. Triciclo carguero
    bike('bike_triciclo_carguero', 'Triciclo carguero', 'Triciclos',
        'Triciclo de carga con plataforma. Ideal para transportar mercancía o hacer delivery.',
        [{ size: 'Único', stock: 2 }],
        [50, 90, 110, 120, 25, 170, 200, 600, 1200],
    ),
    // 24. Triciclo eléctrico carguero
    bike('bike_triciclo_elec_carg', 'Triciclo eléctrico carguero', 'Triciclos',
        'Triciclo carguero con motor eléctrico. Máxima capacidad de carga con mínimo esfuerzo.',
        [{ size: 'Único', stock: 1 }],
        [80, 150, 180, 200, 40, 300, 400, 1200, 2500],
    ),

    // ---- CUATRICICLOS ----
    // 25. Cuatriciclo biplaza
    bike('bike_cuatriciclo_bi', 'Cuatriciclo biplaza', 'Cuatriciclos',
        'Vehículo de cuatro ruedas para dos personas. Diversión y estabilidad garantizada.',
        [{ size: 'Único', stock: 5 }],
        [60, 110, 130, 150, 30, 200, 300, 900, 2000],
    ),
    // 26. Cuatriciclo familiar (4 personas)
    bike('bike_cuatriciclo_fam', 'Cuatriciclo familiar (4 personas)', 'Cuatriciclos',
        'Cuatriciclo para toda la familia. Capacidad para 4 personas, perfecto para paseos en grupo.',
        [{ size: 'Único', stock: 3 }],
        [80, 150, 180, 200, 40, 300, 400, 1200, 2500],
    ),
];

// =========================================================================
// COMBOS – COMBINED PRODUCTS
// =========================================================================
export const SEED_COMBOS: ComboProduct[] = [
    // 2. Urbana + canasta metálica
    {
        id: 'combo_urbana_canasta_met',
        name: 'Urbana + canasta metálica',
        category: 'Urbanas',
        description: 'Ideal para llevar tus pertenencias al alcance de tu vista en una canasta metálica firme, asegurada al manubrio de la bicicleta.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 30,
        priceFrom5thHour: 15,
        pricePerDay: 120,
        pricePerWeek: 350,
        pricePerMonth: 700,
        price1Hour: 30,
        price2Hours: 55,
        price3Hours: 65,
        price4Hours: 70,
        price8Hours: 100,
        price24Hours: 120,
        price1Week: 350,
        price1Month: 700,
    },
    // 3. Urbana + canasta de mimbre
    {
        id: 'combo_urbana_canasta_mim',
        name: 'Urbana + canasta de mimbre',
        category: 'Urbanas',
        description: 'Lleva tus pertenencias con estilo artesanal en una canasta de mimbre clásica y elegante.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35,
        priceFrom5thHour: 15,
        pricePerDay: 130,
        pricePerWeek: 400,
        pricePerMonth: 800,
        price1Hour: 35,
        price2Hours: 60,
        price3Hours: 70,
        price4Hours: 80,
        price8Hours: 110,
        price24Hours: 130,
        price1Week: 400,
        price1Month: 800,
    },
    // 4. Urbana + canasta metálica + canasta de mimbre
    {
        id: 'combo_urbana_doble_canasta',
        name: 'Urbana + canasta metálica + canasta de mimbre',
        category: 'Urbanas',
        description: 'Máxima capacidad de carga con doble canasta: metálica al frente y mimbre trasera.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40,
        priceFrom5thHour: 15,
        pricePerDay: 140,
        pricePerWeek: 450,
        pricePerMonth: 900,
        price1Hour: 40,
        price2Hours: 70,
        price3Hours: 80,
        price4Hours: 90,
        price8Hours: 130,
        price24Hours: 140,
        price1Week: 450,
        price1Month: 900,
    },
    // 6. Montañera + canasta metálica
    {
        id: 'combo_montana_canasta_met',
        name: 'Montañera + canasta metálica',
        category: 'Montañeras',
        description: 'Montañera equipada con canasta metálica para llevar tus pertenencias en cualquier terreno.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35,
        priceFrom5thHour: 15,
        pricePerDay: 150,
        pricePerWeek: 450,
        pricePerMonth: 900,
        price1Hour: 35,
        price2Hours: 65,
        price3Hours: 75,
        price4Hours: 80,
        price8Hours: 120,
        price24Hours: 150,
        price1Week: 450,
        price1Month: 900,
    },
    // 7. Montañera + canasta de mimbre
    {
        id: 'combo_montana_canasta_mim',
        name: 'Montañera + canasta de mimbre',
        category: 'Montañeras',
        description: 'Montañera con canasta de mimbre artesanal, combinando aventura y estilo.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40,
        priceFrom5thHour: 15,
        pricePerDay: 160,
        pricePerWeek: 500,
        pricePerMonth: 1000,
        price1Hour: 40,
        price2Hours: 70,
        price3Hours: 80,
        price4Hours: 90,
        price8Hours: 130,
        price24Hours: 160,
        price1Week: 500,
        price1Month: 1000,
    },
    // 10. Urbana + silla de bebé (Familiares / con silla)
    {
        id: 'combo_urbana_silla',
        name: 'Urbana + silla de bebé',
        category: 'Familiares / con silla',
        description: 'Bicicleta urbana equipada con silla de bebé. Pedalea seguro con tu pequeño/a.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 30,
        priceFrom5thHour: 15,
        pricePerDay: 120,
        pricePerWeek: 350,
        pricePerMonth: 700,
        price1Hour: 30,
        price2Hours: 55,
        price3Hours: 65,
        price4Hours: 70,
        price8Hours: 100,
        price24Hours: 120,
        price1Week: 350,
        price1Month: 700,
    },
    // 11. Urbana + silla de bebé + canasta metálica
    {
        id: 'combo_urbana_silla_canasta_met',
        name: 'Urbana + silla de bebé + canasta metálica',
        category: 'Familiares / con silla',
        description: 'Bicicleta familiar completa: silla de bebé y canasta metálica para llevar todo lo necesario.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 35,
        priceFrom5thHour: 15,
        pricePerDay: 140,
        pricePerWeek: 400,
        pricePerMonth: 800,
        price1Hour: 35,
        price2Hours: 65,
        price3Hours: 75,
        price4Hours: 80,
        price8Hours: 120,
        price24Hours: 140,
        price1Week: 400,
        price1Month: 800,
    },
    // 12. Urbana + silla de bebé + canasta de mimbre
    {
        id: 'combo_urbana_silla_canasta_mim',
        name: 'Urbana + silla de bebé + canasta de mimbre',
        category: 'Familiares / con silla',
        description: 'Bicicleta familiar con silla de bebé y canasta de mimbre artesanal.',
        imageUrl: '',
        active: true,
        availableForRental: true,
        availableForSale: false,
        components: [
            { inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
            { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
            { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false },
        ],
        pricePerHour: 40,
        priceFrom5thHour: 15,
        pricePerDay: 150,
        pricePerWeek: 450,
        pricePerMonth: 900,
        price1Hour: 40,
        price2Hours: 70,
        price3Hours: 80,
        price4Hours: 90,
        price8Hours: 130,
        price24Hours: 150,
        price1Week: 450,
        price1Month: 900,
    },
];

// =========================================================================
// MAIN SEED FUNCTION
// =========================================================================
export async function runSeedAll(): Promise<{ success: boolean; message: string }> {
    try {
        // 1. Seed categories
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: SEED_CATEGORIES });
        console.log('✅ Categories seeded');

        // 2. Seed accessories (batch)
        const batchAcc = writeBatch(db);
        for (const acc of SEED_ACCESSORIES) {
            batchAcc.set(doc(db, 'inventory', acc.id), acc);
        }
        await batchAcc.commit();
        console.log(`✅ ${SEED_ACCESSORIES.length} accessories seeded`);

        // 3. Seed bikes (batch – Firestore batch limit is 500, we're well under)
        const batchBikes = writeBatch(db);
        for (const b of SEED_INVENTORY) {
            batchBikes.set(doc(db, 'inventory', b.id), b);
        }
        await batchBikes.commit();
        console.log(`✅ ${SEED_INVENTORY.length} bikes seeded`);

        // 4. Seed combos (batch)
        const batchCombos = writeBatch(db);
        for (const c of SEED_COMBOS) {
            batchCombos.set(doc(db, 'combos', c.id), c);
        }
        await batchCombos.commit();
        console.log(`✅ ${SEED_COMBOS.length} combos seeded`);

        const total = SEED_ACCESSORIES.length + SEED_INVENTORY.length + SEED_COMBOS.length;
        const msg = `Seed completado: ${SEED_CATEGORIES.length} categorías, ${SEED_ACCESSORIES.length} accesorios, ${SEED_INVENTORY.length} bicicletas, ${SEED_COMBOS.length} combos. Total: ${total} productos.`;
        console.log(`✅ ${msg}`);
        return { success: true, message: msg };
    } catch (error: any) {
        const msg = `Error en seed: ${error.message}`;
        console.error('❌', msg, error);
        return { success: false, message: msg };
    }
}
