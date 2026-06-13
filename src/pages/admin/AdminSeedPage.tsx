import React, { useState, useEffect, useRef } from 'react';
import { runSeedAll, SEED_CATEGORIES, SEED_ACCESSORIES, SEED_INVENTORY, SEED_COMBOS } from '../../scripts/seedInventory';

const AdminSeedPage: React.FC = () => {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const hasRun = useRef(false);

    // Auto-run on mount
    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        handleSeed();
    }, []);

    const handleSeed = async () => {
        if (running) return;
        setRunning(true);
        setResult(null);

        const res = await runSeedAll();
        setResult(res);
        setRunning(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-brand-green">🌱 Seed de Inventario Briz</h1>
            
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-3">Resumen de datos a insertar:</h2>
                <ul className="space-y-1 text-sm">
                    <li>📁 <strong>{SEED_CATEGORIES.length} categorías:</strong> {SEED_CATEGORIES.join(', ')}</li>
                    <li>🔧 <strong>{SEED_ACCESSORIES.length} accesorios:</strong> {SEED_ACCESSORIES.map(a => a.name).join(', ')}</li>
                    <li>🚲 <strong>{SEED_INVENTORY.length} bicicletas:</strong> {SEED_INVENTORY.map(b => b.name).join(', ')}</li>
                    <li>🎁 <strong>{SEED_COMBOS.length} combos:</strong> {SEED_COMBOS.map(c => c.name).join(', ')}</li>
                </ul>
            </div>

            {running && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl shadow p-6 mb-6">
                    <p className="font-semibold text-blue-700">⏳ Insertando productos en Firestore...</p>
                    <p className="text-sm text-blue-600 mt-1">Esto puede tomar unos segundos.</p>
                </div>
            )}

            {result && (
                <div className={`rounded-xl shadow p-6 mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.success ? '✅' : '❌'} {result.message}
                    </p>
                    {result.success && (
                        <p className="text-sm text-gray-600 mt-2">
                            Ahora puedes ir a la sección de <strong>Inventario</strong> en el panel de administración para agregar las fotos a cada producto.
                        </p>
                    )}
                </div>
            )}

            {!running && (
                <button
                    onClick={handleSeed}
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-brand-green hover:bg-green-700 transition-all"
                >
                    🔄 Ejecutar de nuevo
                </button>
            )}
        </div>
    );
};

export default AdminSeedPage;
