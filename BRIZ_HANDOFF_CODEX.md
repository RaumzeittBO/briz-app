# BRIZ (`briz.com.bo`) — DOCUMENTO DE HANDOFF TÉCNICO PARA CODEX

## Addendum de seguridad/gate de release — 2026-10-21

- Último cambio local: `firestore.rules` niega `create/update/delete` directos en `rentals`; Admin y Manager solo leen por Web SDK y las mutaciones pasan por Functions/Admin SDK. Prueba agregada: cada rol no puede cambiar `status`, `paymentStatus`, `total`, `amountPaid`, ni borrar; el acceso por sede de lectura permanece.
- Validación ejecutada: `npm run test:firebase` (Rules + Auth/Firestore/Functions/Storage; reserva pública, callables administrativas, pagos, transiciones e inventario), reportes, reconciliación ficticia (8/22), motor 16/16, TypeScript, build web, build Functions y ESLint del test de Rules: todo pasó. Avisos: `/noise.png`, bundle ~1.97 MB, Functions Emulator corre sobre Node24 aunque runtime pide Node22, un warning de metadata lookup sin fallo.
- Sin escrituras productivas: las Rules corregidas aún no están publicadas. No se habilitaron APIs, no se desplegaron índices/Functions, no hubo push/merge ni deploy Vercel. PR #1 y `main` siguen intactos conforme a lo verificado antes de este cambio; volver a comprobar antes del release.
- **Bloqueo antes de merge: Telegram.** No se puede verificar/activar notificación sin token rotado. Propietario: revocar el token viejo y generar uno nuevo en BotFather; guardar token y chat ID directamente como secretos `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` del proyecto Firebase `briz-4ef3a` mediante Secret Manager o `firebase functions:secrets:set`, sin enviar el token por chat. Activar trigger solo después; si no se hará ahora, pedir decisión explícita de aceptar release temporal sin Telegram. No fusionar hasta esa decisión/configuración.
- Mantener `briz-staging` sin operaciones y sin Blaze. No forzar Preview hacia producción. Antes de continuar: confirmar respaldo recuperable y deployment de Vercel, revisar APIs/IAM/costos inesperados y dominios Auth; publicar backend/índices de forma explícita y compatible; después merge solo cuando se cierre Telegram; frontend nuevo antes de Rules estrictas; comprobar login, navegación y health sin writes reales.

## Estado vigente de release — 2026-10-21

El siguiente resumen es el estado actual de solo lectura y supersede los estados antiguos que negaban acceso a Rules/Auth/Vercel. No ejecutar producción, push ni merge sin una autorización final del propietario.

- Auth Email/Password habilitado. Existe un Admin ficticio activo y coincidente: `prueba2@briz.com`, UID `C8MUz2wZrPOyaNySZc44YShLHoJ3`, `adminUsers/{uid}` con `role=admin`, `active=true`, sin `store` (Admin global). No se creó ni modificó usuarios. Sin Admin de recuperación señalado.
- Dominios Auth observados: `localhost` y dominios Firebase predeterminados; falta `www.briz.com.bo`. Confirmar alta antes de validar enlaces de verificación/recuperación desde el dominio productivo.
- Reglas publicadas se capturaron sin escribir en [`BRIZ_PRODUCTION_RULES_BASELINE_2026-10-21.md`](./BRIZ_PRODUCTION_RULES_BASELINE_2026-10-21.md). Firestore Rules actuales son críticamente permisivas (sesión autenticada equivale a Admin, lecturas públicas y varios creates públicos); Storage Rules sí consultan rol/active. No han cambiado. La Rules nueva pasa Emulator; publicarla justo después del frontend nuevo por incompatibilidad con el cliente viejo que escribe directo.
- Project `briz-4ef3a` sigue en Blaze, Firestore `southamerica-west1`, bucket `briz-4ef3a.firebasestorage.app`, 0 Functions / 0 índices compuestos remotos y 4 índices locales. APIs core visibles habilitadas: Identity Toolkit, Firestore, Cloud Functions, Firebase Storage; IAM de despliegue no verificado. Cloud Build/Run/Artifact Registry/Eventarc no aparecen habilitadas en la lista visible; resolver antes del primer deploy de Functions v2. Node 22, región `us-central1`.
- Functions de primer lote: 10 callables del frontend (`beginCustomerRegistration`, `createCustomerProfile`, `getMyRentals`, `getAdminCustomers`, `createRentalGroup`, `adminRentalAction`, `recordRentalPaymentMovement`, `updateRentalGroup`, `provisionAdminUser`, `createServiceOrder`), más `syncRentalAvailabilityProjection` y `backendHealth`. Excluir `sendReservationNotification` hasta rotar/configurar secretos Telegram en Secret Manager; mostrar outbox como omitido/no enviado, nunca como procesado.
- Vercel UI confirma `briz-web` y 9 variables Firebase en Production únicamente (valores ocultos). Build Production equivalente con SDK config de `briz-4ef3a` pasó, sin Emulator ni staging; bundle no incluye marcadores del token Telegram. Variables viejas Telegram siguen en Production y Preview y requieren rotación/retiro coordinados. No se generó deployment.
- Rollback Vercel verificado en Overview: Production Ready `main` commit `0140452678d23e6e352dcaacd353bfe7342912f5`, deployment ID `GEwbCAyYGzKDjCPPfv6phF75nyZ1` / host `briz-3ah6hfwrc-gfabrigtrf-7085s-projects.vercel.app`, dominios `briz.com.bo` y `www.briz.com.bo`; Instant Rollback disponible. Confirmar el estado otra vez justo antes de la ventana. `084dcb2` solo es Preview Ready.
- Suites locales: Reports, reconcile (8 fixtures / 22 hallazgos), core 16/16, build local/Production equivalente, Firebase Emulator y `tsc --noEmit` pasaron al repetir Firebase sin compilación Vite simultánea (primera ejecución agotó timeout 10s al arrancar Functions). Functions compila. ESLint dirigido: 51 errores/0 warnings — 49 `no-explicit-any` en cuatro páginas Admin activas y dos `no-unused-expressions` en `InventoryPage.tsx`; revisar como deuda de calidad, no como fallos críticos probados. Avisos: host Node24 para Functions Node22, metadata lookup emulator, `/noise.png`, bundle JS >1.9 MB.
- Corregida copia de recibo pública: antes QR/transfer mostraban “confirmado” pese al estado server-side `pending` y el despliegue sin Telegram no envía aviso automático. Ahora muestra solicitud recibida, pendiente de confirmación y sin aviso automático; regresión bilingüe `npm run test:reservation-receipt` pasó. Build web local y build Production equivalente posterior al cambio pasaron; bundle sin marcadores Telegram.
- Git: HEAD previo `d750571653abff183ea6e2a8565588039c091fb8`, `origin/codex/...` `2c288adccb2e49c43ea568e801168760f5c27030`, 4 commits docs-only por publicar. No push para evitar un Preview rojo esperado; PR #1 sigue Draft, main intacta.

**Siguiente paso exacto:** terminar checks locales; presentar autorización única para: verificar snapshot/deployment y dominio, habilitar únicamente APIs necesarias, desplegar índices, desplegar explícitamente lote de 12 Functions excluyendo Telegram, verificar salud, merge aprobado que auto-publica Vercel a `main`, activar las Rules estrictas inmediatamente después y comprobar lecturas. No escribir alquiler/pago real; la prueba de transacción de producción requiere autorización de datos aparte.

## Handoff vigente — salida directa controlada (2026-10-21)

El propietario decidió no enlazar Billing ni operar más `briz-staging`; se evalúa un release controlado directo a `briz-4ef3a`. No se hicieron cambios productivos ni push durante esta evaluación.

- Pruebas recién ejecutadas: `npm run test:firebase`, `npm run test:reports`, `npm run test:reconcile` (8 fixtures, 22 hallazgos), motor 16/16 y `npm run build` (TypeScript+Vite) pasaron; build Functions pasó dentro de la suite Firebase. ESLint dirigido a los archivos críticos devuelve 32 errores de calidad (any/Fast Refresh), sin impedir build.
- Estado remoto Firebase read-only: DB Firestore `(default)` en `southamerica-west1`; Functions 0; índices remotos 0 frente a cuatro en `firestore.indexes.json`. Estado de Rules, Auth y roles no fue consultable. No leer documentos de clientes ni ejecutar writes para resolverlo.
- Al inicio de esta evaluación, la rama local `codex/briz-critical-stabilization-20261020` estaba en `7aaa6304afe3cd17550f47687ca9968f457af423`, con dos commits docs por delante del remoto `2c288adccb2e49c43ea568e801168760f5c27030`. Este addendum añade documentación local y no se ha publicado. No push: la PR #1 sigue Draft y el Preview falla intencionalmente por guard staging. `origin/main` = `0140452678d23e6e352dcaacd353bfe7342912f5`; no usar el branch local `main` adelantado.
- Vercel API actual devuelve 403 para scope `gfabrigtrf-7085s-projects`. La web pública responde HTTP 200. La UI había confirmado previamente nueve variables Firebase Production-only; no se verificaron otra vez en esta llamada.
- Bloqueo de compatibilidad: el `main` remoto aún usa escrituras directas de alquileres; las reglas nuevas deniegan esos writes y el frontend de la rama depende de Functions. Por eso: índices → Functions → frontend Production/merge → Rules/Storage estrictas. No aplicar las reglas antes de cambiar el cliente.
- Bloqueo seguridad: el viejo `origin/main` lee `VITE_TELEGRAM_BOT_TOKEN`, que Vite puede incrustar en bundle público. Rotar en BotFather antes de publicar, usar Secret Manager para los nuevos valores, retirar el env `VITE_*` después de verificar que el cliente nuevo está activo. El primer Admin debe crearse con procedimiento seguro del propietario porque `provisionAdminUser` requiere un Admin activo existente.
- Próxima acción: revisión de preparación y autorización explícita del propietario para el paquete coordinado de release que detalla [`BRIZ_RELEASE_READINESS.md`](./BRIZ_RELEASE_READINESS.md). No probar escrituras/cobros en producción sin autorización específica.

## Handoff — guardas Firebase/Vercel y continuidad de release — 2026-10-21

### Actualización de sesión — Vercel Preview y variables Production — 2026-10-21

- HEAD/Rama: `2c288adccb2e49c43ea568e801168760f5c27030` en `codex/briz-critical-stabilization-20261020`, sincronizada con origin antes de esta nota. PR #1 sigue OPEN/Draft; `main` no cambió.
- Firebase CLI creó `briz-staging` y registró su app web. No hay billing enlazado por esta sesión. La base aún no existe: la operación devolvió 403 porque Cloud Firestore API no está habilitada. CLI leyó únicamente metadatos de Production (Firestore `southamerica-west1`) para proponer igual región; no se leyeron documentos.
- Storage/Functions de Firebase requieren Blaze. `gcloud` no está instalado y la consola Firebase integrada redirigió al selector de Google indicando sesión cerrada; no se automatizó login ni se pudo listar Cloud Billing accounts, establecer budget o habilitar API desde la UI. Esperar a que el propietario indique/autorice la cuenta de billing y el budget antes de activar Blaze. No añadir valores Preview ni iniciar el deployment de la rama todavía.
- En la sesión integrada Vercel del proyecto `briz-web` / `gfabrigtrf-7085s-projects`, con autorización expresa, se añadieron nueve `VITE_FIREBASE_*`/banderas y se verificó la lista después de recargar. Todas muestran entorno Production; ninguna se añadió a Preview. Los valores no se incluyen en documentación ni respuesta. No se inició Redeploy. Variables anteriores de Telegram/Maps permanecen intactas.
- Build Logs de `2c288ad`, `bc879d9`, `d1009c9` y `d9905b2` confirman el mismo fallo en `npm run build`: `Firebase is disabled for Vercel Preview until a dedicated staging Firebase project is configured.` La protección impide usar `briz-4ef3a` en Preview. No volver a disparar builds Preview hasta configurar Firebase staging.
- Firebase CLI read-only renovada: cero Functions desplegadas y cero índices compuestos remotos; el repo contiene cuatro índices y `firebase.json` apunta a Rules/índices/Functions Node22. Estado de Rules/Storage publicados sigue sin verificarse. No se desplegó ni se consultaron/escribieron datos reales.
- Revalidación local: suite `npm run test:firebase` pasó (configuración 9 checks, reglas Firestore/Storage e integración Auth/Firestore/Functions/Storage); reportes, reconciliación 8/22, motor 16/16, TypeScript y build web pasaron. Build Functions pasó como parte de la suite; `npm test --prefix functions` detecta 0 tests con el patrón actual. Avisos: host Emulator Node24/Functions Node22, `/noise.png` sin resolver, bundle ~1.97 MB.
- Próximo paso exacto: obtener cuenta de billing autorizada, confirmación del propietario y monto/moneda mensual del alert; después enlazar únicamente a `briz-staging`, habilitar servicios, aprovisionar Firestore en la región decidida, Rules/índices/Functions/Storage, Auth y datos sintéticos. Configurar Vercel Preview desde app config staging y probar web. Production permanece sin cambios.
- No empujar los siguientes cambios de documentación mientras cada push dispare un Preview fallido; mantenerlos como commit local hasta que staging permita validar Preview. No pulsar Redeploy todavía.

Los bullets de estado que siguen, hasta “Próxima ejecución”, son la foto histórica antes de la actualización anterior y quedan supersedidos por ella.

- Estado al iniciar: `084dcb2ab918c3cf6e19a9d0bc229ad52ad08558`; código `d1009c948ea1de4f0de10dbec40b88c628d355a7`; documentación/cierre `d9905b286296f2b763dd1bbfe5b60b7b49f5465f`. Push normal; `git ls-remote` coincide con HEAD `d9905b2`. PR #1 permanece OPEN/Draft con ese head, sin checks asociados y `main` sin cambios.
- Vercel Browser integrado verificó la URL y scope `gfabrigtrf-7085s-projects/briz-web`. Se inspeccionaron solo nombres y ámbitos. No hay Firebase vars; Firebase Preview queda rechazado por código hasta staging. Variables viejas de Telegram/Máps continúan en Production y Preview; no se retiraron.
- Firebase SDK web se contrastó con el web app del proyecto `briz-4ef3a`, sin revelar configuración ni modificar recursos. `src/lib/firebaseConfig.ts` aplica allowlist, proyecto Production fijo, Emulator local y fail-closed en Preview. Vite valida al construir un deployment Vercel; `firebase.ts` además valida runtime y configuración de una app preexistente.
- Archivos nuevos: `.env.example`, `src/lib/firebaseConfig.ts`, `scripts/firebase-config.test.ts`, `firestore.indexes.json`. `firebase.json` ahora referencia índices necesarios de rentals/sales/serviceOrders/adminUsers. No se desplegaron.
- Telegram: `VITE_TELEGRAM_*` no se incluye usando el allowlist; sentinel comprobado ausente del bundle. `sendReservationNotification` usa Secrets de Functions, no reintenta entregas ambiguas, mantiene la reserva independiente y marca estado factual. Variables Vercel antiguas aún presentes. Bloqueado hasta rotación de token por propietario y seteo seguro de Secrets; no pedir ni guardar token en chat.
- Validación final local: `npm run test:firebase` pasó (rules, cuatro emuladores, grupos, catálogo/stock, ledger, notificación sin secretos); `test:firebase-config` 7; `test:reports`; `test:reconcile` 8/22; `verify-briz-core.ts` 16/16; `tsc --noEmit`/build; Functions build; ESLint modificado; Preview negativo rechazó Production y build Emulator pasó. Build warnings: `/noise.png`, bundle ~1.97 MB. Emulator usa Node24 anfitrión mientras Functions declara Node22. Cero escrituras productivas.
- Variables Production-only guardadas y verificadas: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_ENVIRONMENT`, `VITE_USE_FIREBASE_EMULATOR`. Preview no recibe valores Firebase hasta tener staging distinto de `briz-4ef3a`.
- Vercel browser UI leyó Environment Variables y Deployments para el proyecto/team esperados; la lista de deployments alcanza `084dcb2` Ready, pero no aparece `d9905b2`. El API connector retorna 403 y CLI scoped fallback no reconoce este team. PR #1 no reporta checks para el head nuevo. La home pública `www.briz.com.bo` carga; corresponde al `main` antiguo (`0140452`) y no se usó para operaciones.
- No fusionar/deployar. Functions no están desplegadas según último chequeo read-only; índices Rules/Storage activos necesitan confirmación. Merge requiere variables aprobadas/validadas, staging aislado, Functions/Rules/índices compatibles, validación manual, respaldo/rollback y secreto rotado.

### Próxima ejecución

Provisión autorizada del proyecto staging y publicación solo en staging; después poblar datos ficticios, configurar Preview con ese staging y reanudar builds. La verificación de un deployment Production y cualquier release continúan coordinados y separados. Rotar Telegram antes de activar notificaciones.

## Estado de Caja y cierre de PR #1 — 2026-10-21

- Baseline al abrir este trabajo: `db8814706e40d41dc6e299d33c4ed36cb7c903c6`; commits del cierre: `87d2fbd` (código) y `37b3501` (docs). El push normal fue autenticado por la credencial Git Credential Manager `pachaxbo-commits`; `git ls-remote` coincidió con `37b35016d3f96b0dd473794d030c9694c6c6373b` en `origin/codex/briz-critical-stabilization-20261020`.
- Decisión del propietario vigente: una corrección no crea deuda, no es reembolso, no altera stock ni estado. Métricas: `netCash = gross receipts - actual refunds`; `netRecognized = netCash - non-cash accounting corrections`; `pending = rental contract total - all receipts` (excluye correcciones y reembolsos). Fecha de contrato/pending: programada; fecha de caja: fecha real.
- Compatibilidad anterior al ledger: paid legacy solo se toma del documento histórico cuando todavía no hay movimientos para ese grupo. Al comenzar ledger, el recibo sintético legacy se crea una vez, y las proyecciones `paymentStatus/amountPaid` no se cuentan además del movimiento.
- Excepción de legacy que requiere conciliación: un documento con `amountPaid/paidAt` pero estado actual `unpaid`/`pending_review` no se importa ni se cuenta automáticamente. No inferir de esos campos si fue cobro, corrección o reembolso.
- El check Vercel SUCCESS consultado al abrir la sesión es anterior a esta corrección y no valida su Preview ni Firebase. El vínculo Firebase/variables Vercel sigue sin conocerse por el 403 previo del scope `gfabrigtrf-7085s-projects`; no se repitió ese intento. Propietario debe confirmar IDs y dataset aislado en Preview y `main` Production Branch.
- No afirmar click-through visual completado: debe hacerla el propietario en Emulator, desktop y móvil; ver `BRIZ_ADMIN_MANUAL_VALIDATION.md`. Las suites automatizadas no equivalen a aprobación visual/comercial.
- PR #1 permanece Draft y sin merge. Merge requiere: aprobación visual del propietario; Preview con Firebase aislado; disparadores y alcance de publicación en `main` conocidos; Rules/Functions/índices/esquema compatibles (consulta actual devolvió cero Functions e índices compuestos); respaldo restaurable y rollback ensayado; cero bloqueos críticos. No desplegar ni editar `main` como parte de este bloque.
- Suites repetidas tras la regla final pasaron: Firebase, reportes, conciliación (8 fixtures/22 findings), motor 16/16, TypeScript y build. ESLint dirigido: helper/Functions/tests limpios; 20 `no-explicit-any` en `AdminRentalsPage.tsx` (preexistentes). Build advierte `/noise.png`, bundle ~1.97 MB y Emulator usa Node24 con Functions Node22.
- Firebase `briz-4ef3a` consultado read-only: Functions desplegadas `[]`, índices compuestos `None`; publicación activa de Firestore/Storage Rules no verificable porque gcloud no está instalado. No se consultaron usuarios ni documentos reales. Las nuevas callables precisan release backend autorizado y plan compatible; no desplegado.
- Commit de código probado y publicado: `d2e07529673a19b45ae278bb6581aecb055fb3b1`; `git ls-remote` coincide con `origin/codex/briz-critical-stabilization-20261020`. PR #1 Draft, base `0140452678d23e6e352dcaacd353bfe7342912f5`; consulta post-push aún sin checks nuevos (`statusCheckRollup=[]`). El check SUCCESS previo no valida este commit. Configuración Vercel sigue sin acceso por el 403 previo y no se reintentó.
- No se ha hecho revisión visual del Owner ni accedido a Preview con flujos de escritura. El bloqueo del navegador localhost no se evade; iniciar una sesión Emulator conforme a los comandos del checklist.

## Estado previo del cierre de caja — 2026-10-21 (superado por el addendum al inicio)

- Base de trabajo: `41a74773db88ae3fddc30bded64b6d29239f7f87`. Commit final actual `5abcd1f2c1bb21258c0edaef832b4f3388fcb5cb`, publicado en `origin/codex/briz-critical-stabilization-20261020`; `git ls-remote` coincide con HEAD. `origin/main` en la última consulta: `0140452678d23e6e352dcaacd353bfe7342912f5`.
- Ledger `rentalPaymentMovements`: abonos parciales/múltiples, devoluciones de dinero explícitas, correcciones no monetarias, actor/sede/método/importe/fecha real/referencia, idempotencia y auditoría. QR/transferencia exige confirmación; reembolso/corrección requiere confirmación, motivo y referencia. Solo callable escribe; lectura es por sede.
- Se retiró el endpoint heredado que alteraba `paymentStatus` sin movimiento. Se encontró y corrigió el doble conteo de cobros legacy sintéticos cuando una fila ya estaba marcada pagada por el propio ledger. Reportes distinguen contratado, cobrado, reembolsado, corregido, neto y pendiente; fechas reales de movimientos y programación se mantienen separadas.
- Texto histórico supersedido por la decisión final del propietario y el cambio de esta sesión: la corrección no eleva el saldo contractual; reduce ingreso neto reconocido, no es flujo de caja y no cambia estado ni inventario. No se simula una transferencia real ni se borran cobros.
- Casos de Emulator: importe conocido Bs. 100 con abonos Bs. 40/Bs. 60 y concurrencia idempotente, reembolso Bs. 25, exceso rechazado, QR sin confirmación rechazado, corrección y permisos por sede. Rerun de `npm run test:firebase` pasó luego del fix de doble conteo. `test:reports`, `test:reconcile` (8 casos/22 hallazgos), motor 16/16, TypeScript y build web/Functions pasaron; el build avisa `/noise.png` y bundle JS ~1.97 MB.
- ESLint dirigido final: 38 errores existentes en Admin/contexto (principalmente `no-explicit-any`, además reglas Fast Refresh). El único `prefer-const` dirigido fue corregido. Los helpers, Functions y scripts seleccionados pasan ESLint limpios. Estos errores no corresponden al ledger nuevo.
- No se completó click-through visual: el navegador automatizado bloquea localhost y no se intentó evadir. La revisión owner/manual en escritorio y móvil sigue pendiente; usar `BRIZ_ADMIN_MANUAL_VALIDATION.md` exclusivamente con `demo-briz-security`.
- Estado histórico anterior de Vercel: el check estaba pending. La actualización al inicio de este handoff confirma SUCCESS de Preview; no se puede afirmar si usa Firebase productivo. No se hizo deploy a producción. Rules/Functions nuevas siguen sin desplegar a Firebase real.
- PR draft #1 abierto como `pachaxbo-commits`: [https://github.com/RaumzeittBO/briz-app/pull/1](https://github.com/RaumzeittBO/briz-app/pull/1). Estado GitHub: abierto, no fusionado, base SHA `0140452678d23e6e352dcaacd353bfe7342912f5`, head SHA `9ce840997ee3e51ec10a0cdbef9e711cc56308a5`. `git merge-tree origin/main HEAD` no encontró conflictos. El PR mostró un check de preview en curso; no se revisaron ni leyeron secretos/env values.

### Clasificación y siguiente bloque

| Área | Estado |
|---|---|
| Alquileres Admin / transiciones / caja | Implementado; pruebas automatizadas superadas; click-through visual pendiente |
| Inventario / disponibilidad / reportes | Pruebas automatizadas superadas; revisión visual manual pendiente |
| Integración a `main` | PR Draft listo para revisión, merge bloqueado por despliegue automático no confirmado y dependencia de Rules/Functions aún no productivas |
| Producción | Bloqueada; no lista para release. No desplegar ni migrar sin verificación/autorización |

Pendiente para fases posteriores: completar revisión manual; conciliación y migración histórica autorizada; Blaze/App Check/secretos/Telegram; auditoría integral restante de Admin; traducción ES/EN y diez artes en inglés; responsive completo y categorías/eventos móvil; gestor de imágenes Home desde Admin; ESLint restante y optimización; despliegue coordinado con autorización expresa. El último commit funcional publicado es `5abcd1f2c1bb21258c0edaef832b4f3388fcb5cb`; este documento queda en un commit de cierre posterior en la misma rama.

> Las secciones siguientes conservan el handoff previo como historial. Las políticas de pago descritas allí que contradigan este encabezado están supersedidas.

## Incidencia de cobros y exclusión de acciones — 2026-10-21 (continuación)

- En esta continuación se corrigió el alcance por sede de métricas monetarias y del gráfico de recibos. Contratado/pendiente siguen la fecha programada del alquiler; cobrado sigue `paidAt` (America/La_Paz). Las filas de dos sedes, anticipos, devoluciones y registros con un estado de pago corregido están cubiertas en `test:reports`.
- `AdminRentalsPage` bloquea mutaciones por ID de grupo a través de confirmación, entrega, pago, cancelación, expiración, edición y devolución. Todas muestran estado cargando, deshabilitan mutaciones incompatibles y no cierran ni anuncian éxito ante operación ignorada o fallida; las excepciones muestran error y permiten reintentar.
- Al cambiar un recibo de `paid` a `unpaid`/`pending_review`, backend preserva `amountPaid`/`paidAt` como evidencia histórica y registra before/after en `auditLog`. Reportes lo excluye como efectivo vigente, y el pendiente vuelve al total contratado. No se infiere reembolso. La política comercial para reembolsos reales, pagos parciales y ajustes contables sigue pendiente de aprobación; no borrar ni manipular cobros históricos.
- La integración Emulator incluye una regresión del cambio de estado de pago y verifica persistencia de fecha/importe/auditoría. No se completó navegación visual automatizada: el propietario debe abrir el entorno `demo-briz-security` y seguir el recorrido de 5 pasos en `BRIZ_ADMIN_MANUAL_VALIDATION.md`.
- ESLint dirigido reporta errores `no-explicit-any` preexistentes en `AdminRentalsPage.tsx` y `ReportsPage.tsx`; los archivos de soporte/Functions incluidos no agregan hallazgos. Revisar calidad en una fase separada.
- Suites de este cierre: `test:firebase`, `test:reports`, `test:reconcile` (8 ficticios/22 hallazgos), motor (16/16), TypeScript, build web y build Functions pasaron. ESLint del helper, Functions y scripts pasó limpio; ESLint dirigido a ambas páginas Admin informó 25 `no-explicit-any` operativos (20 alquileres, 5 reportes), sin fallas de build. El build mantiene avisos de `/noise.png` y chunk ~1.96 MB.
- Click-through visual queda pendiente del propietario. Siguiente paso: hacer el recorrido corto de `BRIZ_ADMIN_MANUAL_VALIDATION.md` en escritorio y móvil con Auth/Firestore/Functions/Storage Emulator; confirmar sede, estado, historial, importe y stock tras recarga. Después, atender la decisión comercial sobre reversos/parciales antes de modelar una contabilidad completa.
- Cierre Git: consultar el SHA y resultado de `git ls-remote` informados tras commit/push. No ejecutar producción, despliegue, merge, billing, App Check ni Telegram.

## Hotfix alquileres/reportes — 2026-10-21

> Registro histórico anterior al ledger. Las referencias a cambios manuales de `paymentStatus` y ausencia de movimientos parciales/reembolsos no describen el comportamiento vigente.

- Rama base `codex/briz-critical-stabilization-20261020`; SHA publicado al iniciar este hotfix `d4e89af173ad98670bbd5b1039f0d54392b4735`. Consultar historial de Git y `git ls-remote` para el commit final.
- Commit de implementación del hotfix `54605b98b25278f82d8a44c1853be5872ff46f64`; el push normal terminó correctamente y `git ls-remote` coincidió. La actualización de este handoff se publica en un commit documental separado.
- Confirmación Admin en tarjeta/modal: la UI cerraba el modal sin esperar el callable y no comunicaba ni bloqueaba una solicitud en curso. Se añadió bloqueo local/estado visible y el detalle se cierra solo tras éxito. Alta manual guarda y reutiliza su idempotency key hasta que también termina la confirmación.
- No se recuperaron los documentos que motivaron el reporte del propietario; no se puede concluir que hubiera reservas duplicadas. Las regresiones Emulator verifican idempotencia manual y carreras de confirmación: una única línea, una sola confirmación y un solo descuento físico. Confirmación sin disponibilidad deja la reserva pendiente y el inventario sin mutación.
- Causa de dinero omitido: el reporte filtraba por fecha del alquiler y los docs no tenían fecha de pago. `functions/src/index.ts` registra `paidAt` y `amountPaid` en pagos nuevos; Dashboard/Reports contabilizan efectivo en la fecha `America/La_Paz` del pago. Contratado y pendiente usan fecha programada. Los pagos registrados no desaparecen al cancelar/devolver; no existe inferencia de reembolso. Registros pagados legacy sin fecha son visibles como fecha desconocida solo en todo el historial; no se les asigna una fecha inventada.
- Casos Emulator: alta manual pagada para fecha futura; concurrencia/idempotencia de alta y confirmación; error por stock agotado; pago previo a entrega; devolución sana y dañada; devolución no crea pago; pagar después de devolver conserva status/historial; combos/accesorios/aros e inventario. Suite completa final de rules + integración pasó; una corrida previa dejó stock del fixture consumido y se corrigió cancelando el registro sintético.
- `test:reports` comprueba rango mensual vs histórico, pago fecha futura, legacy sin fecha, devuelto impago, pago posterior y línea de accesorio sin filtrado duplicado. TypeScript y builds finales web/Functions pasaron; web mantiene avisos `/noise.png` y bundle grande.
- No fue posible completar validación visual: política de navegador bloquea la apertura de localhost; no se evadió. Sigue pendiente operar todos los controles y vistas 360–430 px / desktop siguiendo `BRIZ_ADMIN_MANUAL_VALIDATION.md`.
- Lint seleccionado: 32 errores existentes en AdminRentals/Dashboard/Reports (mayormente `no-explicit-any` y React Compiler `preserve-manual-memoization`); revisar por separado. No se observó error nuevo en el helper ni en estas líneas de backend.
- Restricciones respetadas: Emulator demo únicamente, sin producción, deploy, merge, usuarios reales, migración ni facturación.

## Estado verificado por Codex — 2026-10-21 (Bloque 4)

- Rama activa: `codex/briz-critical-stabilization-20261020`; HEAD inicial de este bloque `05dd70a`, alineado con la referencia `origin/...` local y publicación confirmada por el usuario.
- Cierre del bloque: `0fc28d2` y `498bfbb` publicados; `git ls-remote` confirma `498bfbb24d5720228e89870b1c3769933a372bf6` igual a HEAD. Working tree limpio.
- Bloque 2: seguridad por rol/tienda, Firebase Auth para clientes, Functions con Admin SDK, reservas públicas y manuales atómicas/idempotentes, consulta sanitizada de clientes, historial propio, slots públicos y outbox Telegram.
- Validación real aislada en Emulator: suite de reglas Firestore/Storage y suite integrada Auth/Firestore/Functions/Storage. Solo IDs y datos ficticios `demo-briz-security`; sin producción, billing, secretos o migraciones.
- `npm run test:firebase` (reglas e integración), `npm run test:reconcile`, `npx tsx scripts/verify-briz-core.ts` (16/16), `npx tsc --noEmit`, `npm run build` y `npm run build --prefix functions` pasan. La primera suite Firebase paralela tuvo timeout de carga, pero la repetición secuencial pasó.
- GitHub: el usuario confirmó el push previo en `05dd70a`; este bloque publicó `0fc28d2` y `498bfbb`, verificando el SHA remoto final. No se repitió diagnóstico de cuenta/red.
- Validación visual parcial previa: Vite `http://127.0.0.1:5173/admin/rentals`, Auth/Firestore/Functions/Storage Emulator en `demo-briz-security`; login ficticio y creación `BRIZ-2026-0012` con combo aro 27, bici aro 26 y accesorio comprobadas. Detalle y editor se abrieron. La fecha no pudo manipularse fiablemente por automatización. La reapertura posterior fue bloqueada por la política URL del navegador, que prohíbe rodearla. Confirmación, pago, entrega, cancelación, devoluciones, inventario, reportes y ciclo tras recarga siguen pendientes visualmente. En 390 px el detalle requiere scroll vertical.
- Reconciliación histórica preparada, solo con datos ficticios: `npm run test:reconcile` pasó con 8 alquileres y 22 hallazgos; la ejecución de solo lectura contra Emulator detectó 18 alquileres, 15 grupos, 3 inventarios, 5 clientes y 10 hallazgos. Cubre estados ES, falta de grupo/availabilityGroupId, combos ambiguos, pagos, estado/stock y enlace Auth ausente. El plan de migración con snapshot restringido, desidentificación, dry-run, aprobación de mapeos, lotes idempotentes, puntos de control, umbrales de parada, verificaciones posteriores y rollback se describe en `BRIZ_MASTER_ROADMAP.md`. Ninguna migración ni producción modificada.
- Hallazgos del Bloque 4: Auth secundario de Settings ahora conecta al Auth Emulator; venta manual desde manager conserva campo de sede; `briz_inventory` heredado ya no se sube automáticamente y requiere migración autorizada; el fixture core ahora calcula fechas futuras. Auditoría técnica Admin en roadmap. No sustituye validación visual.
- Para completar el click-through, sigue [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md). El seeder se restringe a `demo-briz-security` y endpoints de loopback. No se ha declarado probada visualmente ninguna operación adicional al alta manual previa.
- Preparación de release y bloqueos concretos: [`BRIZ_RELEASE_READINESS.md`](./BRIZ_RELEASE_READINESS.md). En particular, App Check está desactivado por defecto y el outbox requiere política de recuperación para estados `sending`.
- Pendientes: conciliación/migración histórica; preparación Blaze, App Check y credenciales; revisión integral de Admin; traducción completa ES/EN; diez artes ingleses; responsive completo; categorías/eventos móvil; gestor de imágenes Home; lint/optimización; preparación del despliegue solo con autorización.
- Próximo paso exacto: el propietario recorre `/admin/rentals` siguiendo el checklist manual solo con Emulator; después se prepara el dry-run de conciliación sobre copia sintética/desidentificada autorizada. Mantener abierta la validación visual móvil/escritorio.
- **No desplegar a producción, no migrar usuarios ni tocar inventario real. No fusionar con main.**
- Implementación bloque 2: `6a09918` (`feat(firebase): secure booking and customer auth flows`); documentación y validación registradas en `92e20d9`.

### Bloque 3 — edición y ciclo administrativo transaccional

- Rama conservada: `codex/briz-critical-stabilization-20261020`, con `db522d4` como base inmediata del bloque.
- `functions/src/index.ts` incorpora `updateRentalGroup` para reemplazar las múltiples escrituras de `handleSaveEditedGroup`, y `adminRentalAction` para confirmar/entregar/devolver/cancelar/expirar/registrar pagos. Ambas verifican rol/sede y vuelven a leer el estado dentro de transacciones Admin SDK.
- El panel administrativo y las funciones de alquiler exportadas por `StoreContext.tsx` llaman al backend; la UI ya no agrega o modifica directamente documentos de alquiler. El botón que antes borraba ahora cancela y conserva historial. Devoluciones usan cantidad dañada explícita y no incluyen recargos no autorizados.
- Historial compatible: los estados de reserva en español funcionan; al editar un registro sin sede o sin `availabilityGroupId` se conserva lo que se conoce y el sistema genera solo el identificador técnico faltante. Si un combo multiaro no identifica sus componentes, la operación se bloquea en vez de inventar el aro. Managers sin sede verificable son denegados.
- La conciliación `scripts/reconcile-rentals.ts` no escribe nunca y se niega a ejecutarse sin el Emulator `demo-briz-security`. Ejecutar con `npm run reconcile:rentals`.
- `npm run test:firebase` pasó en la continuación tras incluir combo+accesorio con aro explícito. La suite cubre reglas, edición/altas/bajas/aros/stock, ciclo, pagos, historial legacy y carreras; el script reinicia el limitador ficticio entre escenarios solo en el emulador.
- `npm run lint` continúa fallando globalmente; captura más reciente: 207 errores, 10 warnings (217 problemas). El ESLint dirigido a Functions/backend/scripts nuevos pasa. El build aún avisa por `/noise.png` y el bundle grande.
- Al cerrar originalmente el bloque 3 no se había hecho recorrido visual. La continuación registró la creación manual y el estado parcial arriba; no completó el ciclo visual por el bloqueo del navegador. No hubo producción, despliegue, migración ni modificación de inventario real.
- Próxima tarea exacta: recorrer `/admin/rentals` con navegador conectado solo a Emulator (crear y buscar cliente, crear manual, editar bici/combo/accesorio, confirmar, pagar, entregar, ampliar sin conflicto, devolver sana/dañada, cancelar y recargar); después ampliar casos de manager multi-sede y auditar disponibilidad/outbox con un dataset sintético de volumen.

> El resto de este documento conserva contexto histórico del repositorio. Para el estado vigente y los pendientes, sigue esta sección y el inicio de `BRIZ_MASTER_ROADMAP.md`.

---
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

> **Corrección del estado histórico (2026-10-21):** los párrafos siguientes describían riesgos anteriores al Bloque 2 y están supersedidos. Auth de clientes ya usa Firebase Authentication/Functions; Firestore bloquea lectura cliente de `customers` y `rentals`, la disponibilidad pública usa `rentals_busy_slots` sanitizados, y el código actual no contiene secretos Telegram `VITE_*`. Esto no significa que el sistema esté aprobado para producción; ver `BRIZ_RELEASE_READINESS.md`.

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

## 5. SIGUIENTE TAREA EJECUTABLE PARA CODEX (HISTÓRICO; VER ESTADO VIGENTE AL INICIO)

1. **Conciliación y migración segura de datos históricos:** iniciar con inventario de inconsistencias en copia/emulador, acordar mapeos y producir plan reversible; no escribir producción sin autorización.
2. Luego seguir las diez fases ordenadas al inicio de `BRIZ_MASTER_ROADMAP.md`. La revisión visual pendiente de `/admin/rentals` debe completar reserva pública → confirmación → entrega → edición → pago → devolución y comprobar reportes e inventario en desktop y 360–430 px.
