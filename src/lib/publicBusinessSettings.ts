import { collection, doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { createInitialPublicBusinessConfig, type PublicBusinessConfigUpdate } from './businessConfig';

export async function savePublicBusinessConfig(database: Firestore, actorUid: string, updates: PublicBusinessConfigUpdate): Promise<void> {
  if (!actorUid) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const changedFields = Object.keys(updates).filter(key => key !== 'updatedAt');
  if (changedFields.length === 0) return;

  const settingsRef = doc(database, 'settings', 'public_business');
  const auditRef = doc(collection(database, 'settings', 'public_business', 'audit'));
  await runTransaction(database, async transaction => {
    const current = await transaction.get(settingsRef);
    const updatedAt = serverTimestamp();
    const auditFields = current.exists()
      ? changedFields
      : ['businessName', 'phone', 'address', 'email', 'whatsapp', 'hours'];
    if (current.exists()) {
      const fields = Object.entries(updates).flatMap(([key, value]) => key === 'hours' && value && typeof value === 'object'
        ? Object.entries(value).map(([day, hours]) => [`hours.${day}`, hours])
        : [[key, value]]);
      transaction.update(settingsRef, Object.fromEntries([...fields, ['updatedAt', updatedAt]]));
    } else {
      transaction.set(settingsRef, createInitialPublicBusinessConfig(updates, updatedAt), { merge: true });
    }
    transaction.set(auditRef, { actorUid, changedFields: auditFields, createdAt: serverTimestamp() });
  });
}
