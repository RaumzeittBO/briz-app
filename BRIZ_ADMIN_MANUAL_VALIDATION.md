# BRIZ — checklist manual de alquileres Admin (Emulator)

**Estado:** el 2026-10-21 se iniciaron Auth, Firestore, Functions y Storage Emulator, se sembró la cuenta/catálogo ficticios y Vite quedó iniciado en `http://127.0.0.1:5173/`. El navegador automatizado bloqueó el acceso al `localhost` por política de URL; no se repitió el acceso ni se declara como visualmente probado. Los procesos siguen disponibles para completar el recorrido manual. Las suites de Emulator cubren lógica y permisos del backend, pero no sustituyen esta lista.

## Preparar un entorno exclusivamente ficticio

1. En una terminal, iniciar solo los emuladores locales:

   ```powershell
   firebase emulators:start --project demo-briz-security
   ```

2. En otra terminal, sembrar una cuenta Admin y catálogo visual sintético. El script verifica primero Auth y Firestore en loopback y fija el proyecto `demo-briz-security`:

   ```powershell
   npm run seed:admin-visual
   ```

   Cuenta: `admin-visual@example.test` / `BrizEmulator#123`. Fixture: 4 bicicletas aro 26, 3 bicicletas aro 27, 6 candados y un combo bici+candado.

3. En una tercera terminal, habilitar la configuración Emulator antes de arrancar Vite:

   ```powershell
   $env:VITE_USE_FIREBASE_EMULATOR='true'
   npm run dev -- --host 127.0.0.1
   ```

4. Abrir la URL que Vite imprima (normalmente `http://127.0.0.1:5173`) y comprobar que el proyecto activo en consola/requests sea `demo-briz-security`; entrar a `/admin/rentals`.

No activar configuración de producción ni reutilizar datos personales. Si la cuenta ya existe en el emulador, el seeder restablece solo su contraseña y estado ficticio.

## Registro de resultados

Anotar fecha, ancho de viewport, código de reserva, estados, cantidades inicial/final y cualquier error. En cada operación verificar mensaje visible, datos tras recarga y documento del Emulator.

| Paso | Operación | Resultado esperado en UI y Emulator | Hecho / notas |
|---|---|---|---|
| 1 | Crear una reserva pública `/rentals` con fecha futura, una bici aro 26 y candado | Reserva pendiente agrupada; aparece en Admin sin datos de otra cuenta | |
| 2 | Confirmar desde Admin | Estado confirmado; stock disponible aro 26 baja exactamente 1 y candado baja 1; repetir confirmación no vuelve a descontar | |
| 3 | Registrar un pago parcial o total | Pago visible en historial y resumen; importe no se duplica al recargar | |
| 4 | Entregar | Estado entregado y hora registrada; stock permanece igual que después de confirmar | |
| 5 | Editar una reserva pendiente de prueba | Guardar cambio de combo/producto, aro, accesorios, cantidades, fecha y duración; total recalculado desde catálogo; auditoría conserva antes/después | |
| 6 | Agregar y quitar líneas en esa edición | Lista y accesorios quedan exactamente como se guardaron; cancelar modal sin guardar no muta inventario | |
| 7 | Devolver normalmente otra reserva entregada | Estado devuelto; unidades sanas y accesorios regresan una vez; pago/historial persisten; segundo intento no cambia stock | |
| 8 | Devolver con daño otra bici aro 27 | El número sano vuelve a stock; `damagedUnits` pasa a mantenimiento; no vuelve a disponibilidad pública | |
| 9 | Cancelar una pendiente y una confirmada separadas | Se conserva historial; pendiente no libera stock físico; confirmada libera su retención exactamente una vez | |
| 10 | Revisar inventario, Dashboard y Reports antes/después y tras recargar | Conteos y estados sincronizados; ingresos no se duplican en cada render/recarga; devueltos no desaparecen | |
| 11 | Probar fecha de forma manual | Elegir fecha desde calendario y con teclado; fecha visible y guardada coincide. Si falla, anotar navegador, valor del input y mensaje de validación | |
| 12 | Escritorio y móvil a 390 px (también 360 y 430 si posible) | Botones y modales accesibles, formulario desplazable sin controles recortados, CTA operables y sin bloqueo de scroll | |

Usar reservas distintas para devolución sana, devolución dañada y cancelación. Al terminar, verificar en Firestore Emulator que `stockDeducted`, estados del grupo, pagos, auditoría, proyección de disponibilidad e inventario concuerden. El ciclo UI queda pendiente hasta que estos pasos se recorran de verdad.

