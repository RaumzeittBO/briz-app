# BRIZ — preparación de salida a producción

## Gate actualizado de seguridad — 2026-10-21

La regla local de `rentals` ahora niega todos los writes directos del Web SDK, incluidas escrituras/deletes de Admin y Manager. La prueba Emulator intenta cambios en `status`, `paymentStatus`, `total` y `amountPaid` para ambos roles y confirma `PERMISSION_DENIED`; la suite integrada confirma que callables autorizadas siguen confirmando, editando, cobrando, entregando, cancelando/devolviendo y manteniendo stock correcto. `npm run test:firebase`, reports, reconcile (8 fixtures/22 findings), core 16/16, TypeScript, build web, build Functions y ESLint del nuevo test pasaron. **La regla aún no está desplegada.**

El release no avanzó a operaciones productivas: no se publicaron índices, Functions ni reglas, no se publicaron commits, no se fusionó PR #1 y no se modificó `main`/Vercel. No se hicieron escrituras de datos ni cambios de Auth. PR/remote deben revisarse de nuevo antes del release.

**Bloqueo obligatorio antes del merge:** Telegram. La rama conserva el trigger basado en Secret Manager; no hay secreto rotado/verificado. El propietario debe revocar el token antiguo en BotFather, generar uno nuevo y cargarlo directamente en Secret Manager de `briz-4ef3a` como `TELEGRAM_BOT_TOKEN` (y `TELEGRAM_CHAT_ID`), nunca compartirlo en el chat. Luego se desplegará/verificará el trigger. Si no se configura en esta ventana, detenerse antes del merge y obtener decisión expresa del propietario para aceptar que temporalmente no habrá aviso Telegram. Las nuevas reservas sí continúan, con estado de outbox veraz.

Siguiente paso al reanudar: resolver Telegram y comprobar de nuevo backup recuperable, deployment Vercel anterior/rollback, permisos IAM y APIs/costos estrictamente necesarios. En cualquier fallo crítico, detenerse antes de la operación afectada. Orden de compatibilidad: índices → Functions → frontend en `main` → Rules/Storage estrictas inmediatamente tras comprobar el frontend nuevo. No usar el `main` viejo con Rules estrictas antes de la transición.

## Addendum final de verificación — 2026-10-21

Este addendum supersede los estados desactualizados más abajo que indican que Auth, Rules, Storage o los nombres de variables no pudieron verificarse. Solo se hicieron lecturas de consola y pruebas aisladas; no hubo escrituras, despliegue, push, merge ni modificación de `main`.

### Hallazgos confirmados

- Auth Email/Password está habilitado y hay tres cuentas ficticias. Un único Admin existente coincide entre Auth y `adminUsers`: `prueba2@briz.com`, UID `C8MUz2wZrPOyaNySZc44YShLHoJ3`, `active=true`, `role=admin`, sin `store` (global). Sin bootstrap inicial; el propietario no designó Admin de recuperación.
- `www.briz.com.bo` no figura en los dominios Auth autorizados vistos (sí `localhost` y dominios Firebase predeterminados). Antes de aceptar el release, agregar el dominio autorizado si se requieren flujos de verificación/recuperación/redirección del cliente desde producción y verificar esos emails.
- Corrección funcional de copy: el paso final decía que alquileres QR/transferencia estaban “confirmados”, aunque `createRentalGroup` guarda `pending`; además, sin el trigger de Telegram no sale mensaje automático. La pantalla ahora dice que la solicitud se recibió, está pendiente de confirmación y que no salió notificación automática, con enlace/indicaciones de perfil y WhatsApp en ES/EN. `npm run test:reservation-receipt` pasó; build final corre tras el cambio.
- Firestore Rules activas permiten que cualquier Auth autenticado se considere Admin y se autoescriba en `adminUsers`; además exponen lecturas públicas de clientes, alquileres, ventas y órdenes de servicio, y aceptan altas públicas. Este es el principal bloqueo crítico de seguridad. El baseline exacto recuperado está en [`BRIZ_PRODUCTION_RULES_BASELINE_2026-10-21.md`](./BRIZ_PRODUCTION_RULES_BASELINE_2026-10-21.md). Storage Rules activas exigen `role=admin` y `active=true`, validan tipos/tamaño, y tienen bucket existente `briz-4ef3a.firebasestorage.app`. No se cambiaron Rules ni archivos.
- Proyecto `briz-4ef3a` permanece en Blaze; Firestore `(default)` está en `southamerica-west1`. APIs core visibles habilitadas: Cloud Functions, Cloud Firestore, Firebase Storage, Identity Toolkit, Secure Token y Resource Manager; bucket existe. Functions/índices remotos: 0/0; repositorio: 13 exports (12 sin Telegram), cuatro índices. IAM no se inspeccionó y Cloud Build, Cloud Run, Artifact Registry y Eventarc no aparecen en la lista visible; la habilitación/permisos necesarios para Functions v2 son una puerta previa al despliegue, no se tocaron.
- Functions que necesita el frontend: `beginCustomerRegistration`, `createCustomerProfile`, `getMyRentals`, `getAdminCustomers`, `createRentalGroup`, `adminRentalAction`, `recordRentalPaymentMovement`, `updateRentalGroup`, `provisionAdminUser`, `createServiceOrder`; agregar trigger necesario `syncRentalAvailabilityProjection` y endpoint de lectura `backendHealth`. Primer deploy explícito de esas 12, Node 22 / `us-central1`, omitiendo `sendReservationNotification`. No habilitar Telegram hasta token rotado y ambos secretos puestos en Secret Manager; el outbox solo puede marcar los estados reales.
- Vercel UI confirmó el proyecto `briz-web` en `gfabrigtrf-7085s-projects` y los nueve nombres `VITE_FIREBASE_*` bajo Production solamente; los valores permanecieron ocultos. El build equivalente usó el SDK config obtenido por Firebase CLI para `briz-4ef3a`, `VERCEL_ENV=production`, `VITE_USE_FIREBASE_EMULATOR=false`, y pasó sin depender de staging. El bundle compilado no contiene marcadores de token ni endpoint Telegram. Variables antiguas Telegram y Google Maps siguen en Production y Preview; no se editaron. Rotar el token expuesto antes de cerrar el ciclo de seguridad.
- Overview Vercel muestra el Production Deployment Ready de `main` en `0140452678d23e6e352dcaacd353bfe7342912f5`, ID inmutable `GEwbCAyYGzKDjCPPfv6phF75nyZ1`, host `briz-3ah6hfwrc-gfabrigtrf-7085s-projects.vercel.app`; dominios `briz.com.bo`/`www.briz.com.bo` asociados y acción Instant Rollback disponible. Revalidar justo antes del release. El `084dcb2` mencionado en páginas de Preview no es rollback de producción.

### Validación repetida

- `npm run test:firebase`: primera ejecución superó Rules, pero Functions Emulator excedió su timeout de 10 s al coincidir con el build Vite y acabó con `functions/not-found`. Un único reintento sin otro build en paralelo cargó las 13 definiciones y completó el recorrido Auth/Firestore/Functions/Storage con exit 0.
- `npm run test:reports`, `npm run test:reconcile` (8 filas ficticias, 22 hallazgos), motor (16/16), `npm run test:reservation-receipt`, build web local y build Vercel Production equivalente posterior a la corrección de copy: pasaron. El bundle no tiene marcador Telegram. El build advierte `/noise.png` sin resolver y chunk JS ~1.97MB. Functions compila; emulador usó Node24 aunque se declara Node22, con un warning de metadata lookup transitorio.
- `npx tsc --noEmit`: exit 0. ESLint dirigido a `AdminRentalsPage.tsx`, `DashboardPage.tsx`, `InventoryPage.tsx`, `ReportsPage.tsx`, `backend.ts`, `firebaseConfig.ts` y `functions/src/index.ts`: 51 errores, 0 warnings; 49 `@typescript-eslint/no-explicit-any` en páginas Admin operativas y 2 `no-unused-expressions` en `InventoryPage.tsx` líneas 224/226 por ternarios de efectos secundarios que ejecutan correctamente. No lo marco como limpio; tampoco es una regresión funcional, pero queda para una pasada de calidad posterior.

### Secuencia y bloqueos del release

1. Antes de ventana: renovar autorización y leer snapshot actual, confirmar que el deployment Vercel previo `GEwbCAyYGzKDjCPPfv6phF75nyZ1` continúa Ready, confirmar backup restaurable/export y autorizar el dominio Auth si hace falta. No exponer ni descargar datos personales.
2. Habilitar solamente APIs requeridas por Functions v2 que falten; verificar IAM para despliegue. Ambos aún son puertas sin confirmar.
3. `firebase deploy --only firestore:indexes --project briz-4ef3a`; esperar los cuatro índices en `READY`.
4. Desplegar el lote enumerado de Functions de manera explícita, sin `sendReservationNotification`; consultar lista y `backendHealth` antes de avanzar.

```powershell
firebase deploy --only firestore:indexes --project briz-4ef3a
firebase deploy --only functions:beginCustomerRegistration,functions:createCustomerProfile,functions:getMyRentals,functions:getAdminCustomers,functions:createRentalGroup,functions:syncRentalAvailabilityProjection,functions:adminRentalAction,functions:recordRentalPaymentMovement,functions:updateRentalGroup,functions:provisionAdminUser,functions:createServiceOrder,functions:backendHealth --project briz-4ef3a
# Solo después de verificar que el frontend nuevo está activo:
firebase deploy --only firestore:rules,storage --project briz-4ef3a
```

No incluir `functions:sendReservationNotification` hasta contar con token/chat rotados en Secret Manager; sin trigger, los documentos del outbox permanecen `pending` (no fueron enviados ni procesados).
5. Publicar commits/docs y PR; propietario revisa/aprueba merge. La rama Production Vercel auto despliega `main`. Asegurar que las nueve variables Production efectivas mantengan el project ID correcto, emulator=false. Confirmar deployment listo/SHA y Auth de lectura.
6. Con nuevo frontend activo, desplegar enseguida Firestore/Storage Rules nuevas. Esto deja intervalo breve con Rules antiguas permisivas; mantener ventana coordinada y monitorizada. No desplegar Rules estrictas primero: el `main` actual usa escritura directa y se rompería.
7. Verificar login/lecturas/nav/inventario/reservas/reportes sin escrituras. El ciclo de alquiler y pagos reales requiere una autorización específica de datos de prueba.

Rollback conjunto: restaurar exactamente las Rules previas desde el baseline, regresar Functions al código anterior compatible sin borrar recursos, y promover el deployment Vercel inmutable anterior. Conservar índices extra; no revertir ni borrar datos como rollback. Si cualquiera de las verificaciones previas/posteriores falla, detener la secuencia.

**No está listo para aprobación final todavía:** Rules Firestore activas son inseguras, faltan Functions e índices, el dominio Auth y APIs/IAM de gen2 no están listos/verificados, y no se comprobó la ejecución de los valores en un deployment Production. No son bloqueos el staging sin Blaze, Preview rojo esperado, deuda de lint no crítica ni Telegram si permanece deshabilitado. Completar los gates habilitantes y volver con una única autorización para la ventana; no hacer merge/deploy hasta entonces.

## Evaluación de publicación directa a producción — 2026-10-21

Decisión vigente del propietario: conservar `briz-staging` sin Blaze y sin más operaciones; evaluar una salida controlada directamente a `briz-4ef3a`. Esta decisión reemplaza los addenda anteriores que condicionaban el release a provisionar staging. No autoriza todavía cambios en Firebase, Vercel ni `main`.

### Resultado verificado en esta evaluación

- Pruebas locales aisladas en `demo-briz-security`: `npm run test:firebase` pasó configuración, reglas Firestore/Storage y el ciclo Auth/Firestore/Functions/Storage; `npm run test:reports` pasó; `npm run test:reconcile` pasó con 8 registros ficticios y 22 hallazgos; motor de alquileres pasó 16/16; `npm run build` pasó TypeScript y Vite; el build Functions pasó dentro de `test:firebase`.
- `npm run test:firebase` cubrió reserva pública idempotente, selección de aro/combos/accesorios, confirmación, entrega, cambios concurrentes, pagos/ledger, devolución dañada, límites de stock, roles, estados heredados en español y documentos sin campos recientes. Todo fue contra emuladores; no hubo escritura a producción.
- ESLint dirigido a los archivos operativos modificados terminó con 32 errores (`no-explicit-any` y `react-refresh/only-export-components`), 0 warnings. No impidió TypeScript/build, pero la deuda se debe tratar como calidad pendiente; no es evidencia de regresión funcional.
- Firebase CLI de solo lectura: `briz-4ef3a` tiene Firestore `(default)` en `southamerica-west1`, 0 Functions desplegadas y 0 índices compuestos remotos; el repositorio declara cuatro índices. No se pudieron consultar las Rules/Storage Rules activas ni el estado de Auth/proveedores/roles.
- `www.briz.com.bo` respondió HTTP 200 en una solicitud de solo lectura. `origin/main` está en `0140452678d23e6e352dcaacd353bfe7342912f5`. El `main` local está en otro commit local adelantado y no debe usarse como referencia de publicación. El API Vercel para `briz-web` devuelve 403 de alcance; no pudimos confirmar desde API la rama Production, el deployment inmutable para rollback ni las variables vigentes. Las nueve variables Firebase Production habían sido guardadas/verificadas previamente en la UI integrada; esta sesión no volvió a leerlas ni reveló valores.
- PR #1 sigue OPEN/Draft, base `main`, head remoto `2c288adccb2e49c43ea568e801168760f5c27030`. Los Preview fallidos siguen siendo el guard de separación staging; no se generaron builds adicionales. Los commits locales de documentación siguen sin publicar. No se consultaron reglas de protección/rulesets de GitHub en esta evaluación; el estado de checks no constituye aprobación para merge.

### Bloqueos imprescindibles frente a recomendaciones

**Bloquean la transición segura:** (1) Functions ausentes e índices remotos ausentes: publicar el frontend antes de ellos dejaría llamadas nuevas sin backend/consultas sin índice. (2) confirmar mediante consola el proveedor Auth activo, las cuentas autorizadas y sus UIDs/tiendas; `provisionAdminUser` exige que ya exista un Admin activo y no puede crear el primer Admin. (3) recuperar/exportar las reglas actuales y confirmar compatibilidad antes del cambio; su estado remoto no es verificable desde este CLI. (4) confirmar desde la sesión del propietario que Vercel Production apunta a `main`, que las nueve variables guardadas pertenecen a `briz-web` y registrar el último deployment Ready para rollback; el API disponible está denegado con 403. (5) rotar en BotFather el token antiguo porque `origin/main` lee `VITE_TELEGRAM_BOT_TOKEN` y el valor configurado en Vercel puede quedar embebido en el JavaScript público; guardar el nuevo token/chat solo en Secret Manager y retirar/revocar el valor viejo antes de publicar. (6) respaldar el estado actual y comprobar que el archivo/reglas de rollback esté disponible.

**No son bloqueos funcionales por sí solos:** tener staging es la recomendación más segura, pero no es requisito técnico si el propietario acepta el riesgo de una ventana productiva controlada. App Check está deshabilitado por defecto (`enforceAppCheck: false`): es una recomendación de endurecimiento previa a abrir ampliamente el servicio; el motor valida Auth/roles en acciones administrativas, pero las reservas públicas siguen siendo endpoints expuestos. El aviso Node24 del emulador frente a Node22 solicitado, `/noise.png`, bundle grande y deuda ESLint son mantenimiento; no fallaron compilación ni pruebas de negocio.

### Orden de transición sin web conectada a un backend incompatible

1. Antes de cambios, desde sesión autorizada confirmar ramas/proyecto/variables de Vercel, dominios/proveedor Auth, UIDs y perfiles Admin, exportación Firestore/Storage apropiada y reglas activas. Preparar restauración y anotar el deployment Production actual. No copiar datos personales al workspace.
2. Rotar el token Telegram antiguo inmediatamente antes de la ventana de release. Configurar `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` solo como secretos de Functions (sin escribirlos en chat o Vercel `VITE_*`). Como `sendReservationNotification` declara ambos secretos obligatorios, si no están listos desplegar inicialmente la lista explícita de Functions críticas excluyendo ese trigger; no hacer un deploy global que solicite secretos faltantes. En esa variante el outbox quedará pendiente, estado que debe mostrarse como tal; desplegar el trigger cuando los secretos estén listos. La guía Firebase confirma que `defineSecret` requiere un valor en Secret Manager y que la CLI lo solicita al desplegar una función vinculada.
3. Crear por procedimiento seguro de propietario el perfil inicial `adminUsers/{uid}` para una cuenta Auth existente; validar ese Admin y un Admin de recuperación. No activar reglas nuevas hasta confirmar los perfiles.
4. Desplegar primero, de forma aditiva, los cuatro índices y esperar estado `READY`; después desplegar las Functions críticas Node22 de `us-central1` mediante lista explícita (y el trigger Telegram solo con sus secretos disponibles). Verificar despliegue/lista, logs y salud no mutante. Esto no cambia la web `main` actual, que permanece en el backend anterior.
5. Con Functions listas, sacar PR #1 de Draft mediante revisión humana y merge aprobado a `main`; Vercel Production construye el nuevo frontend usando las nueve variables Production guardadas. Antes de continuar, verificar deployment READY, SHA, dominio y login/lecturas. No pasar solicitudes de prueba con cobros reales.
6. Solo cuando el nuevo frontend esté activo y dependa de las Functions desplegadas, publicar Rules Firestore y Storage probadas en Emulator. Así se evita desplegar primero reglas que bloquean las escrituras directas del `main` viejo. Verificar acceso por rol, lecturas públicas sanitizadas, Storage, reserva, stock y Caja con procedimientos aprobados. La web no tendrá una ventana sin las Functions necesarias; las reglas finales se activan después de que el cliente nuevo está publicado.
7. Una prueba end-to-end que cree reservas/pagos en Firebase real escribe datos y puede afectar reportes; requiere autorización separada con alcance de datos ficticios marcados. Sin esa autorización, limitar post-release a comprobaciones de lectura y no declarar validado el ciclo comercial en producción.

### Rollback preparado

- Conservar SHA remoto actual de `main` (`0140452…`), deployment Vercel Ready anterior, exportación de Firestore/Storage y copia exacta de Rules/Storage Rules previas antes de cambios. El ID de deployment debe obtenerlo el propietario en Vercel, pues la API retorna 403.
- Si falla el cliente, restaurar/promover el deployment Vercel inmutable anterior; no editar `main` directamente. Si fallan Functions, volver a desplegar el código de Functions anterior guardado; no borrar recursos. Si fallan Rules, volver a publicar exactamente la copia anterior. Los índices extra pueden quedarse: no eliminarlos como parte de rollback. No iniciar migraciones de datos durante el release.
- No se ha ejecutado ningún paso productivo de este plan. `briz-staging` permanece sin Blaze y no se volverá a operar.

## Actualización de preparación Firebase — 2026-10-21 (posterior a autorización)

### Variables Vercel guardadas

Proyecto verificado en la sesión integrada: `briz-web` / `gfabrigtrf-7085s-projects`. Por autorización expresa del propietario, se guardaron y se verificaron tras recargar las siguientes variables en **Production únicamente** (no se muestran valores):

### Firebase staging

- Firebase CLI creó el proyecto `briz-staging` y su app web. No se enlazó una cuenta de facturación ni se activó Blaze.
- La cuenta CLI pudo leer metadatos de producción y confirmó que la base Firestore `briz-4ef3a` está en `southamerica-west1`; se propone replicar esa región en staging. No se consultaron documentos.
- Firestore Database no se creó: la API Firestore devolvió 403 por estar deshabilitada. Tampoco hay bucket, Functions ni alerta de presupuesto. Firebase Console integrada redirige a selector Google con sesión cerrada; no se automatizó login. `gcloud` no está instalado, así que no es posible consultar IDs de billing accounts desde este equipo.
- Functions y Storage requieren Blaze según documentación oficial; la activación queda pendiente de que el propietario indique la cuenta de Cloud Billing permitida, el monto/moneda de alerta mensual y confirme el enlace a `briz-staging`. Un budget alert estándar no es un límite de gasto.

| Variable | Entorno | Función |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Production | Firebase Web SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production | Firebase Auth |
| `VITE_FIREBASE_PROJECT_ID` | Production | Guardado como `briz-4ef3a` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production | Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production | Firebase Web SDK |
| `VITE_FIREBASE_APP_ID` | Production | Firebase Web SDK |
| `VITE_FIREBASE_MEASUREMENT_ID` | Production | Firebase Web SDK |
| `VITE_FIREBASE_ENVIRONMENT` | Production | Debe ser `production` |
| `VITE_USE_FIREBASE_EMULATOR` | Production | Debe ser `false` |

Preview no recibió Firebase. Debe seguir sin variables hasta disponer de un proyecto staging, bucket, Auth, Functions y datos separados. El build rechaza Preview sin staging y el cliente rechaza cualquier proyecto `briz-4ef3a` fuera de Production. La ausencia de variables produce error explícito.

### Puertas aún cerradas

- Variables Firebase guardadas en Vercel Production; no se ha ejecutado un deployment para hacerlas efectivas ni verificar un build remoto. Guardar las variables no creó un deployment. Preview continúa bloqueado de forma intencional.
- Build Logs de Preview `2c288ad`, `bc879d9`, `d1009c9`, `d9905b2`: mismo error exacto `Firebase is disabled for Vercel Preview until a dedicated staging Firebase project is configured.` No agregar Firebase productivo a Preview ni iniciar más builds antes de provisionar staging.
- Firebase `briz-4ef3a`: consulta CLI read-only del 2026-10-21 muestra cero Functions desplegadas y cero índices compuestos remotos. Rules/Storage publicadas no quedaron verificables. El repositorio declara cuatro compuestos locales y apunta Rules, Storage Rules, índices y Functions en `firebase.json`; nada se desplegó.
- Revalidación local 2026-10-21 con `demo-briz-security`: `npm run test:firebase` pasó (config 9 checks, Rules Firestore/Storage, Auth/Firestore/Functions/Storage integrados); `test:reports`, `test:reconcile` (8 fixtures/22 hallazgos), motor (16/16), TypeScript y build web pasaron. La compilación Functions pasó en el flujo Firebase; `npm test --prefix functions` no tiene tests que coincidan con su glob (0 tests detectados). Avisos no bloqueantes: Emulator usa Node24 frente al Node22 declarado, `/noise.png` sin resolver y chunk JS ~1.97 MB.
- No activar el trigger Telegram hasta rotar token viejo en BotFather y cargar el nuevo como Secret Manager de Functions. Nunca poner token en `VITE_*`, repo o chat. No eliminar valores existentes en Vercel hasta que se verifique el endpoint nuevo y la rotación.
- PR #1 Draft; `main` no modificado. El merge no está listo: falta staging, rollout backend compatible, validación visual/funcional, comprender el auto-deploy Production, snapshot restaurable y rollback.
- El commit de código `d1009c948ea1de4f0de10dbec40b88c628d355a7` y el de documentación `d9905b286296f2b763dd1bbfe5b60b7b49f5465f` están publicados; `ls-remote` coincide con `d9905b2`. PR #1 OPEN/Draft, sin checks asociados al head actual. El panel Vercel de Deployments muestra como último artefacto visible `084dcb2` Ready, sin deployment actual del commit nuevo; Vercel API retorna 403 y CLI fallback dice que el scope no existe. `www.briz.com.bo` carga el sitio de `main` anterior (`0140452`), comprobado solo como página pública de lectura.
- El código de Functions compila y Emulator verifica reserva sin Telegram: outbox refleja `skipped_unconfigured`; `failed`/`delivery_unknown` no se reenvían automáticamente para evitar duplicados.

`VERCEL_ENV` está documentado por Vercel como variable disponible en build/runtime; además se observó el checkbox de System Environment Variables habilitado en el proyecto. Referencia: [Vercel System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables).

No deployar ni mergear hasta completar staging aislado y las puertas anteriores.

## Addendum — Caja y gates de PR #1 (2026-10-21)

- Vercel Preview informa deployment completado; esto solo valida que el artefacto de preview se construyó/publicó, no valida el flujo funcional ni su backend Firebase. El equipo propietario del proyecto `briz-web` (`gfabrigtrf-7085s-projects`) devuelve 403 a la conexión disponible; el destino Firebase de Preview no se puede confirmar. Bloqueado hasta que el propietario otorgue lectura o confirme de forma verificable `projectId`/bucket/emuladores/entorno aislado (sin revelar secretos). No ejecutar escrituras de sondeo.
- Caja (decisión comercial aprobada por propietario): bruto cobrado, reembolsos de caja, efectivo neto (bruto menos reembolsos), correcciones contables no monetarias, ingreso reconocido (efectivo neto menos correcciones) y saldo contractual pendiente (contratado menos cobros; no suma correcciones ni reembolsos) son indicadores separados. Ventanas de contrato y cobro usan sus fechas respectivas; sede se aplica a los dos.
- Legacy: solo filas `paid` sin ledger se reconocen/se convierten en recibo sintético único. `amountPaid/paidAt` con estado ya `unpaid` o `pending_review` es ambiguo y no se infiere; conciliar con evidencia y autorización antes de reconocerlo o migrarlo.
- Condición de merge: PR #1 no sale de Draft hasta revisión manual del Owner en Emulator o Preview staging aislado; configurar Preview y rama de producción de Vercel; desplegar y validar Rules/Functions/índices de forma compatible y autorizada; conocer qué publica `main`; restauración de backup y rollback ensayados; sin errores críticos. La semántica de Caja fue aprobada; no se incluye deploy ni merge en esta preparación.

### Fases diferidas (no iniciadas en este cierre)

1. Conciliación y migración de datos históricos, con respaldo y dry-run.
2. Preparación Blaze, App Check, Telegram y secretos (sin activar servicios).
3. Revisión integral restante de Admin.
4. Traducción natural ES/EN y diez artes gráficos pendientes en inglés.
5. Validación responsive integral; categorías/eventos en alquileres móvil si sigue el defecto.
6. Gestor Admin de imágenes de Home, después de cerrar alquileres críticos.
7. Limpieza de ESLint y optimización.
8. Preparación de despliegue seguro coordinado; ejecución solo con autorización expresa.

**Estado al 2026-10-21:** preparación documental y de código local; no se habilitó facturación, no se crearon secretos reales, no se desplegó y no se accedió ni escribió producción. Requiere revisión y autorización del propietario antes de cada operación de servicio.

| Requisito | Estado | Acción previa a publicación |
|---|---|---|
| Funciones v2 / Node 22 | Código compila localmente; Emulator probó flujos; consulta `briz-4ef3a` devolvió cero Functions desplegadas. No hay Functions en staging | Cuenta billing autorizada + confirmación para Blaze en staging; presupuesto, APIs, runtime/región; desplegar solo en staging hasta validar. Máquina/Emulator usan Node24 aunque el proyecto solicita Node22 |
| Firebase Blaze y costos | El propietario informa que producción `briz-4ef3a` está en Blaze. Staging `briz-staging` no tiene billing enlazado; no se activó Blaze | Propietario proporciona la cuenta de Billing permitida, budget mensual/moneda y confirma el enlace a staging; alertas no son límites automáticos |
| App Check | Bloqueante: helper callable mantiene `enforceAppCheck: false` por defecto | Registrar app web y proveedor reCAPTCHA Enterprise, integrar token/debug solo en staging, métricas y endurecimiento gradual de cada callable; acordar enforcement |
| Dominios Auth | No verificados en proyecto | Aprobar y añadir solo dominios públicos/preview necesarios; probar correo, recuperación y redirecciones |
| Secret Manager / Telegram | Los secretos solo están declarados; no hay credenciales productivas | Rotar primero token expuesto en BotFather; propietario entrega/configura token y chat autorizados mediante Secret Manager, nunca `VITE_*` |
| Recuperación de outbox | Bloqueante operativo identificado | Si el trigger cae después de marcar `sending`, el reintento ve `sending` y no reclama el registro. `skipped_unconfigured` tampoco se reintenta solo cuando después se cargan secretos. Diseñar lease/recovery y monitoreo; Telegram no ofrece idempotencia de envío, por lo que la recuperación automática puede duplicar mensajes tras un timeout ambiguo. Definir política con propietario antes de activarla |
| Admin inicial / roles | Callable `provisionAdminUser` requiere un Admin activo existente; el bootstrap no es autogestionado | Acordar bootstrap de propietario por operación CLI segura, comprobar identidad y tienda, crear segundo Admin de recuperación y retirar credenciales temporales |
| Firestore / Storage rules | Reglas locales pasan Emulator; producción activa no verificable (gcloud no instalado). Staging aún no tiene Firestore ni Storage | Después de habilitar Firestore API y resolver billing/Storage, desplegar reglas en staging primero y probar roles |
| Índices Firestore | Consulta remota del 2026-10-21: cero índices compuestos; cuatro índices necesarios versionados en `firestore.indexes.json`, aún no desplegados | Validar en staging y desplegar índices antes de Functions/frontend |
| Variables Vercel | Las nueve Firebase vars se guardaron en `briz-web` / Production y se verificaron tras recargar; ninguna se asignó a Preview. Todavía falta un deployment Production autorizado para validar el build/valores efectivos. | Mantener Preview sin Firebase hasta staging aislado; después configurar solo con los valores de ese staging |
| Datos y archivos históricos | Solo reconciliación sintética/read-only preparada | Autorizar alcance; export protegido/desidentificado de Auth, Firestore y Storage; dry-run, mapeo aprobado, baseline de stock, checkpoints y criterios de parada. No migrar si hay combos ambiguos, stock sin baseline o grupos con estado discordante |
| Ciclo Admin visual | Parcial; alta manual fue abierta antes; ciclo restante no validado visualmente | Completar [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md) en Emulator, desktop y 360–430 px |
| Tests, lint y build | Cierre 2026-10-21: `test:firebase` (Rules + Functions/Auth/Firestore/Storage) pasó con timeout Emulator aumentado a 60s; `test:reports`, `test:reconcile` (8 fixtures/22 findings), motor (16/16), `tsc --noEmit`, web y Functions build pasaron. Lint dirigido a tres Admin pages: 31 `no-explicit-any` previos; helper/Functions/tests limpios. | Mantener y corregir deuda lint en fase dedicada. Build avisa `/noise.png` y bundle ~1.97MB. Emulator ejecutó Node24, Functions pide Node22; validar Node22 en CI/staging |
| Caja (decisión Owner) | Corregido y confirmado por Emulator/reportes: bruto100, reembolso25, efectivo75, corrección5, reconocido70, pendiente0, estado paid; abono extra rechazado | Recorrido visual Owner en entorno aislado antes de merge |
| PR #1 / main | OPEN Draft y sin merge. Rama de estabilización sincronizada en `2c288adccb2e49c43ea568e801168760f5c27030` antes de esta nota. Cuatro Preview recientes fallan por el guard de staging; `main` no se cambió | Crear staging, desplegar y validar backend ahí, activar Preview, validar Production variables con deployment coordinado, backup restaurable y rollback antes de aprobación |

## Sesión local preparada para completar la revisión visual

El 2026-10-21 iniciaron Authentication, Firestore, Functions y Storage Emulator con `demo-briz-security`; `npm run seed:admin-visual` creó la cuenta/catálogo ficticios y `npm run dev -- --host 127.0.0.1` informó `http://127.0.0.1:5173/` con `VITE_USE_FIREBASE_EMULATOR=true`. La política del navegador impidió abrir localhost para completar interacciones. Los procesos quedaron disponibles para que el propietario recorra el checklist; la cuenta está listada en ese documento. Ninguna interacción visual posterior se afirma como probada.

## Orden propuesto para un futuro release (sin ejecutar ahora)

1. Acordar costos/Blaze, APIs, dominios, roles iniciales y política de App Check/outbox.
2. Crear staging aislado, respaldar y verificar restauración; aplicar reconciliación y dry-run aprobados sobre copia protegida.
3. Revisar hallazgos, aprobar mapeos y completar validaciones históricas; detenerse ante cualquier umbral de riesgo acordado.
4. Publicar índices/reglas compatibles, luego Functions y secretos rotados en staging; ejecutar smoke y permisos por rol.
5. Activar App Check gradualmente y verificar callables; configurar variables de frontend y dominios Auth.
6. Validar flujos, reportes, Storage privado, monitoreo, alertas y rollback en staging; aprobar por escrito el paso siguiente.
7. Solo con autorización expresa, coordinar backup, ventana, despliegue y validación post-release. No fusionar ni desplegar producción como parte de este bloque.
