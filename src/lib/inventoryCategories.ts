import { doc, runTransaction, type Firestore } from 'firebase/firestore';

export async function addInventoryCategory(db: Firestore, collectionId: string, category: string): Promise<string> {
    const name = category.trim().replace(/\s+/g, ' ');
    if (!name) throw new Error('Escribe un nombre para la categoría.');
    const ref = doc(db, 'settings', collectionId);
    return runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists() && Array.isArray(snapshot.data().categories)
            ? snapshot.data().categories.filter((value: unknown): value is string => typeof value === 'string')
            : [];
        const existing = current.find((value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === name.toLocaleLowerCase());
        if (existing) return existing.trim().replace(/\s+/g, ' ');
        transaction.set(ref, { categories: [...current, name] });
        return name;
    });
}
