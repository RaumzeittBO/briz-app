import { auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { validateCatalogImage } from '@/lib/imageUpload';

const MAX_COMPRESSED_IMAGE_BYTES = 10 * 1024 * 1024;

export const compressImage = (file: File, maxW = 1200, maxH = 1200, quality = 0.78): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxW / img.width, maxH / img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('No se pudo preparar la imagen para subir.');
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Error al comprimir imagen')), 'image/jpeg', quality);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });

export const uploadCompressedImage = async (file: File, folder: string): Promise<string> => {
  if (!auth.currentUser) throw new Error('No autenticado. Recarga la página.');
  const validationError = validateCatalogImage(file);
  if (validationError) throw new Error(validationError);
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(folder)) throw new Error('La carpeta de destino no es válida.');

  try {
    const compressedBlob = await compressImage(file);
    if (compressedBlob.size > MAX_COMPRESSED_IMAGE_BYTES) throw new Error('La imagen comprimida supera el límite de 10 MB.');
    const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.jpg`;
    const result = await uploadBytes(storageRef(storage, `${folder}/${fileName}`), compressedBlob, { contentType: 'image/jpeg' });
    return await getDownloadURL(result.ref);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
    if (code === 'storage/unauthorized') throw new Error('No tienes permisos para subir imágenes en esta sección. Verifica tu sesión o pide acceso a un administrador.');
    if (code === 'storage/quota-exceeded') throw new Error('Se alcanzó la cuota de almacenamiento disponible. Inténtalo más tarde.');
    if (code === 'storage/retry-limit-exceeded' || code === 'storage/canceled') throw new Error('La subida se interrumpió. Comprueba tu conexión e inténtalo otra vez.');
    throw error instanceof Error ? error : new Error('No se pudo subir la imagen. Inténtalo otra vez.');
  }
};
