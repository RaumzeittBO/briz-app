/**
 * Seed script for Briz rental inventory data.
 * Run from a React/admin context that already has Firebase access.
 */
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  RENTAL_SEED_CATEGORIES,
  RENTAL_SEED_COMBOS,
  RENTAL_SEED_INVENTORY,
} from '../data/rentalSeedData';

async function clearCollection(collectionName: 'inventory' | 'combos') {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach(item => batch.delete(doc(db, collectionName, item.id)));
  await batch.commit();
  return snap.size;
}

export async function runSeedAll(): Promise<{ success: boolean; message: string }> {
  try {
    const removedInventory = await clearCollection('inventory');
    const removedCombos = await clearCollection('combos');

    let categoryMessage = '';
    try {
      await setDoc(doc(db, 'settings', 'bike_categories'), { categories: RENTAL_SEED_CATEGORIES });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Permiso denegado';
      categoryMessage = ` No se pudo actualizar settings/bike_categories (${message}), pero cada producto conserva su categoria interna.`;
    }

    const inventoryBatch = writeBatch(db);
    RENTAL_SEED_INVENTORY.forEach(item => {
      inventoryBatch.set(doc(db, 'inventory', item.id), item);
    });
    await inventoryBatch.commit();

    const combosBatch = writeBatch(db);
    RENTAL_SEED_COMBOS.forEach(combo => {
      combosBatch.set(doc(db, 'combos', combo.id), combo);
    });
    await combosBatch.commit();

    const visibleRentalItems =
      RENTAL_SEED_INVENTORY.filter(item => item.active && item.availableForRental).length +
      RENTAL_SEED_COMBOS.length;

    return {
      success: true,
      message:
        `Seed completado: se eliminaron ${removedInventory} items y ${removedCombos} combinados previos. ` +
        `Se cargaron ${visibleRentalItems} productos de alquiler visibles con datos reales.` +
        categoryMessage,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, message: `Error en seed: ${message}` };
  }
}
