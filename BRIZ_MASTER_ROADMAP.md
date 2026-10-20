# BRIZ (`briz.com.bo`) — MASTER ROADMAP & ENGINEERING LOG

> **ÚLTIMA ACTUALIZACIÓN:** 2026-10-20 (Continuación Controlada, Validación Real y Nuevos Pendientes)  
> **ESTADO GENERAL DEL PROYECTO:** En estabilización avanzada — Motor de alquileres, stock transaccional, seguridad PBKDF2, traducción pública integral, registro de artes en inglés y correcciones móviles en ejecución y validación.  
> **DOCUMENTO COMPLEMENTARIO OBLIGATORIO:** Ver [`BRIZ_HANDOFF_CODEX.md`](./BRIZ_HANDOFF_CODEX.md) y [`BRIZ_ARTES_EN_INGLES.md`](./BRIZ_ARTES_EN_INGLES.md).

## Continuación Codex — 2026-10-20

- Base comprobada: `e7b4d5de8af5b09b2b69b0cf0d019acef07532ce`, rama `briz/stabilization-review-20261020`.
- Rama de trabajo: `codex/briz-critical-stabilization-20261020`.
- Cambios en curso: reglas ahora requieren registro activo con rol válido para admin; lectura/escritura pública de clientes y alquileres se cerró; `rentals_busy_slots` es la colección pública prevista para disponibilidad; se quitó el bootstrap del primer administrador en el navegador; errores de escritura de `addRental` y de contador ya se propagan; se retiraron las credenciales Telegram `VITE_*` del módulo web.
- **No desplegar estas reglas todavía.** El checkout de navegador aún depende de escrituras directas, el login de clientes aún valida hashes descargados, y el lector público aún consulta `rentals`. El cierre de reglas expone estos bloqueos de forma segura, pero el flujo necesita Functions con Admin SDK para crear reservas transaccionalmente, Firebase Auth para cuentas existentes y una proyección sanitizada para disponibilidad. Telegram queda pausado hasta añadir Functions con secretos. No hay migración de cuentas implementada todavía.
- Contador real observado en el cliente: `settings/rental_counter`; documentación histórica que menciona `counters/rentals_YYYY` es incorrecta para este commit. La escritura al contador también debe moverse al endpoint de reservas antes de habilitar las reglas cerradas.
- Commit de este bloque: `70b85b3` (`fix(security): close public customer and rental access`), subido a la rama remota `origin/codex/briz-critical-stabilization-20261020`.
- Pruebas ejecutadas: `npx tsx scripts/verify-briz-core.ts` aprobado (16/16); `npx tsc --noEmit` aprobado; `npm run build` aprobado (Vite reportó `/noise.png` no resuelto en build y un chunk JS de ~1.97 MB); `npm run lint` falló con 234 hallazgos preexistentes en el repositorio (incluye `initial_store.tsx` binario y `src_backup`); lint aislado de `src/lib/telegram.ts` aprobado; `git diff --check` aprobado.
- Firebase Emulator: pendiente, no configurado en `firebase.json` y no existe suite de reglas/E2E. No se ejecutaron los 18 flujos pedidos, ni se modificó Firebase real.
- Próximo paso exacto: añadir Functions con Admin SDK para alta idempotente de grupos, validación autoritativa de precios/stock, transición de `rentals_busy_slots` y outbox Telegram; migrar clientes existentes a Firebase Auth con recuperación segura; conectar el frontend a esos endpoints; luego configurar Emulator y pruebas de reglas/concurrencia antes de mantener el cierre de reglas.

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

> [!CAUTION]
> **SEGURIDAD PENDIENTE:** la autenticación pública de clientes y el cálculo de disponibilidad todavía dependen de acceso directo a Firestore. Es obligatorio diseñar una solución de autenticación/autorización segura y una API o mecanismo de disponibilidad pública sin exponer datos privados. El hashing PBKDF2 en el cliente no resuelve este problema. También debe eliminarse el uso de tokens de Telegram en variables `VITE_` y rotarse cualquier token que haya sido expuesto.

### Pendientes Obligatorios de Validación y Cierre (No considerar terminados por tener solo pruebas unitarias):
- **Pruebas integrales con Firebase Emulator.**
- **Reserva → confirmación → entrega → devolución.**
- **Conciliación real de stock y reportes.**
- **Validación visual móvil y escritorio.**
- **Revisión manual completa de traducciones.**
- **Diez artes pendientes en inglés.**
- **Gestor de imágenes de la página principal desde Admin.**

> [!WARNING]
> **DETALLE TÉCNICO ANTES DE EJECUTAR `firebase deploy --only firestore:rules`:**
> 1. **Autenticación de Clientes (`customers`) y Alquileres (`rentals`):**
>    - Actualmente, el login de clientes (`CustomerAuthModal.tsx` y `StoreContext.tsx`) consulta directamente la colección `customers` desde el navegador (`where('email', '==', ...)` o leyendo la colección) sin usar Firebase Authentication (`request.auth == null` para clientes públicos), y el motor público de disponibilidad necesita conocer los intervalos ocupados de `rentals`.
>    - Si en `firestore.rules` se bloquea hoy `allow read` en `customers` y `rentals` exigiendo `request.auth != null`, **se romperá inmediatamente el inicio de sesión de clientes, el perfil de cliente y el cálculo de disponibilidad en la web pública**.
>    - **Solución definitiva requerida antes de cerrar `allow read` en producción:**
>      1. Diseñar e implementar autenticación/autorización segura para clientes (Firebase Auth o Cloud Functions) y una API o colección pública sanitizada de disponibilidad (`rentals_busy_slots`) sin exponer PII (`customerName`, `customerPhone`, `customerDoc`), y entonces activar `allow read: if isAdmin()` sobre `customers` y `rentals`.
> 2. **Tokens de Telegram:**
>    - Eliminar por completo el uso de `VITE_TELEGRAM_BOT_TOKEN` en el cliente (moviendo el envío a un endpoint/Cloud Function backend) y rotar inmediatamente en BotFather cualquier token que haya estado expuesto.

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
3. **Siguiente tarea ejecutable inmediata:**
   - Levantar el entorno local (`npm run dev`) o Firebase Emulator Suite y realizar la **Validación Integral E2E (UI + Firestore)** de los flujos marcados como `PENDIENTE DE VALIDACIÓN` (creación de reserva en Wizard -> confirmación en Admin -> entrega -> devolución sana y con daño -> verificación de reportes).
   - Cuando el diseñador gráfico entregue los 10 artes en inglés listados en [`BRIZ_ARTES_EN_INGLES.md`](./BRIZ_ARTES_EN_INGLES.md), colocarlos en las rutas indicadas y cambiar `hasVerifiedEnWeb` / `hasVerifiedEnMobile` a `true` en `src/lib/artworkRegistry.ts` (o implementar la interfaz de subida en `SettingsPage.tsx` según el diseño de la Sección 7).
