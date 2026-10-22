# BRIZ — Administrador de Imágenes y Artes

## Acceso y publicación

- Ruta: `/admin/artes`.
- Solo perfiles activos con `role=admin` pueden abrir la página, guardar borradores o publicar.
- Los perfiles de otros roles no ven el enlace del menú y reciben acceso denegado al abrir la ruta directamente.
- El arte público usa los originales del repositorio hasta que exista una variante publicada. Los visitantes solo leen los documentos publicados de `publicArtworkConfig`.
- La carga acepta PNG, JPG y WebP de hasta 8 MB. Se comprueba firma binaria, decodificación y dimensiones antes de guardar.
- Cada borrador se carga en un nombre versionado e inmutable de `public-assets/artworks/{slotId}/{variant}/...`. Aunque esté bajo el espacio de artes públicos, Storage Rules solo deja leerlo al Admin hasta que `publicArtworkConfig/{slotId}.variants.{variant}.storagePath` apunte exactamente a ese objeto. Publicar registra la variante y su historial en una transacción; no requiere copiar el objeto ni configurar CORS para descargarlo como `Blob`.
- Cancelar elimina el objeto privado si aún no fue publicado. Los objetos publicados nunca se sobrescriben ni eliminan, para preservar las versiones restaurables. La configuración pública apunta a la versión activa.
- Restaurar crea una nueva versión que vuelve a apuntar a una captura anterior. Nunca elimina los originales del repositorio ni los archivos publicados.
- Firebase Storage Rules restringen MIME, tamaño, ruta y escritura a Admin. Firestore Rules exigen que cada cambio de configuración cree una nueva versión dentro de la misma transacción.
- Las referencias nuevas se propagan con Firestore `onSnapshot`; los objetos versionados usan URL y ruta únicas para evitar caché obsoleta. No se necesita redeploy del sitio por cambiar un arte.

## Catálogo inventariado

El registro contiene 30 elementos referenciados por el sitio:

- **Inicio:** cintas del hero, cuatro láminas principales, textura, stickers de sección, logotipos, arte de comunidad, cuatro tarjetas de experiencias y lámina “Pedalea · Conecta · Inspira”.
- **Acerca de:** tres láminas de historia/misión/valores y textura.
- **Taller:** fotografía editorial del encabezado y textura.
- **Rutas:** textura decorativa.
- **Navegación, pie y cuenta:** logotipos visibles en Navbar, pie y diálogo de autenticación de cliente.

Las fotos de bicicletas, productos, rutas creadas por contenido y fotos de clientes no están incluidas: conservan sus gestores actuales.

## Fuentes faltantes y traducción

La revisión del checkout encontró catorce referencias cuyo original no existe en `public/`: textura de papel, seis stickers decorativos, cuatro tarjetas de experiencias y las texturas de Acerca de/Taller/Rutas. El Admin las marca como “Original faltante”; mientras no se publique una imagen, siguen el fallback o placeholder que el sitio ya utilizaba. Algunas referencias de stickers están dentro de secciones antiguas de Home que actualmente retornan las láminas editoriales; subirlas no las vuelve visibles hasta que esa composición vuelva a renderizarlas.

No hay traducción inglesa verificada para el arte del encabezado “Vive”, las láminas de alquiler y taller, los cuadros de Acerca de, arte de comunidad, “Pedalea”, ni las cuatro tarjetas de experiencias. Las vistas móviles de accesorios y rutas tampoco tienen inglés verificado. Se conserva el español en esas variantes. El arte “Bienvenidos/Welcome” y las vistas de escritorio de accesorios y rutas sí tienen inglés verificado. Logos, fotos y texturas neutrales se comparten entre idiomas.

## Verificación local

`npm run test:artwork` ejecuta las pruebas de Firestore/Storage Rules en Firebase Emulator y la verificación del catálogo, los fallbacks, variantes compartidas, firma MIME y prevalidación. Comprueba que los objetos permanecen privados antes de publicar y que la referencia Firestore activa habilita la lectura pública. Usa el proyecto de emulador `demo-briz-security`; no se conecta a Firebase de producción.
