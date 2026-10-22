import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { ARTWORK_REGISTRY, ARTWORK_VARIANTS, assertArtworkVariantsAcyclic, type ArtworkOverride, type ArtworkOverrides, type ArtworkSlotId, type ArtworkVariant } from '@/lib/artworkRegistry';
import { validateArtworkFileContent } from '@/lib/artworkFileValidation';
export { ALLOWED_ARTWORK_TYPES, MAX_ARTWORK_BYTES, validateArtworkFile, validateArtworkFileContent } from '@/lib/artworkFileValidation';
export type ArtworkDraft = { id: string; ownerUid: string; slotId: ArtworkSlotId; variant: ArtworkVariant; storagePath: string; contentType: string; size: number; width: number; height: number; updatedAt?: unknown };
export type ArtworkVersion = { id: string; variants: Partial<Record<ArtworkVariant, ArtworkOverride>>; actorUid: string; action: 'publish' | 'restore' | 'share'; createdAt?: unknown; restoredFrom?: string };

export function artworkPublicationId(slotId: ArtworkSlotId, variant: ArtworkVariant, storagePath: string) {
    const prefix = `public-assets/artworks/${slotId}/${variant}/`;
    const fileName = storagePath.startsWith(prefix) ? storagePath.slice(prefix.length) : '';
    if (!/^[A-Za-z0-9_-]+\.(png|jpg|webp)$/.test(fileName)) {
        throw new Error('La ruta del arte publicado no es válida. Vuelve a subir la imagen.');
    }
    return `${slotId}__${variant}__${fileName}`;
}

function withPublicationIds(slotId: ArtworkSlotId, variants: Partial<Record<ArtworkVariant, ArtworkOverride>>) {
    const normalized = { ...variants };
    for (const variant of ARTWORK_VARIANTS) {
        const override = normalized[variant];
        if (override?.storagePath) {
            const prefix = `public-assets/artworks/${slotId}/${variant}/`;
            const publicationFileName = override.storagePath.slice(prefix.length);
            normalized[variant] = {
                ...override,
                publicationFileName,
                publicationId: artworkPublicationId(slotId, variant, override.storagePath),
            };
        }
    }
    assertArtworkVariantsAcyclic(normalized);
    return normalized;
}

export function artworkDraftId(uid: string, slotId: ArtworkSlotId, variant: ArtworkVariant) {
    return `${uid}_${slotId}_${variant}`;
}

export async function inspectArtworkFile(file: File): Promise<{ width: number; height: number }> {
    await validateArtworkFileContent(file);
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('No se pudieron leer las dimensiones de la imagen.');
        return { width: image.naturalWidth, height: image.naturalHeight };
    } finally { URL.revokeObjectURL(url); }
}

export async function saveArtworkDraft(args: { uid: string; slotId: ArtworkSlotId; variant: ArtworkVariant; file: File; width: number; height: number }): Promise<ArtworkDraft> {
    await validateArtworkFileContent(args.file);
    if (!(args.slotId in ARTWORK_REGISTRY)) throw new Error('El arte seleccionado no está registrado.');
    const id = artworkDraftId(args.uid, args.slotId, args.variant);
    const draftRef = doc(db, 'artworkDrafts', id);
    const previousSnapshot = await getDoc(draftRef);
    const previousPath = previousSnapshot.exists() ? (previousSnapshot.data() as ArtworkDraft).storagePath : null;
    const extension = args.file.type === 'image/jpeg' ? 'jpg' : args.file.type === 'image/png' ? 'png' : 'webp';
    // Artwork objects are immutable, versioned paths. Storage Rules keep each
    // object private until Firestore's public config points at that exact path.
    const storagePath = `public-assets/artworks/${args.slotId}/${args.variant}/${Date.now()}_${crypto.randomUUID()}.${extension}`;
    await uploadBytes(ref(storage, storagePath), args.file, { contentType: args.file.type, cacheControl: 'private, max-age=0, no-cache' });
    const draft: ArtworkDraft = { id, ownerUid: args.uid, slotId: args.slotId, variant: args.variant, storagePath, contentType: args.file.type, size: args.file.size, width: args.width, height: args.height };
    try {
        await setDoc(draftRef, { ...draft, updatedAt: serverTimestamp() });
    } catch (error) {
        await deleteObject(ref(storage, storagePath)).catch(() => undefined);
        throw error;
    }
    if (previousPath && previousPath !== storagePath) await deleteObject(ref(storage, previousPath)).catch(() => undefined);
    return draft;
}

async function writeVersion(slotId: ArtworkSlotId, buildVariants: (current: Partial<Record<ArtworkVariant, ArtworkOverride>>) => Partial<Record<ArtworkVariant, ArtworkOverride>>, actorUid: string, action: ArtworkVersion['action'], restoredFrom?: string) {
    const versionId = `${Date.now()}_${crypto.randomUUID()}`;
    const configRef = doc(db, 'publicArtworkConfig', slotId);
    const versionRef = doc(collection(configRef, 'versions'), versionId);
    await runTransaction(db, async (transaction) => {
        const current = await transaction.get(configRef);
        const currentVariants = (current.exists() ? current.data().variants : {}) as Partial<Record<ArtworkVariant, ArtworkOverride>>;
        // Validate before any write so a cyclic shared configuration can never
        // become the current version, even if resolution has a fallback.
        const variants = withPublicationIds(slotId, buildVariants(currentVariants));
        const locks = ARTWORK_VARIANTS.flatMap((variant) => {
            const override = variants[variant];
            if (!override?.storagePath || !override.publicationId) return [];
            return [{ variant, override, ref: doc(db, 'publishedArtworkFiles', override.publicationId) }];
        });
        const lockSnapshots = await Promise.all(locks.map(({ ref: lockRef }) => transaction.get(lockRef)));
        transaction.set(versionRef, { id: versionId, variants, actorUid, action, ...(restoredFrom ? { restoredFrom } : {}), createdAt: serverTimestamp() });
        transaction.set(configRef, { slotId, variants, currentVersionId: versionId, updatedAt: serverTimestamp() });
        locks.forEach(({ variant, override, ref: lockRef }, index) => {
            if (!lockSnapshots[index].exists()) {
                transaction.set(lockRef, {
                    id: override.publicationId,
                    slotId,
                    variant,
                    storagePath: override.storagePath,
                    fileName: override.publicationFileName,
                    createdAt: serverTimestamp(),
                });
            }
        });
    });
    return versionId;
}

export async function publishArtworkDraft(draft: ArtworkDraft, actorUid: string) {
    const expectedPrefix = `public-assets/artworks/${draft.slotId}/${draft.variant}/`;
    if (!draft.storagePath.startsWith(expectedPrefix)) throw new Error('El borrador no tiene una ruta de arte válida. Vuelve a subir la imagen.');
    const url = await getDownloadURL(ref(storage, draft.storagePath));
    const versionId = await writeVersion(draft.slotId, (variants) => ({ ...variants, [draft.variant]: { url, storagePath: draft.storagePath } }), actorUid, 'publish');
    return { url, versionId };
}

export async function publishSharedArtworkVariant(slotId: ArtworkSlotId, variant: ArtworkVariant, sourceVariant: ArtworkVariant, actorUid: string) {
    return writeVersion(slotId, (variants) => ({ ...variants, [variant]: { sourceVariant } }), actorUid, 'share');
}

export async function restoreArtworkVersion(slotId: ArtworkSlotId, versionId: string, actorUid: string) {
    const versionRef = doc(db, 'publicArtworkConfig', slotId, 'versions', versionId);
    const snap = await getDoc(versionRef);
    if (!snap.exists()) throw new Error('La versión seleccionada ya no está disponible.');
    const version = snap.data() as ArtworkVersion;
    return writeVersion(slotId, () => version.variants, actorUid, 'restore', versionId);
}

export async function discardArtworkDraft(uid: string, slotId: ArtworkSlotId, variant: ArtworkVariant) {
    const id = artworkDraftId(uid, slotId, variant);
    const draftRef = doc(db, 'artworkDrafts', id);
    const snap = await getDoc(draftRef);
    if (!snap.exists()) return;
    const draft = snap.data() as ArtworkDraft;
    if (draft.ownerUid !== uid) throw new Error('El borrador pertenece a otra cuenta.');
    await deleteObject(ref(storage, draft.storagePath));
    await deleteDoc(draftRef);
}

export async function finalizePublishedArtworkDraft(uid: string, slotId: ArtworkSlotId, variant: ArtworkVariant) {
    const draftRef = doc(db, 'artworkDrafts', artworkDraftId(uid, slotId, variant));
    const snap = await getDoc(draftRef);
    if (!snap.exists()) return;
    const draft = snap.data() as ArtworkDraft;
    if (draft.ownerUid !== uid) throw new Error('El borrador pertenece a otra cuenta.');
    // The immutable Storage object is now referenced by the public config and
    // must remain available for version history. Only its private draft record ends.
    await deleteDoc(draftRef);
}

export async function getArtworkDraft(uid: string, slotId: ArtworkSlotId, variant: ArtworkVariant) {
    const snap = await getDoc(doc(db, 'artworkDrafts', artworkDraftId(uid, slotId, variant)));
    return snap.exists() ? snap.data() as ArtworkDraft : null;
}

export async function getArtworkHistory(slotId: ArtworkSlotId) {
    const snapshots = await getDocs(query(collection(db, 'publicArtworkConfig', slotId, 'versions'), orderBy('createdAt', 'desc')));
    return snapshots.docs.map((snapshot) => snapshot.data() as ArtworkVersion);
}

export function variantsFromConfig(config: unknown): ArtworkOverrides {
    return config && typeof config === 'object' ? config as ArtworkOverrides : {};
}
