export const MAX_ARTWORK_BYTES = 8 * 1024 * 1024;
export const ALLOWED_ARTWORK_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export function validateArtworkFile(file: File) {
    if (!(ALLOWED_ARTWORK_TYPES as readonly string[]).includes(file.type)) throw new Error('Elige una imagen PNG, JPG o WebP.');
    if (file.size <= 0 || file.size > MAX_ARTWORK_BYTES) throw new Error('La imagen debe pesar como máximo 8 MB.');
}

export async function validateArtworkFileContent(file: File): Promise<void> {
    validateArtworkFile(file);
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isPng = file.type === 'image/png'
        && bytes.length >= 8
        && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
    const isJpeg = file.type === 'image/jpeg'
        && bytes.length >= 3
        && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isWebp = file.type === 'image/webp'
        && bytes.length >= 12
        && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!isPng && !isJpeg && !isWebp) {
        throw new Error('El contenido no coincide con un archivo PNG, JPG o WebP válido.');
    }
}
