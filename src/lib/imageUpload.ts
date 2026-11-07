const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateCatalogImage(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Usa una imagen JPG, PNG o WebP.';
  if (file.size <= 0 || file.size > MAX_SOURCE_IMAGE_BYTES) return 'La imagen debe pesar menos de 20 MB.';
  return null;
}
