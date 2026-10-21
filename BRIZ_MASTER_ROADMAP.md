# BRIZ (`briz.com.bo`) — MASTER ROADMAP & ENGINEERING LOG

> **ÚLTIMA ACTUALIZACIÓN:** 2026-10-21 (Bloque 4: auditoría funcional/código y preparación de release)
> **ESTADO GENERAL:** Rama `codex/briz-critical-stabilization-20261020`; commit final local y remoto `498bfbb24d5720228e89870b1c3769933a372bf6`, push confirmado por `git ls-remote`, árbol limpio. Base del Bloque 4: `05dd70a`. Bloque 3 implementado; el recorrido visual previo abrió `/admin/rentals` y creó una reserva sintética, pero el navegador luego bloqueó localhost y el ciclo completo de UI sigue pendiente. En esta auditoría se corrigió el fixture de disponibilidad fechado que fallaba el 21-oct, se conectó Auth secundario al Emulator, las ventas manager ahora incluyen su tienda y se desactivó la sincronización automática potencialmente destructiva de inventario heredado desde localStorage. `test:firebase` (rules + integración) y `test:reconcile`, motor (16/16), `tsc`, build web y build Functions pasan. ESLint global: 207 errores, 10 warnings; mezcla binario/backups y archivos activos. Build avisa `/noise.png` y JS minificado ~1.96 MB. Sin producción, despliegue, migración ni billing. Emulator Auth/Firestore/Functions/Storage y Vite quedaron disponibles con cuenta ficticia; validación visual completa no ejecutada por el bloqueo del navegador.
> **DOCUMENTO COMPLEMENTARIO OBLIGATORIO:** Ver [`BRIZ_HANDOFF_CODEX.md`](./BRIZ_HANDOFF_CODEX.md) y [`BRIZ_ARTES_EN_INGLES.md`](./BRIZ_ARTES_EN_INGLES.md).

## Continuación Codex Bloque 3 — 2026-10-20

## Bloque 4 — auditoría y readiness — 2026-10-21

- Estado Git base del bloque: rama publicada `codex/briz-critical-stabilization-20261020`, referencia local `origin/...` alineada en `05dd70a` según el contexto confirmado por el usuario. No se rehizo diagnóstico de GitHub ni push de commits anteriores.
- Cierre Git del bloque: commits `0fc28d2` y `498bfbb` publicados; `git ls-remote` devolvió `498bfbb24d5720228e89870b1c3769933a372bf6`, igual a HEAD; working tree limpio.
- Auditoría por código/rules: Dashboard, alquileres, clientes, inventario, tienda/combos, ventas, taller, reportes, Settings/usuarios, eventos/rutas/comunidad y seed. Reglas permiten lecturas públicas solo de catálogo/proyección; clientes se sirven con callable sanitizada; rentals/sales/serviceOrders consultan por sede para managers; alquileres y roles mutan vía Functions/Admin SDK. No se declara click-through visual de esos módulos.
- Hallazgos corregidos: (1) `SettingsPage` creaba una Firebase Auth secundaria sin conectarla al Auth Emulator, por lo que los admins visuales no quedaban garantizados en el entorno aislado; ahora conecta una sola vez a loopback. (2) ventas manuales desde manager omitían `store` y chocaban con reglas; ahora se escribe el alcance activo. (3) migración automática de `briz_inventory` desde localStorage podía reescribir stock remoto con datos viejos y el cliente no tenía permisos en reglas; se reemplazó por aviso sin escritura. (4) fixture core fijaba una reserva pasada y fallaba correctamente como alquiler vencido aún fuera; usa fechas futuras dinámicas.
- `scripts/seed-admin-visual.ts` crea solo una cuenta y catálogo ficticios en Auth/Firestore Emulator, después de comprobar endpoints loopback. Cuenta de prueba y pasos están en [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md). La política de navegador impidió completar la revisión visual en este turno, por lo que el recorrido UI no se marca terminado.
- Calidad de esta revisión: reconciliación sintética pasó (8 registros/22 hallazgos); motor core 16/16; TypeScript y ambos builds pasan. `npm run test:firebase` primero falló por carga concurrente, pero la repetición secuencial pasó completa. ESLint 217 problemas (207 errores/10 warnings), con errores en `initial_store.tsx` binario, `src_backup` y módulos operativos. No se masificó un lint cleanup.
- Readiness no productivo creado en [`BRIZ_RELEASE_READINESS.md`](./BRIZ_RELEASE_READINESS.md): Blaze/costos, App Check, dominios Auth, Secret Manager/rotación Telegram, recovery outbox, bootstrap de Admin, rules/indexes, Vercel, orden reversible y autorizaciones requeridas. Hallazgo outbox: crash luego de `sending` deja un registro sin reclamar; recuperación automática podría duplicar Telegram por resultado ambiguo, requiere política del propietario.
- No se ejecutó migración histórica, backup de producción, App Check, billing, secreto real, despliegue ni cambios a `main`.
- **Siguiente paso ejecutable:** completar [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md) desde el navegador del propietario conectado solo al Emulator; después preparar el dry-run de conciliación sobre copia autorizada y desidentificada. Ver orden completa y demás fases al final de este roadmap.

### Fases siguientes (orden mantenido)

1. Cerrar la auditoría funcional del Admin (bloque actual) y registrar correcciones.
2. Completar validación visual de alquileres en Emulator.
3. Conciliar y migrar datos históricos solo con autorización, respaldo, dry-run y rollback.
4. Preparar Firebase Blaze, App Check, dominios, Secret Manager/Telegram y roles iniciales.
5. Completar traducción pública ES/EN natural.
6. Incorporar los diez artes pendientes en inglés.
7. Revisar responsive de todas las páginas en móvil y escritorio.
8. Validar categorías/eventos en alquileres móvil.
9. Crear gestor Admin de imágenes Home en ES/EN y escritorio/móvil (no iniciar antes de cerrar alquileres críticos).
10. Limpiar ESLint, optimizar de forma segura y preparar despliegue coordinado solo tras autorización.

- Rama activa: `codex/briz-critical-stabilization-20261020`; parte de `db522d4`. No se reescribieron los commits de los bloques anteriores.
- `updateRentalGroup` (Functions/Admin SDK) sustituye la secuencia navegador de borrar/editar/anexar líneas. Lee el grupo, catálogo, inventario y reservas activas dentro de una transacción; valida sede, estados, combos/aros, horarios y stock; aplica deltas físicos si el grupo ya retenía stock; escribe altas/cambios/bajas, auditoría y bloqueos en el mismo commit. Ignora importes enviados por el navegador, calcula precios del catálogo y protege importes de pedidos pagados. Cambiar entrega/recojo sincroniza sus líneas de servicio y calcula el importe de zona cuando el enlace de Maps aporta coordenadas.
- `adminRentalAction` centraliza confirmación, entrega, devolución, cancelación, expiración y pago en transacciones de servidor. Confirmar revalida solapamientos y demanda por componente, descuenta una sola vez y marca `stockDeducted`; entregar registra `deliveredAt` sin volver a descontar; devolver solo acepta entregados, libera accesorios y stock sano y envía la cantidad dañada indicada a mantenimiento; las transiciones no válidas/repetidas no alteran stock. Cancelar solo acepta pendiente/confirmado y conserva los documentos como historial.
- El panel usa estas callables también para reservar manualmente, guardar ediciones y registrar pagos. Ya no ofrece borrar históricamente un alquiler; la acción de lista cancela y conserva el registro. Se retiró del modal de devolución la entrada de multas, sin agregar políticas comerciales.
- Managers se limitan a documentos de su sede; si un registro histórico no incluye sede, el backend lo bloquea para manager en vez de inferirla. Administradores pueden editar líneas históricas sin sede. Combos históricos sin aro resoluble se rechazan con motivo de revisión y no asignan stock arbitrariamente.
- Se añadió `scripts/reconcile-rentals.ts`, estrictamente de solo lectura y bloqueado fuera de `FIRESTORE_EMULATOR_HOST` con proyecto `demo-briz-security`; `npm run reconcile:rentals` inicia un emulador limpio y reporta inconsistencias sin reparar datos.
- **Pruebas integrales Emulator:** reglas Firestore/Storage; creación, idempotencia, grupo manual; edición que agrega bici/accesorio y elimina línea; cambios de fecha/hora/duración/aro; sincronización de entrega/recojo con tarifa de zona; rechazo por stock; confirmación única, entrega, devolución sana/dañada, cancelación pendiente/confirmada, retorno anticipado rechazado; roles y alcance de manager/mechanic/viewer; compatibilidad de estado español sin sede/grupo; combo con componente compartido con accesorio seleccionado; reservas cliente concurrentes entre sí y con cambio administrativo de fecha. `npm run test:firebase` pasó.
- **Otras verificaciones:** `npx tsx scripts/verify-briz-core.ts` (16/16), `npx tsc --noEmit`, `npm run build`, `npm run build --prefix functions` y `npm run test:reconcile` pasan. Build conserva avisos de `/noise.png` y bundle principal ~1.96 MB minificado.
- **Lint:** `npm run lint` sigue fallando con 207 errores y 10 warnings (217 problemas); predominan `initial_store.tsx` binario, `src_backup`, `any` y patrones React. ESLint dirigido a `functions/src/index.ts`, `src/lib/backend.ts` y los scripts nuevos pasa; `StoreContext.tsx`/`AdminRentalsPage.tsx` conservan hallazgos de estilo/tipado.
- **Estado visual registrado al cerrar originalmente el bloque 3:** aún no se había probado el panel con navegador. La actualización de esta continuación se detalla debajo; no se conciliaron datos reales ni se ejecutaron migraciones. La prueba de concurrencia fue mediante callable + transacciones reales del Emulator.
- **Actualización de validación visual (2026-10-20):** Vite abrió en `http://127.0.0.1:5173/admin/rentals` conectado a Authentication, Firestore, Functions y Storage Emulator del proyecto `demo-briz-security`; login ficticio `rider-a@example.test`. Se creó `BRIZ-2026-0012` con combo aro 27, bici aro 26 y accesorio. Antes de recompilar Functions, el alta fallaba porque la UI omitía selección de componentes y serializaba accesorios como líneas de bici; se corrigió. En detalle se verificó historial y controles de edición, pago y confirmación. A 390 px se abrió el detalle móvil; la captura mostró contenido largo que requiere desplazamiento vertical. La automatización no pudo validar de forma fiable el cambio de fecha ni completar todos los botones del ciclo; no se declara validación completa de confirmación, entrega, pago, cancelación, devolución, inventario ni reportes desde UI. Los datos son exclusivamente sintéticos.
- **Corrección adicional para Emulator:** `src/lib/firebase.ts` cambia a `demo-briz-security` cuando `VITE_USE_FIREBASE_EMULATOR=true`; no conecta Authentication/Firestore/Functions/Storage al proyecto productivo. `StoreContext` usa rutas locales predeterminadas en vez de intentar escribirlas desde un cliente sin permisos.
- `npm run test:firebase` volvió a pasar tras la regresión; incluye reglas Firestore/Storage, edición, ciclo administrativo, pagos, estados históricos, permisos, concurrencia y combo con accesorio. La prueba reinicia el limitador ficticio entre escenarios solo dentro del emulador.
- **Incidencia de navegador:** la reapertura actual de `http://127.0.0.1:5173/admin/rentals` fue bloqueada por la política de URL del navegador automatizado. La política prohíbe rodear el bloqueo con otra superficie o comandos de navegador; se conserva el alcance visual verificado previamente y se continúa con Emulator/fixtures.
- **Conciliación histórica preparada, sin migración:** `scripts/reconcile-rentals-analysis.ts` normaliza estados ES históricos, detecta grupos/fechas/campos ausentes, combos sin selección o aro, grupos con estados discordantes, enlaces de cliente sin Auth, flags de stock sospechosos y diferencias de inventario solo cuando existe baseline explícito. Sin baseline, informa que hace falta revisión manual; no inventa el stock inicial. `npm run test:reconcile` usa 8 registros ficticios no vacíos (pendiente, confirmado, entregado, devuelto, cancelado, pagos, combo ambiguo, cliente sin enlace Auth y campos nuevos ausentes) y verifica 22 hallazgos. Contra Emulator con dataset integrado no vacío: 18 alquileres, 15 grupos, 3 inventarios, 5 clientes y 10 hallazgos. La herramienta es solo lectura.
- **Plan seguro para una migración futura:** (1) recibir autorización y acordar alcance; (2) snapshot/export de Firestore y Auth con fecha/hash, cifrado y acceso restringido, desidentificar la copia cuando sea posible; (3) reconciliar el snapshot y guardar informe/manifest sin PII innecesaria; (4) aprobar por escrito mapeos de estados, grupos, combos y stock; (5) ejecutar dry-run y revisar todas las diferencias de alto riesgo; (6) migrar en lotes idempotentes en staging/copia, registrando before/after y checkpoint; (7) detenerse ante grupos discordantes, combos sin aro, inventario sin baseline o errores por encima del umbral acordado; (8) validar conteos, estados, pagos, stock, disponibilidad y reportes; (9) si hay fallas, parar escrituras y restaurar el snapshot o aplicar rollback por manifest, después emitir informe. No descargar datos reales ni ejecutar migraciones hasta autorización expresa.
- Riesgos de producción siguen abiertos: App Check, plan Blaze/APIs y secretos de Functions, rotación Telegram y recuperación de outbox, conciliación autorizada de registros heredados, enlaces privados históricos, consultas a escala y avisos de lint/build.

## Continuación Codex Bloque 2 — histórico — 2026-10-20

- Rama activa: `codex/briz-critical-stabilization-20261020`. Base conservada: `70b85b3` y `bc501ca`; implementación del bloque 2 en `6a09918` (`feat(firebase): secure booking and customer auth flows`).
- Seguridad Firestore/Storage: roles separados (`admin`, `manager`, `mechanic`, `viewer`), alcance por tienda cuando el documento lo define; clientes no escriben ventas, reservas, roles ni perfiles; `customers` no se puede leer desde el SDK cliente porque aún puede contener hashes heredados. Admin y manager consultan la callable sanitizada `getAdminCustomers`.
- Backend Functions v2 / Node 22: `createRentalGroup` crea grupos y clientes manuales en transacción, calcula precios/stock desde catálogo, asigna código BRIZ, verifica solapamientos por aro y componentes, coordina bloqueos por recurso, limita solicitudes, registra idempotencia y escribe outbox/proyección pública. Incluye reservas administrativas manuales con verificación del rol.
- Auth de cliente: Firebase Authentication, verificación de correo, recuperación por enlace de Firebase, registro privado de archivos en Storage, perfil sanitizado, consulta autorizada de historial con `getMyRentals`; el enlace de legado requiere verificar el mismo correo y borra el hash antiguo al vincularlo.
- Disponibilidad: la web consulta `rentals_busy_slots`, que contiene solo recurso, aro, cantidades, intervalos y estado; datos de personas, pago y dirección quedan en rentals privados.
- Telegram: trigger de Functions con Secret Manager y outbox. La ejecución local usa solo placeholders ignorados por Git y omite la entrega externa. No hay secretos productivos configurados. Rotar en BotFather cualquier token que se haya expuesto antes.
- Firebase Emulator configurado para Auth, Firestore, Functions y Storage. Datos de prueba solo sintéticos, proyecto `demo-briz-security`.
- Pruebas realizadas: `npm run test:firebase` aprobado (16 pruebas de reglas y 6 flujos integrados en los emuladores, incluyendo la protección de roles); `npx tsx scripts/verify-briz-core.ts` aprobado (16/16); `npx tsc --noEmit`, `npm run build` y `npm run build --prefix functions` aprobados. `npm run lint` falló con 220 problemas (210 errores, 10 warnings), principalmente `initial_store.tsx` binario, `src_backup`, `any` y reglas React.
- Avisos de build actuales: `/noise.png` no se resuelve durante Vite build y bundle principal ~1.98 MB minificado.
- **No se desplegó ni se modificó Firebase real. No se migraron cuentas reales ni se tocaron inventarios.**
- Requisitos de producción pendientes: Functions requieren plan Blaze y APIs/credenciales habilitadas; no activar facturación sin autorización. Configurar App Check de web y cambiar `enforceAppCheck` antes de abrir callables públicamente. Cargar secretos Telegram solo después de rotar el token y autorizarlo.
- La implementación del bloque 3 sustituyó las escrituras directas de alta/edición por callables. Falta cerrar el recorrido visual del ciclo completo y comprobar reportes/inventario desde interfaz.
- **Próximo paso ejecutable:** completar el ciclo visual de `/admin/rentals` cuando el navegador permita acceder al localhost (confirmación, pago, entrega, edición, devolución sana/dañada, cancelación, inventario, historial tras recarga y reportes). La fase de conciliación queda preparada con fixtures, detección explicativa y plan reversible; luego realizar el inventario histórico autorizado en una copia desidentificada. Siguen después: Blaze/App Check/Telegram, revisión general Admin, traducción natural ES/EN, diez artes ingleses, responsive completo, categorías/eventos móvil, gestor de imágenes Home, ESLint/optimización y despliegue coordinado con autorización.

---

## HANDOFF — LEER PRIMERO
Si eres **Codex** o **Gemini** retomando este repositorio sin acceso al historial de conversación, lee esta sección y [`BRIZ_HANDOFF_CODEX.md`](./BRIZ_HANDOFF_CODEX.md) antes de tocar cualquier archivo:

1. **Rama y Commit Base:**
   - **Rama actual:** `main`
   - **Commit previo a la reparación:** `0140452` (`Update site favicon`)
   - **Último commit estabilizado:** `c2c9ef1` (`feat(briz): stabilize rental engine, PBKDF2 auth, full EN translation, artwork registry and handoff docs`)
   - **Regla de oro:** **NO desplegar a producción (`firebase deploy`) ni alterar datos reales de Firestore sin autorización expresa del propietario.**
2. **Clasificación Estricta de Estados (No confundir compilación con validación en producción):**
   - `IMPLEMENTADO`: Código escrito y compilando (`tsc --noEmit`).
   - `PRUEBA UNITARIA SUPERADA`: Verificado mediante pruebas automatizadas deterministas en `scripts/verify-briz-core.ts` (lógica pura y simulaciones de estado).
   - `PRUEBA INTEGRAL SUPERADA`: Flujo verificado de extremo a extremo contra emulador o entorno real con UI.
   - `PENDIENTE DE VALIDACIÓN`: Implementado y con pruebas unitarias de motor, pero pendiente de prueba E2E con Firestore Emulator / UI en vivo.
   - `BLOQUEADO`: Requiere una decisión comercial, activos gráficos externos o cambio de arquitectura (ej. Firebase Auth para clientes antes de cerrar lectura en `firestore.rules`).
   - `PENDIENTE`: Aún no implementado (ej. Fase Futura de Gestor Administrativo de Artes Web).
3. **Comandos de Verificación Rápida:**
   ```bash
   npx tsx scripts/verify-briz-core.ts   # Suite de pruebas deterministas (Motor de stock, intervalos, precios, PBKDF2, reportes, artes)
   npx tsc --noEmit                      # Verificación estricta de tipos TypeScript
   npm run build                         # Build de producción (Vite)
   ```

---

## 1. ESTADO DEL REPOSITORIO Y GIT

- **Rama activa:** `main`
- **Commit base original:** `0140452` (`Update site favicon`)
- **Archivos temporales eliminados de la raíz:**
  - `initial_rentals.tsx`, `old_rentals_local.tsx`, `scratch_rentals.tsx`, `tsc_output.txt`
- **Archivos nuevos creados:**
  - `BRIZ_MASTER_ROADMAP.md` (este documento)
  - `BRIZ_HANDOFF_CODEX.md` (guía de continuidad paso a paso para Codex)
  - `BRIZ_ARTES_EN_INGLES.md` (inventario completo y especificaciones de artes gráficos ES/EN)
  - `src/lib/dateUtils.ts` (utilidades de fecha/hora en zona horaria Bolivia `America/La_Paz` UTC-4)
  - `src/lib/rentalPricing.ts` (motor unificado de tarifas de alquileres y accesorios)
  - `src/lib/rentalAvailability.ts` (motor de disponibilidad por intervalos horarios, demandas por alquiler/combo/accesorio, deltas y transacciones Firestore)
  - `src/lib/security.ts` (hashing de contraseñas con **PBKDF2-HMAC-SHA256** de 100,000 iteraciones + sal aleatoria, compatible con `sha256$` y texto plano heredado)
  - `src/lib/artworkRegistry.ts` (registro centralizado y seguro de artes gráficos ES/EN con fallback automático para evitar errores 404 o mostrar artes en español por error)
  - `scripts/verify-briz-core.ts` (suite automatizada de 16 bloques de pruebas de motor y regresión — **16/16 superadas**)
- **Archivos existentes modificados (25 archivos):**
  - `src/context/StoreContext.tsx`, `src/context/AuthContext.tsx`, `src/context/LanguageContext.tsx`
  - `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/CustomerAuthModal.tsx`
  - `src/components/rentals/RentalCheckoutWizard.tsx`, `src/components/rentals/DeliveryMapPicker.tsx`
  - `src/pages/public/HomePage.tsx`, `src/pages/public/AboutPage.tsx`, `src/pages/public/RentalsPage.tsx`, `src/pages/public/ShopPage.tsx`, `src/pages/public/RoutesPage.tsx`, `src/pages/public/ServicePage.tsx`, `src/pages/public/CommunityPage.tsx`, `src/pages/public/ContactPage.tsx`, `src/pages/public/ProfilePage.tsx`
  - `src/pages/admin/AdminRentalsPage.tsx`, `src/pages/admin/InventoryPage.tsx`, `src/pages/admin/DashboardPage.tsx`, `src/pages/admin/ReportsPage.tsx`
  - `src/lib/translations.ts`, `src/lib/whatsapp.ts`, `src/lib/telegram.ts`, `src/data/mockData.ts`
  - `firestore.rules`, `storage.rules`

---

## 2. MATRIZ DE ESTADO POR MÓDULO Y FASE

| Fase / Módulo | Sub-tarea / Función | Estado Actual | Evidencia / Notas Técnicas |
| :--- | :--- | :--- | :--- |
| **FASE 1: Motor de Alquileres, Stock y Concurrencia** | Códigos únicos `BRIZ-YYYY-NNNN` con contador atómico (`counters/rentals_YYYY`) | `PRUEBA UNITARIA SUPERADA` / `PENDIENTE DE VALIDACIÓN` (Firestore real) | `allocateReservationCodesTx` en `StoreContext.tsx` usa `runTransaction` e inspecciona máximo histórico para no colisionar jamás. |
| **FASE 1** | Estados diferenciados (`pending`, `confirmed`, `delivered`, `returned`, `cancelled`, `expired`) + compatibilidad legado (`Confirmado`, `Entregado`, `Devuelto`, etc.) | `PRUEBA UNITARIA SUPERADA` | `normalizeRentalStatus` y `isStockHoldingStatus` en `src/lib/rentalAvailability.ts`. |
| **FASE 1** | Validación de disponibilidad por intervalo horario (`getAvailableStockForInterval`, `validateRentalDemandsAvailability`) sin doble descuento de alquileres confirmados | `PRUEBA UNITARIA SUPERADA` | Reconstruye capacidad operativa sumando `shelfStock + currentlyDeductedUnits` y resta únicamente las reservas que se solapan con `[startMs, endMs]`. |
| **FASE 1** | Transacciones atómicas de stock en confirmación (`confirmRentalGroup`), entrega (`deliverRentalGroup`), devolución (`returnRentalGroup`), cancelación (`cancelRentalGroup`), eliminación (`deleteRentalGroup`) y edición diferencial (`updateRental`) | `PRUEBA UNITARIA SUPERADA` / `PENDIENTE DE VALIDACIÓN` (Emulador/UI) | `applyInventoryDeltasInTransaction` bloquea entregas sin confirmar, impide doble devolución, impide borrar reservas con stock retenido y calcula delta exacto al editar cantidad/aro/producto. |
| **FASE 1** | Devolución con daño o mantenimiento (`returnCondition: 'damaged' \| 'maintenance'`) enviando unidades a `maintenanceStock` sin devolverlas al stock público | `PRUEBA UNITARIA SUPERADA` | Implementado en `returnRentalGroup` (`StoreContext.tsx`) y modal de devolución en `AdminRentalsPage.tsx`. |
| **FASE 2: Bicicletas Combinadas y Accesorios** | Stock real de accesorios adicionales (`selectedAccessories: RentalAccessorySelection[]`) descontado al confirmar y liberado al devolver/cancelar | `PRUEBA UNITARIA SUPERADA` | Estructurado en `Rental.selectedAccessories`; incluido en `getRentalInventoryDemands`. |
| **FASE 2** | Disponibilidad de combos por componente y tamaño de aro (`getComboAvailability`, `getComboMaxStockForInterval`) | `PRUEBA UNITARIA SUPERADA` | Calcula cuello de botella (`Math.min`) respetando `wheelSize` de cada componente. |
| **FASE 2** | Rediseño compacto del selector de accesorios en `RentalCheckoutWizard.tsx` (chips/filas compactas con `+`/`-`, stock en vivo, resumen plegable) | `IMPLEMENTADO` / `PENDIENTE DE VALIDACIÓN` (UI móvil/desktop) | Elimina tarjetas gigantes en Paso 1 del wizard público. |
| **FASE 3: Precios, Cálculos y Fechas Bolivia** | Motor unificado `calculateDurationPrice` + tarifas exactas de accesorios (1–3h, 4–8h, 24h, semana, mes) + fecha local Bolivia (`UTC-4`) | `PRUEBA UNITARIA SUPERADA` | Corrige bug de `NaN` en inglés, bug de fecha UTC después de las 20:00 BOT y discrepancias entre Wizard y Admin. |
| **FASE 4: Reportes y Contabilidad** | Inclusión de alquileres `returned` / `Devuelto` y `delivered` en ingresos de `DashboardPage.tsx` y `ReportsPage.tsx`, separando cobrado (`paid`) vs por cobrar | `PRUEBA UNITARIA SUPERADA` | Antes los alquileres devueltos desaparecían de ingresos. Corregido y verificado. |
| **FASE 4** | Filtros de período (`Hoy`, `Ayer`, `7 días`, `Este mes`, `Todo`, `Rango personalizado`), KPIs de flota, horas alquiladas, retrasos, accesorios y exportación CSV/Excel + Impresión/PDF | `IMPLEMENTADO` / `PENDIENTE DE VALIDACIÓN` (UI) | Implementado en `src/pages/admin/ReportsPage.tsx`. |
| **FASE 5: Seguridad y Reglas** | Hashing de contraseñas de clientes y PIN admin con **PBKDF2-HMAC-SHA256** (`100,000` iteraciones + sal aleatoria de 16 bytes) y migración transparente al iniciar sesión | `PRUEBA UNITARIA SUPERADA` | `src/lib/security.ts`. Compatible con `sha256$` y texto plano antiguo (`needsUpgrade: true`). |
| **FASE 5** | Reglas de Firestore (`firestore.rules`) y Storage (`storage.rules`) | `BLOQUEADO` (Despliegue a prod) | Ver sección 5: cerrar `allow read` en `customers` y `rentals` requiere migrar el login de clientes a Firebase Auth o Cloud Functions para no romper el login actual desde cliente. |
| **FASE 6: Traducciones y Artes en Inglés** | Traducción natural y completa al inglés en todas las páginas públicas (`Navbar`, `Footer`, `Home`, `About`, `Rentals`, `Shop`, `Routes`, `Service`, `Community`, `Contact`, `Profile`, `RentalCheckoutWizard`, `DeliveryMapPicker`, `CustomerAuthModal`) sin depender de Google Translate | `IMPLEMENTADO` / `PRUEBA UNITARIA SUPERADA` | `LanguageContext.tsx` + `translations.ts` + soporte `nameEn`/`descriptionEn` en modelos dinámicos. |
| **FASE 6** | Inventario de artes gráficos (`BRIZ_ARTES_EN_INGLES.md`) + registro seguro (`src/lib/artworkRegistry.ts`) sin rutas rotas `.webp` en `AboutPage.tsx` ni imágenes en español engañosas | `PRUEBA UNITARIA SUPERADA` | Corrige el 404 en `AboutPage.tsx` cuando `language === 'en'` y documenta los 10 archivos gráficos que requieren diseño en inglés. |
| **PRIORIDAD 4: Bug Móvil Alquileres** | Ocultar bloque superior de "Eventos Especiales" cuando se selecciona una categoría específica (`Urbanas`, `Montañeras`, etc.) y hacer scroll suave al catálogo | `IMPLEMENTADO` / `PRUEBA UNITARIA SUPERADA` | Corregido en `src/pages/public/RentalsPage.tsx`. |
| **PRIORIDAD 5: Gestor Admin de Artes Web** | Diseño técnico y registro en Roadmap del módulo `ADMIN — GESTOR DE ARTES E IMÁGENES DE LA WEB` | `PENDIENTE` (Diseñado para siguiente fase) | Especificación completa en sección 7 de este documento y en `BRIZ_HANDOFF_CODEX.md`. |

---

## 3. NUEVOS ESQUEMAS, ESTADOS Y CAMPOS DE FIRESTORE (100% RETROCOMPATIBLES)

Todos los campos añadidos a interfaces en `src/context/StoreContext.tsx` son **opcionales (`?`)** y cuentan con normalizadores para que los documentos históricos sigan funcionando sin migraciones destructivas:

### 3.1. Colección `rentals` (`Rental`)
- `status`: Soporta `'pending' | 'confirmed' | 'delivered' | 'returned' | 'cancelled' | 'expired'` además de valores históricos `'Confirmado' | 'Entregado' | 'Devuelto' | 'Cancelado' | 'Pendiente' | 'Vencido'`.
- `startTimestamp?: number` y `endTimestamp?: number`: Timestamps en milisegundos (`UTC-4` Bolivia) calculados automáticamente a partir de `date`, `time` (`startTime`) y `duration`. Si un documento antiguo no los tiene, `getRentalIntervalMs(rental)` los calcula al vuelo.
- `selectedAccessories?: RentalAccessorySelection[]`: Lista estructurada `{ itemId, name, quantity, unitPrice, totalPrice }[]` para descontar y liberar stock real de cascos, luces, sillas de bebé, candados, etc.
- `stockDeducted?: boolean`: Bandera de idempotencia transaccional (`true` cuando el stock físico ya fue descontado del estante, `false` cuando fue devuelto o cancelado).
- `deliveredAt?: string`, `deliveredBy?: string`: Trazabilidad de entrega física.
- `returnedAt?: string`, `returnedBy?: string`: Trazabilidad de devolución física.
- `returnCondition?: 'ok' | 'damaged' | 'maintenance'`, `returnNotes?: string`: Estado físico al devolver.
- `Translation fields` en productos/eventos/rutas (`InventoryItem`, `ComboProduct`, `EventItem`, `CyclingRoute`):
  - `nameEn?: string`, `descriptionEn?: string`, `detailsEn?: string`.

### 3.2. Colección `inventory` (`InventoryItem`)
- `maintenanceStock?: number`: Unidades fuera de circulación pública por daño o mantenimiento al devolver un alquiler.
- `wheelSizes?: { size: string; stock: number; maintenanceStock?: number }[]`: Soporte de stock en mantenimiento por aro.

### 3.3. Colección `counters`
- Documento `counters/rentals_YYYY` (`{ year: number, seq: number, updatedAt: string }`): Secuencia atómica para códigos `BRIZ-YYYY-NNNN`.

---

## 4. DECISIONES COMERCIALES PENDIENTES (NO INVENTADAS)

Siguiendo la Regla Obligatoria #11, **no se han inventado tarifas de multas ni bloqueos automáticos no solicitados**. Quedan documentadas para decisión de gerencia:

1. **Multa monetaria automática por hora/día de retraso:** Actualmente el sistema detecta y contabiliza alquileres vencidos (`isRentalOverdue`) y registra la hora exacta de devolución (`returnedAt`), pero no suma un recargo monetario automático al `total` sin autorización del administrador.
2. **Buffer de limpieza/alistamiento entre reservas consecutivas:** Actualmente `DEFAULT_BUFFER_MINUTES = 0` en `src/lib/rentalAvailability.ts`. Si BRIZ desea 15 o 30 minutos de margen entre la devolución de un cliente y la reserva del siguiente, basta cambiar `DEFAULT_BUFFER_MINUTES`.
3. **Expiración automática de reservas `pending` sin pago:** Las reservas creadas desde la web nacen como `pending` (no descuentan stock físico hasta que el admin confirma, pero sí previenen overbooking horario). La transición a `expired` se realiza desde el panel admin.

---

## 5. RIESGOS DE SEGURIDAD Y DESPLIEGUE (`BLOQUEADO` PARA PRODUCCIÓN)

> **Nota de actualización:** la advertencia antigua de esta sección describía el estado anterior al Bloque 2 y está supersedida. Hoy clientes autentican con Firebase Auth y usan callables; `customers`/`rentals` permanecen privados para clientes en Firestore rules y la disponibilidad pública usa `rentals_busy_slots` sanitizados. El código actual no contiene `VITE_TELEGRAM_*`; notificaciones salen por Functions y Secret Manager. Esto no significa que producción esté lista.

### Pendientes Obligatorios de Validación y Cierre

- Completar el ciclo visual Admin de `/admin/rentals` en escritorio y móvil; seguir [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md).
- Firebase Emulator se validó en repetición secuencial completa; la primera ejecución paralela tuvo timeout al cargar Functions.
- Conciliación histórica real solo después de autorización, respaldo protegido, desidentificación cuando posible y dry-run aprobado.
- App Check, Blaze/APIs/costos, dominios Auth, Secret Manager y bootstrap Admin según [`BRIZ_RELEASE_READINESS.md`](./BRIZ_RELEASE_READINESS.md).
- Resolver recovery del outbox `sending` sin una política que introduzca duplicados inadvertidos.
- Revisión manual de traducciones, diez artes ingleses, responsive de todas las páginas, categorías/eventos móvil, ESLint/build warnings y gestor de imágenes (en su orden de roadmap).

Las reglas Firestore/Storage y el flujo cliente/Admin están cubiertos en Emulator, no desplegados. La ausencia de `firestore.indexes.json` debe resolverse en staging, inspeccionando índices requeridos por las consultas reales.

---

## 6. INVENTARIO DE ARTES EN INGLÉS (RESUMEN — VER `BRIZ_ARTES_EN_INGLES.md`)

- **Artes ya traducidos y activos en inglés:**
  - `/welcome.png` (reemplaza `/Bienvenidos.png`)
  - `/menu-principal-web/Ingles/1.png` ("RENT A BIKE")
  - `/menu-principal-web/Ingles/3.png` ("ACCESSORIES & SPARE PARTS")
  - `/menu-principal-web/Ingles/4.png` ("TOURS & ROUTES")
  - `/menu-principal-celular/Ingles/1.png` ("RENT A BIKE")
- **Artes que existen en carpetas `/Ingles/` pero siguen en ESPAÑOL (o no existen) — Fallback seguro activado en `src/lib/artworkRegistry.ts`:**
  - `/vive.webp` (Hero principal — no tiene versión en inglés todavía)
  - `/menu-principal-web/Ingles/2.png` (Dice "SERVICIO TÉCNICO" en español)
  - `/menu-principal-celular/Ingles/2.png`, `3.png`, `4.png` (Siguen en español)
  - `/Conocenos-web/Ingles/1.png`, `2.png`, `3.png` (Siguen en español; además `AboutPage.tsx` pedía `.webp` causando error 404 — **corregido en `AboutPage.tsx` usando `artworkRegistry.ts`**)
  - `/Conocenos-celular/Ingles/1.png`, `2.png`, `3.png` (Siguen en español; `AboutPage.tsx` pedía `.webp` — **corregido**)

---

## 7. DISEÑO DE FASE FUTURA: `ADMIN — GESTOR DE ARTES E IMÁGENES DE LA WEB` (PRIORIDAD 5)

Para permitir que el administrador cambie banners y artes en español/inglés (Web y Móvil) desde el panel administrativo sin tocar código:

1. **Colección Firestore propuesta:** `site_assets` (o documento `settings/site_artwork`).
2. **Esquema de cada slot (`SiteArtworkSlot`):**
   ```ts
   export interface SiteArtworkSlot {
     id: string; // ej. 'home_hero_badge', 'home_bento_1', 'about_slide_1'
     section: 'home_hero' | 'home_bento' | 'about_carousel';
     title: string;
     recommendedWebSize: string;    // ej. '800x500 px'
     recommendedMobileSize: string; // ej. '750x750 px'
     esWebUrl: string;
     esMobileUrl: string;
     enWebUrl?: string;
     enMobileUrl?: string;
     enVerified?: boolean;          // true si la imagen en inglés está aprobada
     updatedAt?: string;
     updatedBy?: string;
   }
   ```
3. **Almacenamiento en Firebase Storage:**
   - Ruta estructurada: `site-artwork/{slotId}/{lang}_{device}_{timestamp}.{ext}` (protegido por `storage.rules` con `isAdmin()` y límite de 8MB `image/*`).
4. **Integración con Frontend (`src/lib/artworkRegistry.ts`):**
   - `artworkRegistry.ts` ya expone `getLocalizedArtwork(slotId, language, overrides?)`. Cuando se conecte el gestor admin, `StoreContext` leerá `site_assets` y lo pasará como `overrides` sin cambiar una sola línea en `HomePage.tsx` ni `AboutPage.tsx`.

---

## 8. INSTRUCCIÓN EXACTA PARA EL SIGUIENTE AGENTE (CODEX / GEMINI)

1. Lee [`BRIZ_HANDOFF_CODEX.md`](./BRIZ_HANDOFF_CODEX.md) para ver el detalle técnico completo.
2. Ejecuta `npx tsx scripts/verify-briz-core.ts` y `npx tsc --noEmit` para comprobar que los tests unitarios del motor y la compilación están en verde.
3. **Siguiente tarea ejecutable inmediata:** el propietario completa [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md) en Emulator, ya que la política de URL impidió al agente volver a abrir localhost. Después preparar dry-run de conciliación de datos sintéticos/protegidos, sin migrar producción. Mantener las fases futuras al inicio de este roadmap; no iniciar el gestor de imágenes todavía.
