# BRIZ — checklist manual de alquileres Admin (Emulator)

## Casos nuevos tras la incidencia de cobros/confirmación (2026-10-21)

La corrección de UI no se marcó como validación visual: el navegador automatizado bloquea localhost y esa restricción no se evadió. Tras abrir manualmente la app del Emulator, revisar estos controles en desktop y 360/390/430 px:

1. Abrir una reserva pendiente en el detalle y pulsar **Confirmar Reserva**. El modal debe permanecer visible con **Confirmando…** hasta respuesta; al éxito se cierra y la lista actualiza sin segunda pulsación. Probar error de stock: mostrar error y conservar modal/reserva pendiente.
2. Pulsar confirmar en la tarjeta; mientras carga el botón queda deshabilitado. Repetir doble clic en **Crear Alquiler**; una clave de sesión debe producir un solo código/documento. No refrescar/limpiar storage hasta finalizar.
3. En Caja registrar un anticipo de **Bs. 40** y luego el saldo de **Bs. 60** para un pedido de Bs. 100. El segundo cobro no debe aumentar el total contratado. QR/transferencia requieren marcar recibido. Un mismo envío/reintento no debe crear dos movimientos.
4. Sobre ese ejemplo, registrar un reembolso explícito de **Bs. 20** referido al primer cobro: se muestra en su propia fecha; no borra el cobro original ni recrea deuda contractual. Un reembolso mayor al remanente del cobro se rechaza. Una corrección requiere referencia y motivo; se registra separada del efectivo y no afirma que salió dinero.
5. Entregar y devolver. Confirmar que los cobros e historial persisten; una devolución impaga no se cuenta como cobro. Registrar un pago después de devolver y verificar que se conserva el estado devuelto.
6. En retorno, probar cantidades dañadas y sanas: la suma dañada no supera las unidades entregadas, stock sano vuelve a disponible, dañadas a mantenimiento y no aparece un cargo automático.
7. Probar confirmación/edición/cancelación/devolución/pago y que la lista refleje el resultado al terminar, sin repetir pulsaciones. Contrastar inventario y Reportes con combos y accesorio individual; no sumar unidades de combo como una segunda línea monetaria.

Un cobro ya guardado se mantiene en el historial tras cancelación o devolución. El reporte resta reembolsos y correcciones en sus fechas reales, pero no elimina movimientos originales. `Cobrado` es el bruto recibido, `Reembolsado` es salida de caja explícita, `Corregido` es ajuste no monetario y `Neto` es la vista reconocida. El pendiente contractual descuenta recibos y suma correcciones; un reembolso no reabre la deuda. El propietario debe revisar y aprobar esta semántica contable en la prueba manual antes de uso productivo.

## Recorrido corto del propietario: reserva → inventario → reportes

Ejecutar solo con la cuenta/catálogo sintéticos del Emulator (nunca con el proyecto productivo). Anotar el total que muestra Admin como **T** y el stock visible antes de confirmar como **S**. Utilizar una bicicleta individual, una sede conocida y fechas futuras sin conflictos:

1. Crear en `/rentals` una reserva pendiente de 1 bicicleta y completar el envío. En `/admin/rentals`, confirmar **una sola vez**. Debe quedar confirmada; la misma reserva no debe duplicarse. Stock retenido: `S - 1`.
2. Registrar uno o más recibos que sumen **T**. En Reportes, para la sede de esa reserva y el día de cobro, `Cobrado = T`; el pendiente de ese alquiler queda en `0`. Si el alquiler está programado para otro día, `Contratado = T` aparece en el período de la fecha programada, no se mueve al día del pago.
3. Entregar. El stock queda en `S - 1` (entrega no vuelve a descontar). Devolver en buen estado. El stock regresa exactamente a `S`; el estado queda devuelto y el pago/historial permanece.
4. Recargar Admin, Inventario y Reportes. El mismo código, pago e importes deben persistir; ni el stock ni el cobro deben cambiar por recargar. El cobro se ve una sola vez.
5. Cambiar Reportes a otra sede: el cobro de **T** no debe aparecer allí. Volver a la sede de la reserva: debe aparecer por `paidAt`, aunque la fecha del alquiler sea distinta.

No cambiar `paymentStatus` a `unpaid` para simular reembolso ni corrección. Usa movimiento explícito con importe, fecha real, referencia y motivo. Los datos históricos originales se conservan; los movimientos posteriores son inmutables e idempotentes.

Las pruebas automatizadas contra `demo-briz-security` cubren estas invariantes backend/reporting; no reemplazan los pasos visuales listados aquí.

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
