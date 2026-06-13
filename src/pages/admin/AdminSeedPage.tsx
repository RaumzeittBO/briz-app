import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import type { InventoryItem, ComboProduct } from '../../context/StoreContext';

// =========================================================================
// DATA DEFINITIONS
// =========================================================================
const CATEGORIES = [
    'Urbanas', 'Montañeras', 'De ruta', 'Antiguas',
    'Familiares / con silla', 'Niñ@s', 'Especiales urbanas',
    'Tándem', 'Triciclos', 'Cuatriciclos', 'Combinados',
];

function mkBike(
    id: string, name: string, category: string, description: string,
    wheelSizes: { size: string; stock: number }[],
    p: [number, number, number, number, number, number, number, number, number],
): InventoryItem {
    return {
        id, itemType: 'bike', name, category, description,
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        hasWheelSizes: true, wheelSizes,
        pricePerHour: p[0], priceFrom5thHour: p[4],
        pricePerDay: p[6], pricePerWeek: p[7], pricePerMonth: p[8],
        price1Hour: p[0], price2Hours: p[1], price3Hours: p[2],
        price4Hours: p[3], price8Hours: p[5], price24Hours: p[6],
        price1Week: p[7], price1Month: p[8],
    };
}

function mkAcc(
    id: string, name: string, description: string, stock: number,
): InventoryItem {
    return {
        id, itemType: 'accessory', name, category: 'Accesorios', description,
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        hasWheelSizes: false, stock,
        pricePerHour: 0, priceFrom5thHour: 0,
        pricePerDay: 0, pricePerWeek: 0, pricePerMonth: 0,
        price1Hour: 0, price2Hours: 0, price3Hours: 0,
        price4Hours: 0, price8Hours: 0, price24Hours: 0,
        price1Week: 0, price1Month: 0,
    };
}

const ACCESSORIES: InventoryItem[] = [
    mkAcc('acc_canasta_metalica', 'Canasta metálica', 'Canasta metálica para bicicleta.', 31),
    mkAcc('acc_canasta_mimbre', 'Canasta de mimbre', 'Canasta de mimbre artesanal para bicicleta.', 8),
    mkAcc('acc_silla_bebe', 'Silla de bebé', 'Silla de bebé para bicicleta.', 14),
];

const BIKES: InventoryItem[] = [
    mkBike('bike_urbana', 'Urbana', 'Urbanas',
        'Ideal para cualquier ruta en la ciudad por caminos asfaltados. Pedalea con comfort, ergonomía y elegancia.',
        [{ size: '26', stock: 113 }, { size: '27', stock: 26 }],
        [25, 45, 55, 60, 10, 80, 100, 300, 600]),
    mkBike('bike_montanera', 'Montañera', 'Montañeras',
        'Diseñada para terrenos difíciles y aventuras off-road. Suspensión delantera y frenos de disco.',
        [{ size: '26', stock: 3 }, { size: '27', stock: 2 }, { size: '29', stock: 13 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800]),
    mkBike('bike_ruta', 'De ruta', 'De ruta',
        'Ligera y aerodinámica. Para ciclistas que buscan velocidad en asfalto.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800]),
    mkBike('bike_antigua', 'Antigua', 'Antiguas',
        'Bicicleta clásica estilo vintage. Pedalea con nostalgia y estilo retro por las calles de la ciudad.',
        [{ size: '26', stock: 5 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800]),
    mkBike('bike_nino_12', 'Niño/a aro 12', 'Niñ@s',
        'Bicicleta infantil aro 12, ideal para los más pequeños que están aprendiendo a pedalear.',
        [{ size: '12', stock: 9 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350]),
    mkBike('bike_nino_16', 'Niño/a aro 16', 'Niñ@s',
        'Bicicleta infantil aro 16, perfecta para niños que ya dominan el equilibrio.',
        [{ size: '16', stock: 20 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350]),
    mkBike('bike_nino_20', 'Niño/a aro 20', 'Niñ@s',
        'Bicicleta juvenil aro 20, para niños más grandes listos para explorar.',
        [{ size: '20', stock: 17 }],
        [20, 35, 40, 45, 5, 60, 80, 250, 500]),
    mkBike('bike_plegable', 'Plegable', 'Especiales urbanas',
        'Compacta y portátil. Se pliega fácilmente para transportarla en cualquier lugar.',
        [{ size: '20', stock: 4 }],
        [35, 65, 75, 80, 20, 120, 150, 450, 900]),
    mkBike('bike_fixie', 'Fixie', 'Especiales urbanas',
        'Estilo urbano puro. Piñón fijo para una experiencia de pedaleo directa y minimalista.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800]),
    mkBike('bike_electrica', 'Eléctrica', 'Especiales urbanas',
        'Pedaleo asistido con motor eléctrico. Recorre grandes distancias sin esfuerzo.',
        [{ size: '26', stock: 2 }],
        [60, 110, 130, 150, 30, 200, 300, 900, 2000]),
    mkBike('bike_crucero', 'Crucero', 'Especiales urbanas',
        'Diseño cómodo tipo beach cruiser. Ideal para paseos tranquilos con mucho estilo.',
        [{ size: '26', stock: 3 }],
        [30, 55, 65, 70, 15, 100, 130, 400, 800]),
    mkBike('bike_tandem', 'Tándem', 'Tándem',
        'Bicicleta para dos personas. Pedalea sincronizado con tu acompañante y disfruta juntos.',
        [{ size: '26', stock: 4 }],
        [50, 90, 110, 120, 25, 170, 200, 600, 1200]),
    mkBike('bike_triciclo_urbano', 'Triciclo urbano', 'Triciclos',
        'Tres ruedas para mayor estabilidad. Perfecto para paseos relajados o llevar carga.',
        [{ size: 'Único', stock: 5 }],
        [35, 65, 75, 80, 20, 120, 150, 450, 900]),
    mkBike('bike_triciclo_nino', 'Triciclo niño/a', 'Triciclos',
        'Triciclo infantil seguro y divertido. Para los más pequeños que empiezan a explorar.',
        [{ size: 'Único', stock: 5 }],
        [15, 25, 30, 35, 5, 50, 60, 180, 350]),
    mkBike('bike_triciclo_carguero', 'Triciclo carguero', 'Triciclos',
        'Triciclo de carga con plataforma. Ideal para transportar mercancía o hacer delivery.',
        [{ size: 'Único', stock: 2 }],
        [50, 90, 110, 120, 25, 170, 200, 600, 1200]),
    mkBike('bike_triciclo_elec_carg', 'Triciclo eléctrico carguero', 'Triciclos',
        'Triciclo carguero con motor eléctrico. Máxima capacidad de carga con mínimo esfuerzo.',
        [{ size: 'Único', stock: 1 }],
        [80, 150, 180, 200, 40, 300, 400, 1200, 2500]),
    mkBike('bike_cuatriciclo_bi', 'Cuatriciclo biplaza', 'Cuatriciclos',
        'Vehículo de cuatro ruedas para dos personas. Diversión y estabilidad garantizada.',
        [{ size: 'Único', stock: 5 }],
        [60, 110, 130, 150, 30, 200, 300, 900, 2000]),
    mkBike('bike_cuatriciclo_fam', 'Cuatriciclo familiar (4 personas)', 'Cuatriciclos',
        'Cuatriciclo para toda la familia. Capacidad para 4 personas, perfecto para paseos en grupo.',
        [{ size: 'Único', stock: 3 }],
        [80, 150, 180, 200, 40, 300, 400, 1200, 2500]),
];

function mkCombo(
    id: string, name: string, category: string, description: string,
    components: { inventoryItemId: string; quantity: number; requiresWheelSize: boolean }[],
    p: [number, number, number, number, number, number, number, number, number],
): ComboProduct {
    return {
        id, name, category, description,
        imageUrl: '', active: true, availableForRental: true, availableForSale: false,
        components,
        pricePerHour: p[0], priceFrom5thHour: p[4],
        pricePerDay: p[6], pricePerWeek: p[7], pricePerMonth: p[8],
        price1Hour: p[0], price2Hours: p[1], price3Hours: p[2],
        price4Hours: p[3], price8Hours: p[5], price24Hours: p[6],
        price1Week: p[7], price1Month: p[8],
    };
}

const COMBOS: ComboProduct[] = [
    mkCombo('combo_urbana_canasta_met', 'Urbana + canasta metálica', 'Urbanas',
        'Ideal para llevar tus pertenencias al alcance de tu vista en una canasta metálica firme, asegurada al manubrio de la bicicleta.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false }],
        [30, 55, 65, 70, 15, 100, 120, 350, 700]),
    mkCombo('combo_urbana_canasta_mim', 'Urbana + canasta de mimbre', 'Urbanas',
        'Lleva tus pertenencias con estilo artesanal en una canasta de mimbre clásica y elegante.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false }],
        [35, 60, 70, 80, 15, 110, 130, 400, 800]),
    mkCombo('combo_urbana_doble_canasta', 'Urbana + canasta metálica + canasta de mimbre', 'Urbanas',
        'Máxima capacidad de carga con doble canasta: metálica al frente y mimbre trasera.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false },
         { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false }],
        [40, 70, 80, 90, 15, 130, 140, 450, 900]),
    mkCombo('combo_montana_canasta_met', 'Montañera + canasta metálica', 'Montañeras',
        'Montañera equipada con canasta metálica para llevar tus pertenencias en cualquier terreno.',
        [{ inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false }],
        [35, 65, 75, 80, 15, 120, 150, 450, 900]),
    mkCombo('combo_montana_canasta_mim', 'Montañera + canasta de mimbre', 'Montañeras',
        'Montañera con canasta de mimbre artesanal, combinando aventura y estilo.',
        [{ inventoryItemId: 'bike_montanera', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false }],
        [40, 70, 80, 90, 15, 130, 160, 500, 1000]),
    mkCombo('combo_urbana_silla', 'Urbana + silla de bebé', 'Familiares / con silla',
        'Bicicleta urbana equipada con silla de bebé. Pedalea seguro con tu pequeño/a.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false }],
        [30, 55, 65, 70, 15, 100, 120, 350, 700]),
    mkCombo('combo_urbana_silla_canasta_met', 'Urbana + silla de bebé + canasta metálica', 'Familiares / con silla',
        'Bicicleta familiar completa: silla de bebé y canasta metálica para llevar todo lo necesario.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
         { inventoryItemId: 'acc_canasta_metalica', quantity: 1, requiresWheelSize: false }],
        [35, 65, 75, 80, 15, 120, 140, 400, 800]),
    mkCombo('combo_urbana_silla_canasta_mim', 'Urbana + silla de bebé + canasta de mimbre', 'Familiares / con silla',
        'Bicicleta familiar con silla de bebé y canasta de mimbre artesanal.',
        [{ inventoryItemId: 'bike_urbana', quantity: 1, requiresWheelSize: true },
         { inventoryItemId: 'acc_silla_bebe', quantity: 1, requiresWheelSize: false },
         { inventoryItemId: 'acc_canasta_mimbre', quantity: 1, requiresWheelSize: false }],
        [40, 70, 80, 90, 15, 130, 150, 450, 900]),
];

// =========================================================================
// COMPONENT
// =========================================================================
const AdminSeedPage: React.FC = () => {
    const store = useStore();
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasRun = useRef(false);

    const log = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        if (hasRun.current || !store.isLoaded) return;
        hasRun.current = true;
        runSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.isLoaded]);

    const runSeed = async () => {
        if (running) return;
        setRunning(true);
        setError(null);
        setLogs([]);
        setDone(false);

        try {
            // 1. Categories
            log('📁 Insertando categorías...');
            for (const cat of CATEGORIES) {
                if (!store.bikeCategories.includes(cat)) {
                    await store.addBikeCategory(cat);
                }
            }
            log(`   ✅ ${CATEGORIES.length} categorías listas`);

            // 2. Accessories
            log('🔧 Insertando accesorios...');
            for (const acc of ACCESSORIES) {
                const exists = store.inventory.find(i => i.id === acc.id);
                if (!exists) {
                    await store.addInventoryItem(acc);
                    log(`   + ${acc.name}`);
                } else {
                    log(`   ⏭ ${acc.name} (ya existe)`);
                }
            }
            log(`   ✅ Accesorios listos`);

            // 3. Bikes
            log('🚲 Insertando bicicletas...');
            for (const bike of BIKES) {
                const exists = store.inventory.find(i => i.id === bike.id);
                if (!exists) {
                    await store.addInventoryItem(bike);
                    log(`   + ${bike.name} (${bike.category})`);
                } else {
                    log(`   ⏭ ${bike.name} (ya existe)`);
                }
            }
            log(`   ✅ Bicicletas listas`);

            // 4. Combos
            log('🎁 Insertando combos...');
            for (const combo of COMBOS) {
                const exists = store.combos.find(c => c.id === combo.id);
                if (!exists) {
                    await store.addCombo(combo);
                    log(`   + ${combo.name} (${combo.category})`);
                } else {
                    log(`   ⏭ ${combo.name} (ya existe)`);
                }
            }
            log(`   ✅ Combos listos`);

            const total = ACCESSORIES.length + BIKES.length + COMBOS.length;
            log('');
            log(`🎉 ¡COMPLETADO! ${CATEGORIES.length} categorías, ${ACCESSORIES.length} accesorios, ${BIKES.length} bicicletas, ${COMBOS.length} combos = ${total} productos totales`);
            setDone(true);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            log(`❌ Error: ${err.message}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-brand-green">🌱 Seed de Inventario Briz</h1>

            <div className="bg-white rounded-xl shadow p-6 mb-6 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {logs.length === 0 && <p className="text-gray-400">Esperando a que el store cargue...</p>}
                {logs.map((line, i) => (
                    <div key={i} className={line.includes('❌') ? 'text-red-600' : line.includes('✅') || line.includes('🎉') ? 'text-green-700 font-semibold' : 'text-gray-700'}>
                        {line}
                    </div>
                ))}
                {running && <div className="text-blue-600 animate-pulse mt-2">⏳ Procesando...</div>}
            </div>

            {done && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                    <p className="font-semibold text-green-700">✅ ¡Todos los productos están en Firestore!</p>
                    <p className="text-sm text-gray-600 mt-2">
                        Ve a <strong>Inventario</strong> en el menú lateral para agregar las fotos.
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <p className="font-semibold text-red-700">❌ {error}</p>
                </div>
            )}

            {!running && (
                <button
                    onClick={() => { hasRun.current = false; runSeed(); }}
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-brand-green hover:bg-green-700 transition-all"
                >
                    🔄 Ejecutar de nuevo
                </button>
            )}
        </div>
    );
};

export default AdminSeedPage;
