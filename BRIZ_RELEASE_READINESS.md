# BRIZ — preparación de salida a producción

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
| Tests, lint y build | `test:firebase` (rules + integración), `test:reconcile`, motor 16/16, TypeScript y builds web/Functions pasan. ESLint global falla: 207 errores/10 warnings; targeted de `StoreContext`, `AdminSalesPage` y core reporta 31 errores preexistentes. | Corregir errores genuinos del código activo y mantener deuda obsoleta separada. Emulator informa Node 24 local versus Functions Node 22; validar el runtime exacto en CI/staging | 

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

