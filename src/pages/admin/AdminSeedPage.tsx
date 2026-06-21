import React, { useState } from 'react';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  RENTAL_SEED_CATEGORIES,
  RENTAL_SEED_COMBOS,
  RENTAL_SEED_INVENTORY,
} from '../../data/rentalSeedData';
import { SHOP_SEED_INVENTORY } from '../../data/shopSeedData';

const AdminSeedPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [shopRunning, setShopRunning] = useState(false);
  const [shopDone, setShopDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const clearCollection = async (collectionName: 'inventory' | 'combos') => {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    snap.docs.forEach(item => batch.delete(doc(db, collectionName, item.id)));
    await batch.commit();
    return snap.size;
  };

  const runSeed = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setLogs([]);
    setDone(false);

    try {
      log('Limpiando inventario y productos combinados actuales...');
      const removedInventory = await clearCollection('inventory');
      const removedCombos = await clearCollection('combos');
      log(`   Eliminados: ${removedInventory} items de inventario y ${removedCombos} combinados`);

      log('Insertando accesorios y bicicletas reales...');
      const inventoryBatch = writeBatch(db);
      RENTAL_SEED_INVENTORY.forEach(item => {
        inventoryBatch.set(doc(db, 'inventory', item.id), item);
      });
      await inventoryBatch.commit();
      log(`   Listos: ${RENTAL_SEED_INVENTORY.length} items de inventario`);

      log('Insertando productos combinados reales...');
      const combosBatch = writeBatch(db);
      RENTAL_SEED_COMBOS.forEach(combo => {
        combosBatch.set(doc(db, 'combos', combo.id), combo);
      });
      await combosBatch.commit();
      log(`   Listos: ${RENTAL_SEED_COMBOS.length} combinados`);

      log('Actualizando categorías...');
      try {
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: RENTAL_SEED_CATEGORIES });
        log(`   Listas: ${RENTAL_SEED_CATEGORIES.length} categorías`);
      } catch (categoryError: unknown) {
        const categoryMessage = categoryError instanceof Error ? categoryError.message : 'Permiso denegado';
        log(`   Aviso: no se pudo actualizar settings/bike_categories (${categoryMessage})`);
        log('   Los productos igual quedaron cargados con su categoría interna.');
      }

      const visibleRentalItems =
        RENTAL_SEED_INVENTORY.filter(item => item.active && item.availableForRental).length +
        RENTAL_SEED_COMBOS.length;

      log('');
      log(`Completado: ${visibleRentalItems} productos de alquiler visibles con datos reales.`);
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      log(`Error: ${message}`);
    } finally {
      setRunning(false);
    }
  };

  const runShopSeed = async () => {
    if (shopRunning) return;
    setShopRunning(true);
    setShopDone(false);
    setError(null);

    try {
      log('Cargando catálogo de Tienda Briz sin modificar alquileres...');
      const chunkSize = 450;
      for (let index = 0; index < SHOP_SEED_INVENTORY.length; index += chunkSize) {
        const batch = writeBatch(db);
        SHOP_SEED_INVENTORY.slice(index, index + chunkSize).forEach(item => {
          batch.set(doc(db, 'inventory', item.id), item);
        });
        await batch.commit();
      }
      log(`   Listos: ${SHOP_SEED_INVENTORY.length} productos de Tienda cargados.`);
      log('   Alquileres e inventario existente no fueron eliminados.');
      setShopDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      log(`Error Tienda: ${message}`);
    } finally {
      setShopRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-brand-green">Seed de inventario Briz</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
        {logs.length === 0 && <p className="text-gray-400">Elige una acción de carga. La Tienda no modifica alquileres.</p>}
        {logs.map((line, index) => (
          <div
            key={index}
            className={
              line.includes('Error')
                ? 'text-red-600'
                : line.includes('List') || line.includes('Completado')
                  ? 'text-green-700 font-semibold'
                  : 'text-gray-700'
            }
          >
            {line}
          </div>
        ))}
        {running && <div className="text-blue-600 animate-pulse mt-2">Procesando...</div>}
      </div>

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <p className="font-semibold text-green-700">Inventario de alquiler actualizado.</p>
          <p className="text-sm text-gray-600 mt-2">
            Se borraron los productos anteriores y se cargaron únicamente los datos correctos.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-blue-800">Catálogo de Tienda Briz</h2>
        <p className="text-sm text-blue-700 mt-2">
          Inserta bicicletas, accesorios, repuestos y herramientas de venta. No borra ni modifica productos de alquiler.
        </p>
        {shopDone && <p className="text-sm font-semibold text-green-700 mt-3">Catálogo de Tienda cargado correctamente.</p>}
        <button
          onClick={runShopSeed}
          disabled={shopRunning}
          className="mt-4 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all"
        >
          {shopRunning ? 'Cargando Tienda...' : 'Cargar catálogo completo de Tienda'}
        </button>
      </div>

      {!running && (
        <button
          onClick={runSeed}
          className="px-6 py-3 rounded-lg font-semibold text-white bg-brand-green hover:bg-green-700 transition-all"
        >
          Reemplazar catálogo de alquiler
        </button>
      )}
    </div>
  );
};

export default AdminSeedPage;
