# BRIZ — preparación de salida a producción

## Addendum — Caja y gates de PR #1 (2026-10-21)

- Vercel Preview informa deployment completado; esto solo valida que el artefacto de preview se construyó/publicó, no valida el flujo funcional ni su backend Firebase. El equipo propietario del proyecto `briz-web` (`gfabrigtrf-7085s-projects`) devuelve 403 a la conexión disponible; el destino Firebase de Preview no se puede confirmar. Bloqueado hasta que el propietario otorgue lectura o confirme de forma verificable `projectId`/bucket/emuladores/entorno aislado (sin revelar secretos). No ejecutar escrituras de sondeo.
- Caja: bruto cobrado, reembolsos de caja, efectivo neto (bruto menos reembolsos), correcciones contables no monetarias, ingreso reconocido (efectivo neto menos correcciones) y saldo contractual pendiente son indicadores separados. Ventanas de contrato y cobro usan sus fechas respectivas; sede se aplica a los dos. No hay decisión comercial inferida para uso productivo; propietario debe aprobar semántica.
- Legacy: solo filas `paid` sin ledger se reconocen/se convierten en recibo sintético único. `amountPaid/paidAt` con estado ya `unpaid` o `pending_review` es ambiguo y no se infiere; conciliar con evidencia y autorización antes de reconocerlo o migrarlo.
- Condición de merge: PR #1 no sale de Draft hasta aprobación manual de Owner en Emulator y aprobación explícita de cifras de Caja; Preview aislado verificado; saber qué workflow/publicación dispara `main`; validar Rules/Functions/esquema con versiones compatibles; restauración de backup y rollback ensayados; sin errores críticos. No merge/deploy incluido en esta preparación.

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
| Funciones v2 / Node 22 | Código compila localmente; Emulator probó flujos | Confirmar cuota/plan, runtime regional, APIs y presupuesto/alertas; la máquina actual usa Node 24 y Firebase Emulator avisó discrepancia frente a Node 22 |
| Firebase Blaze y costos | No activado | Propietario autoriza plan, presupuesto/alertas y costo esperado tras revisar carga/egress/Functions/Storage |
| App Check | Bloqueante: helper callable mantiene `enforceAppCheck: false` por defecto | Registrar app web y proveedor reCAPTCHA Enterprise, integrar token/debug solo en staging, métricas y endurecimiento gradual de cada callable; acordar enforcement |
| Dominios Auth | No verificados en proyecto | Aprobar y añadir solo dominios públicos/preview necesarios; probar correo, recuperación y redirecciones |
| Secret Manager / Telegram | Los secretos solo están declarados; no hay credenciales productivas | Rotar primero token expuesto en BotFather; propietario entrega/configura token y chat autorizados mediante Secret Manager, nunca `VITE_*` |
| Recuperación de outbox | Bloqueante operativo identificado | Si el trigger cae después de marcar `sending`, el reintento ve `sending` y no reclama el registro. `skipped_unconfigured` tampoco se reintenta solo cuando después se cargan secretos. Diseñar lease/recovery y monitoreo; Telegram no ofrece idempotencia de envío, por lo que la recuperación automática puede duplicar mensajes tras un timeout ambiguo. Definir política con propietario antes de activarla |
| Admin inicial / roles | Callable `provisionAdminUser` requiere un Admin activo existente; el bootstrap no es autogestionado | Acordar bootstrap de propietario por operación CLI segura, comprobar identidad y tienda, crear segundo Admin de recuperación y retirar credenciales temporales |
| Firestore / Storage rules | Revisadas y Emulator tests pasan; no desplegadas | Conciliar documentos históricos sin `store`; comprobar scopes e índices necesarios con staging; desplegar reglas compatibles en orden controlado |
| Índices Firestore | No se encontró `firestore.indexes.json` configurado en `firebase.json` | Capturar índices requeridos por consultas de staging, incorporarlos/versionarlos y verificar despliegue de índices antes de frontend |
| Variables Vercel | No verificadas ni cambiadas | Definir `VITE_USE_FIREBASE_EMULATOR=false` en producción, IDs de proyecto/bucket correctos y eliminar secretos del bundle; verificar preview con dataset sintético |
| Datos y archivos históricos | Solo reconciliación sintética/read-only preparada | Autorizar alcance; export protegido/desidentificado de Auth, Firestore y Storage; dry-run, mapeo aprobado, baseline de stock, checkpoints y criterios de parada. No migrar si hay combos ambiguos, stock sin baseline o grupos con estado discordante |
| Ciclo Admin visual | Parcial; alta manual fue abierta antes; ciclo restante no validado visualmente | Completar [`BRIZ_ADMIN_MANUAL_VALIDATION.md`](./BRIZ_ADMIN_MANUAL_VALIDATION.md) en Emulator, desktop y 360–430 px |
| Tests, lint y build | Cierre 2026-10-21: `test:firebase` (Rules + Functions/Auth/Firestore/Storage) pasó con timeout Emulator aumentado a 60s; `test:reports`, `test:reconcile` (8 fixtures/22 findings), motor (16/16), `tsc --noEmit`, web y Functions build pasaron. Lint dirigido a tres Admin pages: 31 `no-explicit-any` previos; helper/Functions/tests limpios. | Mantener y corregir deuda lint en fase dedicada. Build avisa `/noise.png` y bundle ~1.97MB. Emulator ejecutó Node24, Functions pide Node22; validar Node22 en CI/staging |
| Caja (addendum) | Exact totals en fixture: bruto100, reembolso25, efectivo neto75, corrección5, ingreso reconocido70, saldo contractual5. Preview deployment success pero no está confirmada la configuración Firebase. | Owner aprueba semántica; verificar Firebase Preview en staging aislado y que Dashboard/Reports/Caja/CSV coincidan |
| PR #1 / main | OPEN Draft; Vercel checks SUCCESS; base `0140452`, GitHub head previo al push de este cierre `db88147`; commit local de código `87d2fbd`. GitHub mergeable sin conflictos. No se conoce configuración de production-branch Vercel por acceso 403. | Mantener Draft. Determinar el efecto de publicar `main`, orden de Rules/Functions/schema, backup restaurable y rollback antes de aprobación final |

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
