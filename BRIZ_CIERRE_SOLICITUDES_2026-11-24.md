# BRIZ — cierre de solicitudes y evidencia (2026-11-24)

## Estado de ramas y publicación

| PR | Estado actual | Evidencia / bloqueo |
|---|---|---|
| #21 bilingüismo y artes | Open, Draft, branch `codex/briz-bilingual-ui`; head `d35ac2f9682f8ffc41c2c3a6973afe2d4e25cc1d` | Build Production local y smoke Emulator+Playwright pasan. No se fusiona: aún hay gráficos con español incrustado. Vercel Preview para el nuevo SHA está PENDING; el intento anterior falló y la causa interna no se pudo leer por falta de acceso legítimo al scope. |
| #22 traducción automática | Open, Draft, apilada sobre #21, head `352338670537611cd078f2628300b37c2470751e` | Provider disabled por defecto; tests con mock. Se detectó que un error definitivo no libera la cuota diaria reservada. PR figura CONFLICTING mientras #21 no se integra. Vercel Preview FAILURE. Secret/API/roles/cuotas/costo sin verificar. |
| #20 Tiempo Libre | Open, Draft, separado, head `befe0f584727fedb06ddc74d47533bf25efd3eb9` | Fase 1 en Emulator y motor puro de prorrateo no comercial, sin cobros; pruebas dirigidas y Playwright 390×844/1280×900 pasan. Se mantiene sin integración ni despliegue. Vercel Preview FAILURE; motivo no verificado. |

`main` conocido: `8ec37d91429d9a22b5f1ee4fdf272c0065fe15b5`. No se desplegó a Firebase ni Vercel en esta sesión. No se usaron datos reales para pruebas.

## Matriz de solicitudes

| Área | Desarrollado / estado | Comprobación | Pendiente |
|---|---|---|---|
| Bilingüismo visible | UI ES/EN; búsqueda, textos de taller, errores de acceso/cámara, placeholders de inicio/recuperación localizados. Selector de idioma no recarga. | `npm run test:i18n-ui`; `npm run test:i18n-visual`, 10 rutas en 390×844 y 1440×900, con Emulators y escáner de texto visible; formulario condicional/error; modal Sign In y recovery. PASS | Inglés visual completo bloqueado por artes. El escáner no interpreta texto de imágenes. |
| Artes inglés y “cuadro amarillo” | Corregidas como traducidas las variantes móviles existentes de “WHY CHOOSE BRIZ” (slot `home_bento_3_shop`) y “THE BRAND” (slot `home_bento_4_routes`). Antes el resolver usaba fallback español en móvil. | Inspección visual de los PNG en web/móvil y aserciones de `currentSrc` desde Playwright. Cuadro amarillo identificado como “THE BRAND”; `home_splash_yellow` es otro sticker y no corresponde. | Litzy debe aportar/verificar `vive.webp` en inglés, collage “UNA bicicleta…”, arte de taller con el letrero español, variantes de About y otras imágenes pendientes listadas en `BRIZ_ARTES_EN_INGLES.md`. Overlays `publicArtworkConfig` de Production no quedaron confirmados mediante lectura pública; no se inspeccionaron documentos privados de Storage. |
| Galerías / protección de datos | Varias fotos y traducciones persisten sin reemplazar descripciones, campos fuente ni stock. | `test:pr19-gallery-visual` en Emulator (390×844/1440×900): galería, navegación, carga tras recarga, edición EN, upload pendiente y 403. `test:inventory-draft-protection` PASS. `test:product-gallery` PASS. | Descargas reales siguen a validación manual en navegador, si Ale lo solicita. |
| PR #21 / Vercel | No publicada. | Build web local Production reproducible. Para head `d35ac2f…` el check Preview está PENDING y Comments SUCCESS. El head anterior sí falló (`GYPezgFYXre2kpK9zapHDHzTKTtq`); `pachax.bo@gmail.com` recibe 403 por falta de acceso al scope `gfabrigtrf-7085s-projects`, así que el error interno de ese build sigue sin verificar. No se desactivó protección. | Acceso legítimo de lectura al equipo/proyecto BRIZ para obtener logs; artes pendientes para cumplir inglés gráfico completo. |
| Traducción persistente #22 | Implementación preliminar para inventario, combinados, rutas, eventos y categorías; controles de fuente/metadata y escritura allowlist. Provider `disabled` por defecto; Emulator mock disponible. | Código PR inspeccionado; Firestore tiene default deny fuera de matches y no expone `translationCache` / `translationUsage` a clientes. | Corregir liberación del cupo diario al fallar provider; confirmar que Functions nuevas no se desplieguen con Google secret inexistente. API, secreto, permisos mínimos, cuotas y costo siguen sin comprobarse; no activar ni facturar. Rebasear #22 solo después de integrar #21. |
| Tiempo Libre #20 | Sesiones Emulator con hora del servidor, idempotencia, reserva de stock, cierre unpaid y motor puro de prorrateo `tarifa × milisegundos / hora`; no asigna mínimo, redondeo ni límite. | `npm run test:free-time`: PASS, 12 escenarios de Functions, regresión de alquiler fijo, cálculo matemático y Playwright real 390×844/1280×900. Emulators y secretos ficticios aislados; build Functions y web PASS. | Ale debe definir mínimo, redondeo, duración máxima, recargos y reglas ante reservas futuras. No activar cobro, integrar ni publicar hasta confirmar esas reglas. |
| Contrato y aceptación | Se buscó el contrato localmente en los directorios disponibles; no apareció. | Búsqueda de nombres `CONTRATO/contrato` en workspace previo sin resultados. | Solicitar el archivo para comparar alcance. No declarar entrega/aceptación formal sin evidencia. |

## Pruebas ejecutadas en esta sesión

- `npm run test:i18n-visual`: **PASS** (build Production local + Firebase Emulator aislado + Playwright en 10 rutas, 390×844 y 1440×900; incluye modal de acceso/recuperación y formulario de taller).
- `npx tsx scripts/artwork-registry.test.ts`: **PASS**; confirmó 30 slots y registró fallbacks ingleses restantes.
- `npm run test:product-gallery`: **PASS**.
- `npm run test:i18n-ui`: **PASS** (26 claves bilingües y cobertura estática de 39 archivos públicos).
- PR19 gallery visual Emulator: **PASS** (galerías, recarga, ES/EN y edición/admin con productos ficticios).
- PR18 `inventory-draft-protection` Emulator: **PASS**.
- PR20 `test:free-time`: **PASS** (12 escenarios de Functions/Emulator; reinicio/consulta, concurrencia, última unidad, reservas, doble cierre, daño, permisos de sucursal, modalidad fija y pruebas Playwright con pantalla 390×844 y 1280×900). El motor monetario solo devuelve prorrateo bruto sin políticas comerciales.
- `npx tsx scripts/verify-briz-core.ts`: **PASS 18/18**.
- ESLint focalizado: **sin errores nuevos**; conserva cuatro errores preexistentes no modificados (3 en `Navbar.tsx`, 1 en `HomePage.tsx`).

## Notas de cierre

- No se enviaron correos, no se llamó a Google Translation, no se modificó Production ni secretos/IAM/rules.
- Build web advierte un chunk JS mayor a 500 KB, como antes; no impide terminar la compilación. Functions Emulator usa Node 26 en este equipo aunque el runtime del proyecto es Node 22.
- La revisión pública de `www.briz.com.bo` confirmó que el arte `vive.webp` se sirve como fallback actual. Una captura no reveló documentos `publicArtworkConfig`; esto no prueba que no existan overrides, por lo que su estado permanece sin confirmar.
- La matriz no constituye aceptación del cliente ni declaración de cumplimiento contractual.
