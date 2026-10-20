# BRIZ (`briz.com.bo`) — DOCUMENTO DE HANDOFF TÉCNICO PARA CODEX

> **Propósito:** Permitir que **Codex** (o cualquier ingeniero/agente subsecuente) continúe el trabajo sobre `g:\ProjectBriz` con contexto total, sin depender del historial de chat de Gemini y sin repetir ni destruir avances ya probados.

---

## 1. RESUMEN EJECUTIVO DE LA INTERVENCIÓN

El proyecto BRIZ fue sometido primero a una auditoría profunda y posteriormente a un plan de estabilización por fases:

1. **Fase 1 (Motor de Alquileres, Stock, Estados e Intervalos):**
   - Se crearon `src/lib/dateUtils.ts`, `src/lib/rentalPricing.ts` y `src/lib/rentalAvailability.ts`.
   - Se reemplazó el código de reserva inseguro (`rentals.length + 1`) por un generador transaccional `BRIZ-YYYY-NNNN` respaldado por `counters/rentals_YYYY` e inspección del máximo histórico.
   - Se diferenciaron los estados `pending`, `confirmed`, `delivered`, `returned`, `cancelled`, `expired` manteniendo compatibilidad total con los estados heredados en español (`Confirmado`, `Entregado`, `Devuelto`, `Cancelado`, `Pendiente`, `Vencido`).
   - Se implementó el cálculo de disponibilidad por intervalo horario (`getAvailableStockForInterval`) que reconstruye la capacidad operativa (`shelfStock + currentlyDeductedUnits`) y resta únicamente las reservas que se solapan en el tiempo, evitando el doble descuento de alquileres confirmados.
   - Se blindaron las operaciones administrativas (`confirmRentalGroup`, `deliverRentalGroup`, `returnRentalGroup`, `cancelRentalGroup`, `deleteRentalGroup`, `updateRental`) mediante transacciones de Firestore (`runTransaction`).
   - Se añadió soporte para devolución con daño o mantenimiento (`returnCondition: 'ok' | 'damaged' | 'maintenance'`), enviando unidades dañadas a `maintenanceStock` sin inflar ni devolver unidades rotas al stock disponible.
2. **Fase 2 (Bicicletas Combinadas y Accesorios):**
   - Los accesorios adicionales elegidos en `RentalCheckoutWizard.tsx` ahora se guardan estructurados en `selectedAccessories: RentalAccessorySelection[]` además de las notas, y su stock real se valida, descuenta al confirmar y libera al devolver/cancelar.
   - El selector de accesorios en el Paso 1 del Wizard público fue rediseñado en un formato compacto de filas/chips con controles `- / +` y stock disponible en tiempo real.
3. **Fase 3 (Precios, Tarifas y Fechas Bolivia UTC-4):**
   - Se centralizó el cálculo de precios en `src/lib/rentalPricing.ts`, eliminando el bug de `NaN` cuando el idioma estaba en inglés y corrigiendo las tarifas de accesorios por tramos (1–3h, 4–8h, 24h, semana, mes).
   - Se eliminó el uso de `.toISOString().split('T')[0]` para fechas locales, usando `getBoliviaDateString()` (`America/La_Paz`, UTC-4).
4. **Fase 4 (Reportes y Contabilidad):**
   - Se corrigió el error crítico donde los alquileres devueltos (`returned` / `Devuelto`) desaparecían de los ingresos en `DashboardPage.tsx` y `ReportsPage.tsx`.
   - Se añadieron filtros de período (`Hoy`, `Ayer`, `Últimos 7 días`, `Este mes`, `Histórico`, `Rango personalizado`), métricas de flota, horas alquiladas, devoluciones con retraso y exportación CSV/Excel + Impresión/PDF.
5. **Fase 5 (Seguridad y Reglas):**
   - En `src/lib/security.ts`, el hashing de contraseñas y PIN se actualizó a **PBKDF2-HMAC-SHA256** (`100,000` iteraciones + sal aleatoria de 16 bytes, formato `pbkdf2$100000$<saltHex>$<hashHex>`), manteniendo verificación retrocompatible para `sha256$` y texto plano heredado (`needsUpgrade: true` actualiza automáticamente el hash en Firestore cuando el usuario inicia sesión).
   - Se prepararon `firestore.rules` y `storage.rules` (no desplegadas aún a producción; ver sección 5 de `BRIZ_MASTER_ROADMAP.md`).
6. **Fase 6 (Traducciones Públicas, Artes en Inglés y Corrección Móvil):**
   - Se desactivó la dependencia destructiva de Google Translate en `LanguageContext.tsx`, ampliando `src/lib/translations.ts` y traduciendo de forma nativa las páginas y componentes públicos (`Navbar`, `Footer`, `HomePage`, `AboutPage`, `RentalsPage`, `ShopPage`, `RoutesPage`, `ServicePage`, `CommunityPage`, `ContactPage`, `ProfilePage`, `RentalCheckoutWizard`, `DeliveryMapPicker`, `CustomerAuthModal`).
   - Se creó `src/lib/artworkRegistry.ts` y `BRIZ_ARTES_EN_INGLES.md` para gestionar los artes con texto incrustado sin provocar errores 404 (como ocurría en `AboutPage.tsx` al pedir `/Conocenos-web/Ingles/1.webp` cuando solo existían `.png` en español).
   - Se corrigió en `src/pages/public/RentalsPage.tsx` el bug móvil/desktop donde el bloque "Eventos Especiales" aparecía encima de la categoría seleccionada.

---

## 2. COMANDOS DE VERIFICACIÓN OBLIGATORIOS

Antes y después de cualquier cambio, ejecuta desde `g:\ProjectBriz`:

```bash
# 1. Ejecutar suite de pruebas unitarias e integrales de motor (20+ aserciones deterministas)
npx tsx scripts/verify-briz-core.ts

# 2. Verificar tipos de TypeScript en todo el proyecto
npx tsc --noEmit

# 3. Verificar compilación de producción con Vite
npm run build
```

---

## 3. MAPA DE ARCHIVOS PRINCIPALES Y DEPENDENCIAS ENTRE CAMBIOS

```
src/
 ├── lib/
 │    ├── dateUtils.ts            # Fechas UTC-4 Bolivia, parseo de horas, cálculo de intervalos [startMs, endMs]
 │    ├── rentalPricing.ts        # Cálculo de tarifas de bicis/combos y accesorios por duración (ES/EN safe)
 │    ├── rentalAvailability.ts   # Motor de stock por intervalos, demandas de stock, deltas y helpers Tx
 │    ├── security.ts             # PBKDF2-HMAC-SHA256 (100k iteraciones) + retrocompatibilidad sha256$/texto plano
 │    ├── artworkRegistry.ts      # Registro seguro de artes ES/EN con fallback si el arte EN falta o sigue en ES
 │    ├── translations.ts         # Diccionario central ES -> EN y helper translateText(text, lang)
 │    ├── whatsapp.ts             # Generador de mensajes de WhatsApp localizados (ES/EN)
 │    └── telegram.ts             # Notificaciones Telegram (lee import.meta.env.VITE_TELEGRAM_*)
 ├── context/
 │    ├── StoreContext.tsx        # Estado Firestore + transacciones confirm/deliver/return/cancel/delete/update
 │    ├── AuthContext.tsx         # Login Admin + PIN con PBKDF2 y migración transparente
 │    └── LanguageContext.tsx     # Selector ES/EN instantáneo en React (sin recargas ni Google Translate)
 ├── components/
 │    ├── layout/
 │    │    ├── Navbar.tsx         # Navegación pública y enlaces profundos por categoría (?category=...)
 │    │    ├── Footer.tsx         # Pie de página localizado ES/EN
 │    │    └── CustomerAuthModal.tsx # Registro/Login de clientes con PBKDF2 y traducción ES/EN
 │    └── rentals/
 │         ├── RentalCheckoutWizard.tsx # Wizard de 3 pasos con validación por intervalos y accesorios compactos
 │         └── DeliveryMapPicker.tsx    # Mapa interactivo de entrega a domicilio localizado ES/EN
 └── pages/
      ├── public/
      │    ├── HomePage.tsx       # Inicio con artworkRegistry.ts y textos 100% bilingües
      │    ├── AboutPage.tsx      # Conócenos con artworkRegistry.ts (sin 404 .webp en inglés) y textos bilingües
      │    ├── RentalsPage.tsx    # Catálogo con disponibilidad en vivo y fix de Eventos Especiales en móvil
      │    ├── ShopPage.tsx       # Tienda bilingüe con stock real por aro
      │    ├── RoutesPage.tsx     # Rutas bilingües (mojibake corregido)
      │    ├── ServicePage.tsx    # Taller mecánico bilingüe
      │    ├── CommunityPage.tsx  # Comunidad bilingüe
      │    ├── ContactPage.tsx    # Contacto bilingüe
      │    └── ProfilePage.tsx    # Perfil de cliente bilingüe con estados de alquiler claros
      └── admin/
           ├── AdminRentalsPage.tsx # Gestión de ciclo completo (Confirmar, Entregar, Devolver OK/Dañado, Editar)
           ├── InventoryPage.tsx    # Inventario con visualización de maintenanceStock
           ├── DashboardPage.tsx    # KPIs con ingresos de devueltos incluidos y fechas Bolivia
           └── ReportsPage.tsx      # Reportes avanzados con filtros de fecha, ranking y exportación CSV/PDF
```

---

## 4. RIESGOS CONOCIDOS Y LO QUE NO DEBE CONSIDERARSE VALIDADO EN PRODUCCIÓN TODAVÍA

> **SEGURIDAD PENDIENTE:** la autenticación pública de clientes y el cálculo de disponibilidad todavía dependen de acceso directo a Firestore. Es obligatorio diseñar una solución de autenticación/autorización segura y una API o mecanismo de disponibilidad pública sin exponer datos privados. El hashing PBKDF2 en el cliente no resuelve este problema. También debe eliminarse el uso de tokens de Telegram en variables `VITE_` y rotarse cualquier token que haya sido expuesto.

### Lista Estricta de Pendientes de Validación y Desarrollo (No marcar como completamente terminados hasta superar validación integral):
- **Pruebas integrales con Firebase Emulator.**
- **Ciclo completo en vivo: Reserva → confirmación → entrega → devolución.**
- **Conciliación real de stock y reportes.**
- **Validación visual móvil y escritorio.**
- **Revisión manual completa de traducciones.**
- **Diez artes pendientes en inglés.**
- **Gestor de imágenes de la página principal desde Admin.**

1. **Pruebas contra Firestore Real / Emulador (`PENDIENTE DE VALIDACIÓN`):**
   - `scripts/verify-briz-core.ts` valida exhaustivamente toda la lógica pura y las transiciones de estado en memoria (`PRUEBA UNITARIA SUPERADA`), pero las transacciones `runTransaction(db, ...)` dentro de `StoreContext.tsx` deben probarse interactivamente con Firebase Emulator y navegador (`npm run dev`) antes de dar el visto bueno final a producción.
2. **Despliegue de `firestore.rules` (`BLOQUEADO`):**
   - No desplegar `firestore.rules` cerrando `allow read` en `customers` y `rentals` hasta que el login de clientes se mueva a Firebase Auth o Cloud Function y exista un endpoint/colección pública sanitizada de disponibilidad.
3. **Artes Gráficos Pendientes de Diseño en Inglés (`BLOQUEADO POR DISEÑO`):**
   - Hay 10 imágenes con texto incrustado cuyo archivo en inglés aún no existe o tiene el diseño en español copiado por error. `src/lib/artworkRegistry.ts` muestra de forma segura el arte original en español para evitar enlaces rotos (404). Ver lista exacta en [`BRIZ_ARTES_EN_INGLES.md`](./BRIZ_ARTES_EN_INGLES.md).

---

## 5. SIGUIENTE TAREA EJECUTABLE PARA CODEX

1. **Validación E2E en Navegador (`npm run dev`):**
   - Crear una reserva desde `RentalsPage.tsx` eligiendo fecha, hora, duración y accesorios.
   - Entrar a `/admin/rentals`, confirmar la reserva (`Confirmado`), marcarla como entregada (`Entregado`) y luego devolverla (`Devuelto`) probando tanto condición `OK` como `Dañada / Mantenimiento`.
   - Verificar en `/admin/reports` que el ingreso sigue contabilizado tras la devolución.
2. **Implementación de Fase 7 (`ADMIN — GESTOR DE ARTES E IMÁGENES DE LA WEB`):**
   - Seguir el diseño de la Sección 7 de `BRIZ_MASTER_ROADMAP.md`: conectar `artworkRegistry.ts` a una colección `site_assets` en Firestore y agregar una pestaña en `SettingsPage.tsx` para subir las versiones Web/Móvil en Español e Inglés desde el panel administrativo.
