export type CustomerPrivateFileLabel = 'autofoto' | 'documento' | 'documentoReverso';
export type CustomerPrivateFileKey = 'autofotoPath' | 'documentoPath' | 'documentoReversoPath';

export const CUSTOMER_PRIVATE_FILE_SPECS: Array<{ key: CustomerPrivateFileKey; label: CustomerPrivateFileLabel; fields: string[] }> = [
    { key: 'autofotoPath', label: 'autofoto', fields: ['autofotoPath', 'selfiePath', 'photoPath', 'autofotoUrl', 'selfieUrl', 'photoUrl'] },
    { key: 'documentoPath', label: 'documento', fields: ['documentoPath', 'documentFrontPath', 'documentoUrl', 'documentFrontUrl'] },
    { key: 'documentoReversoPath', label: 'documentoReverso', fields: ['documentoReversoPath', 'documentBackPath', 'documentoReversoUrl', 'documentBackUrl'] },
];

export interface CustomerPrivateFileBucket {
    name: string;
    file(path: string): { exists(): Promise<[boolean]> };
}

export interface CustomerPrivateFileState {
    paths: Partial<Record<CustomerPrivateFileKey, string>>;
    missing: CustomerPrivateFileLabel[];
    needsReview: CustomerPrivateFileLabel[];
}
export type CustomerPrivateFileUnreferencedPolicy = 'missing' | 'review' | ((label: CustomerPrivateFileLabel) => 'missing' | 'review');

function cleanReference(value: unknown): string {
    return typeof value === 'string' ? value.trim().slice(0, 1500) : '';
}

/** Accept only a bucket reference rooted in the verified UID or its exact linked legacy customer. */
export function ownedCustomerStoragePath(uid: string, legacyCustomerId: string, value: unknown, bucketName: string): string {
    const reference = cleanReference(value);
    if (!reference) return '';
    let objectPath = reference;
    if (reference.startsWith('gs://')) {
        const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(reference);
        if (!match || match[1] !== bucketName) return '';
        objectPath = match[2];
    } else if (/^https?:\/\//i.test(reference)) {
        try {
            const url = new URL(reference);
            if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') return '';
            const match = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(url.pathname);
            if (!match || match[1] !== bucketName) return '';
            objectPath = decodeURIComponent(match[2]);
        } catch { return ''; }
    } else if (reference.includes('?') || reference.includes('#')) {
        return '';
    }
    if (objectPath.includes('%') || objectPath.includes('\\') || [...objectPath].some(character => {
        const code = character.charCodeAt(0);
        return code <= 0x1f || code === 0x7f;
    })) return '';
    const segments = objectPath.split('/');
    if (segments.length < 3 || segments.some(segment => !segment || segment === '.' || segment === '..')) return '';
    return objectPath.startsWith(`customerUploads/${uid}/`)
        || Boolean(legacyCustomerId && objectPath.startsWith(`customers/${legacyCustomerId}/`))
        ? objectPath
        : '';
}

/** Resolves only explicitly referenced files. It intentionally requires no bucket listing permission. */
export async function resolveCustomerPrivateFiles(
    uid: string,
    legacyCustomerId: string,
    sources: Array<Record<string, unknown> | undefined>,
    bucket: CustomerPrivateFileBucket,
    unreferenced: CustomerPrivateFileUnreferencedPolicy = 'review',
): Promise<CustomerPrivateFileState> {
    const paths: CustomerPrivateFileState['paths'] = {};
    const missing: CustomerPrivateFileLabel[] = [];
    const needsReview: CustomerPrivateFileLabel[] = [];
    for (const spec of CUSTOMER_PRIVATE_FILE_SPECS) {
        const references = sources.flatMap(source => spec.fields.map(field => cleanReference(source?.[field])).filter(Boolean));
        let foundPath = '';
        let ambiguousReference = false;
        for (const reference of references) {
            const candidate = ownedCustomerStoragePath(uid, legacyCustomerId, reference, bucket.name);
            if (!candidate) {
                ambiguousReference = true;
                continue;
            }
            // Do not catch permission or transport errors here: an unknown result is not a missing file.
            const [exists] = await bucket.file(candidate).exists();
            if (exists) {
                foundPath = candidate;
                break;
            }
        }
        if (foundPath) paths[spec.key] = foundPath;
        else if (ambiguousReference || references.length === 0 && (typeof unreferenced === 'function' ? unreferenced(spec.label) : unreferenced) === 'review') needsReview.push(spec.label);
        else missing.push(spec.label);
    }
    return { paths, missing, needsReview };
}
