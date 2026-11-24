# BRIZ — cierre de solicitudes y evidencia (2026-11-24)

## Estado de ramas y publicación

| PR | Estado actual | Evidencia / bloqueo |
|---|---|---|
| #21 bilingüismo y artes | Open, Draft, branch `codex/briz-bilingual-ui`, head `224952a4b840a4ccd93e0071195c1d10a5205d4d`; GitHub `MERGEABLE` | Build Production local y suites dirigidas de UI, galerías, inventario, agenda, reportes y reglas pasan. Preview actual **FAILURE**, causa interna no verificada. Consulta al deployment del scope `gfabrigtrf-7085s-projects` devolvió 403 y la autorización del scope no estuvo disponible; no se desactivó protección. Fallbacks de artes existen. No integrar a ciegas. Lista pendiente abajo y en `BRIZ_ARTES_EN_INGLES.md`. Sin escrituras ni comparación con inventario Production. |
| #22 traducción automática | Open, Draft, head `9612137`; base sigue `codex/briz-bilingual-ui`; GitHub `CONFLICTING` | Corregida la cuota con transacciones/idempotencia: reserva, consumo, liberación tras rechazo definitivo y reserva conservadora ante resultado ambiguo; caché y concurrencia probadas. Provider Google sigue deshabilitado. Emulator usa mock. No rebasar hasta integrar #21. Disponibilidad del servicio, secretos, roles, cuotas y costos no verificados. |
| #20 Tiempo Libre | Open, Draft, separada de main, head `642f387` | Cierre registra prorrateo bruto con tarifa snapshot y duración exacta cuando hay tarifa, conserva `unpaid` y el ledger rechaza cobros. Cierre concurrente probado: un solo cierre/auditoría y reposición de stock. Emulator, Playwright y ledger dirigidos pasan. No activar cobro ni publicar: faltan reglas comerciales de Ale. |

`main` conocido: `8ec37d91429d9a22b5f1ee4fdf272c0065fe15b5`. No se desplegó a Firebase ni Vercel en esta sesión. No se usaron datos reales para pruebas.

## Matriz de solicitudes

| Área | Desarrollado / estado | Comprobación | Pendiente |
|---|---|---|---|
| Bilingüismo visible | UI ES/EN; búsqueda, textos de taller, errores de acceso/cámara, placeholders de inicio/recuperación localizados. Selector de idioma no recarga. | `npm run test:i18n-ui`; `npm run test:i18n-visual`, 10 rutas en 390×844 y 1440×900, con Emulators y escáner de texto visible; formulario condicional/error; modal Sign In y recovery. PASS | Inglés visual completo bloqueado por artes. El escáner no interpreta texto de imágenes. |
| Artes inglés y “cuadro amarillo” | Corregidas como traducidas las variantes móviles existentes de “WHY CHOOSE BRIZ” (slot `home_bento_3_shop`) y “THE BRAND” (slot `home_bento_4_routes`). Antes el resolver usaba fallback español en móvil. | Inspección visual de los PNG en web/móvil y aserciones de `currentSrc` desde Playwright. Cuadro amarillo identificado como “THE BRAND”; `home_splash_yellow` es otro sticker y no corresponde. | Litzy debe aportar/verificar `vive.webp` en inglés, collage “UNA bicicleta…”, arte de taller con el letrero español, variantes de About y otras imágenes pendientes listadas en `BRIZ_ARTES_EN_INGLES.md`. Overlays `publicArtworkConfig` de Production no quedaron confirmados mediante lectura pública; no se inspeccionaron documentos privados de Storage. |
| Galerías / protección de datos | Varias fotos y traducciones persisten sin reemplazar descripciones, campos fuente ni stock. | `test:pr19-gallery-visual` en Emulator (390×844/1440×900): galería, navegación, carga tras recarga, edición EN, upload pendiente y 403. `test:inventory-draft-protection` PASS. `test:product-gallery` PASS. | Descargas reales siguen a validación manual en navegador, si Ale lo solicita. |
| PR #21 / Vercel | No publicada. | GitHub indica Preview **FAILURE** para `224952a4…` y Comments **SUCCESS**. Lookup del deployment del scope `gfabrigtrf-7085s-projects` devolvió 403 “Not authorized”; requiere acceso de lectura al proyecto `briz-web` o sesión autorizada del propietario. Team ID reportado: `team_wr5dDLXiSE0039XcnKAY2YVE`. La solicitud de autorización del conector respondió 404; no se repitió. Build Production local reproducible, pero no prueba que Preview fallara solo por protección. Preview permanece protegida. | Propietario concede acceso legítimo de lectura y obtiene los build logs/primer error. No forzar integración hasta conocer la causa. No hubo escritura en Production ni lectura comparativa de inventario. |
| Traducción persistente #22 | Implementación para inventario, combinados, rutas, eventos y categorías; conserva traducción manual/fuente, con provider `disabled` por defecto. | `npm run test:i18n-emulator`: PASS; reserva/consumo/liberación/ambigüedad, caché, reintento seguro y concurrencia usando proveedor mock. Reglas dejan colecciones internas sin acceso de cliente. | PR sigue CONFLICTING por su base #21. Al integrar #21, actualizar base y repetir pruebas. Antes de habilitar provider faltan confirmaciones de servicio, secreto, roles mínimos, cuota/costo y acuerdo comercial. |
| Tiempo Libre #20 | Sesiones con hora servidor, idempotencia/stock, tarifa horaria snapshot y cotización bruta exacta al cerrar; pago sigue `unpaid`, sin importe cobrado. Ledger rechaza movimientos para Tiempo Libre. | `npm run test:free-time`: PASS; incluye cierre simultáneo con dos claves (un ganador, una reposición de stock y una auditoría), regresión fija, Emulator y Playwright 390×844/1280×900. `test:manual-payment-ledger`: PASS en Emulator aislado y con secretos centinela. | Ale debe definir tarifa aplicable, mínimo, redondeo, topes, duración máxima, recargos y reglas ante reservas futuras. No integrar cobros ni activar hasta confirmarlo. |
| Contrato y aceptación | Se buscó el contrato localmente en los directorios disponibles; no apareció. | Búsqueda de nombres `CONTRATO/contrato` en workspace previo sin resultados. | Solicitar el archivo para comparar alcance. No declarar entrega/aceptación formal sin evidencia. |

## Pruebas ejecutadas en esta sesión

- `npm run test:i18n-visual`: **PASS** (build Production local + Firebase Emulator aislado + Playwright en 10 rutas, 390×844 y 1440×900; incluye modal de acceso/recuperación y formulario de taller).
- `npx tsx scripts/artwork-registry.test.ts`: **PASS**; confirmó 30 slots y registró fallbacks ingleses restantes.
- `npm run test:product-gallery`: **PASS**.
- `npm run test:i18n-ui`: **PASS** (26 claves bilingües y cobertura estática de 39 archivos públicos).
- PR19 gallery visual Emulator: **PASS** (galerías, recarga, ES/EN y edición/admin con productos ficticios).
- PR18 `inventory-draft-protection` Emulator: **PASS**.
- PR20 `test:free-time`: **PASS** (escenarios de Functions/Emulator, regresión de modalidad fija, daño, reservas y Playwright 390×844/1280×900). Nuevo cierre concurrente: dos claves distintas dejan un ganador, una auditoría y una reposición.
- PR20 `test:manual-payment-ledger`: **PASS** con fixtures demo. Efectivo confirmado escribe una vez; QR solo pasa a pagado al confirmar; Transferencia sin confirmación queda pendiente sin recibo. Configuración aislada por puertos ocupados; centinelas evitaron llamadas a Secret Manager/Telegram.
- PR22 `test:i18n-emulator`: **PASS** con mock: cuota reservada/consumida/liberada/ambigua, caché, reintento tras rechazo definitivo, sin retry duplicado tras timeout y límite concurrente.
- `npx tsx scripts/verify-briz-core.ts`: **PASS 18/18**.
- ESLint focalizado en archivos de prorrateo/cuota y pruebas nuevas: **PASS**. `functions/src/index.ts` reporta seis errores ya existentes en el bloque Storage (catch no usado/`any`; líneas 831–889 en #21 y 834–892 en #22), que no forman parte de estos diffs.

## Notas de cierre

- No se enviaron correos, no se llamó a Google Translation, no se modificó Production ni secretos/IAM/rules.
- El runner del ledger usa secretos centinela y configuración Emulator aislada; no se enviaron notificaciones reales ni se leyeron valores secretos.
- Build web advierte un chunk JS mayor a 500 KB, como antes; no impide terminar la compilación. Functions Emulator usa Node 26 en este equipo aunque el runtime del proyecto es Node 22.
- La revisión pública de `www.briz.com.bo` confirmó que el arte `vive.webp` se sirve como fallback actual. Una captura no reveló documentos `publicArtworkConfig`; esto no prueba que no existan overrides, por lo que su estado permanece sin confirmar.
- La matriz no constituye aceptación del cliente ni declaración de cumplimiento contractual.
