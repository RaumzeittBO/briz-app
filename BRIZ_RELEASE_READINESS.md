# BRIZ — preparación de salida a producción

## Actualización de preparación Firebase — 2026-10-21

### Configuración Vercel que requiere aprobación del propietario

Proyecto verificado en la sesión integrada: `briz-web` / `gfabrigtrf-7085s-projects`. No se editaron valores. Alcance propuesto para añadir (nombres únicamente; no se muestran valores):

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

Preview no debe recibir ninguna variable Firebase hasta disponer de un proyecto staging, bucket, Auth, Functions y datos separados. El build de Vercel rechaza Production como destino Preview, y el cliente rechaza cualquier proyecto `briz-4ef3a` fuera de Production. La ausencia de variables produce error explícito.

### Puertas aún cerradas

- Vercel todavía no tiene `VITE_FIREBASE_*`; la sesión no ha escrito nada. La configuración propuesta espera aprobación del propietario.
- Firebase `briz-4ef3a`: último chequeo CLI read-only mostró cero Functions y cero índices compuestos. Rules/Storage publicadas no quedaron verificables. El repositorio declara cuatro compuestos locales; nada se desplegó.
- No activar el trigger Telegram hasta rotar token viejo en BotFather y cargar el nuevo como Secret Manager de Functions. Nunca poner token en `VITE_*`, repo o chat. No eliminar valores existentes en Vercel hasta que se verifique el endpoint nuevo y la rotación.
- PR #1 Draft; `main` no modificado. El merge no está listo: falta staging, rollout backend compatible, validación visual/funcional, comprender el auto-deploy Production, snapshot restaurable y rollback.
- El código de Functions compila y Emulator verifica reserva sin Telegram: outbox refleja `skipped_unconfigured`; `failed`/`delivery_unknown` no se reenvían automáticamente para evitar duplicados.

`VERCEL_ENV` está documentado por Vercel como variable disponible en build/runtime; además se observó el checkbox de System Environment Variables habilitado en el proyecto. Referencia: [Vercel System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables).

No deployar ni mergear hasta que el propietario confirme las variables y las puertas anteriores estén cerradas.

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
| Funciones v2 / Node 22 | Código compila localmente; Emulator probó flujos; consulta `briz-4ef3a` devolvió cero Functions desplegadas | Confirmar cuota/plan, runtime regional, APIs y presupuesto/alertas; desplegar solo con autorización. Máquina/Emulator usan Node24 aunque el proyecto solicita Node22 |
| Firebase Blaze y costos | No activado | Propietario autoriza plan, presupuesto/alertas y costo esperado tras revisar carga/egress/Functions/Storage |
| App Check | Bloqueante: helper callable mantiene `enforceAppCheck: false` por defecto | Registrar app web y proveedor reCAPTCHA Enterprise, integrar token/debug solo en staging, métricas y endurecimiento gradual de cada callable; acordar enforcement |
| Dominios Auth | No verificados en proyecto | Aprobar y añadir solo dominios públicos/preview necesarios; probar correo, recuperación y redirecciones |
| Secret Manager / Telegram | Los secretos solo están declarados; no hay credenciales productivas | Rotar primero token expuesto en BotFather; propietario entrega/configura token y chat autorizados mediante Secret Manager, nunca `VITE_*` |
| Recuperación de outbox | Bloqueante operativo identificado | Si el trigger cae después de marcar `sending`, el reintento ve `sending` y no reclama el registro. `skipped_unconfigured` tampoco se reintenta solo cuando después se cargan secretos. Diseñar lease/recovery y monitoreo; Telegram no ofrece idempotencia de envío, por lo que la recuperación automática puede duplicar mensajes tras un timeout ambiguo. Definir política con propietario antes de activarla |
| Admin inicial / roles | Callable `provisionAdminUser` requiere un Admin activo existente; el bootstrap no es autogestionado | Acordar bootstrap de propietario por operación CLI segura, comprobar identidad y tienda, crear segundo Admin de recuperación y retirar credenciales temporales |
| Firestore / Storage rules | Reglas locales pasan Emulator; publicación activa no verificable (gcloud no instalado) | Confirmar reglas publicadas; conciliar scopes legacy y desplegar reglas compatibles solo con autorización |
| Índices Firestore | Consulta remota previa: cero índices compuestos; cuatro índices necesarios ya versionados en `firestore.indexes.json`, aún no desplegados | Validar en staging y desplegar índices antes de Functions/frontend |
| Variables Vercel | Sesión integrada verificó `briz-web`; no hay Firebase vars. Tabla Production-only pendiente de aprobación. | Configurar `main`/Production después de confirmar; Preview queda sin Firebase hasta proyecto staging aislado |
| Datos y archivos históricos | Solo reconciliación sintética/read-only preparada | Autorizar alcance; export protegido/desidentificado de Auth, Firestore y Storage; dry-run, mapeo aprobado, baseline de stock, checkpoints y criterios de parada. No migrar si hay combos ambiguos, stock sin baseline o grupos con estado discordante |
| Ciclo Admin visual | Parcial; alta manual fue abierta antes; ciclo restante no validado visualmente | Completar [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md) en Emulator, desktop y 360–430 px |
| Tests, lint y build | Cierre 2026-10-21: `test:firebase` (Rules + Functions/Auth/Firestore/Storage) pasó con timeout Emulator aumentado a 60s; `test:reports`, `test:reconcile` (8 fixtures/22 findings), motor (16/16), `tsc --noEmit`, web y Functions build pasaron. Lint dirigido a tres Admin pages: 31 `no-explicit-any` previos; helper/Functions/tests limpios. | Mantener y corregir deuda lint en fase dedicada. Build avisa `/noise.png` y bundle ~1.97MB. Emulator ejecutó Node24, Functions pide Node22; validar Node22 en CI/staging |
| Caja (decisión Owner) | Corregido y confirmado por Emulator/reportes: bruto100, reembolso25, efectivo75, corrección5, reconocido70, pendiente0, estado paid; abono extra rechazado | Recorrido visual Owner en entorno aislado antes de merge |
| PR #1 / main | OPEN Draft y sin merge. Código probado publicado como `d2e07529673a19b45ae278bb6581aecb055fb3b1`; remoto coincide. Consulta post-push: sin checks nuevos aún. Consulta Firebase indica cero Functions; Vercel production branch no comprobada | Esperar y revisar checks del último HEAD; resolver Preview aislado, Functions/Rules/índices/plan, backup restaurable y rollback antes de aprobación |

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
