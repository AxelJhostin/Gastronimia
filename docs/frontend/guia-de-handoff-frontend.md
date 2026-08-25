# Guía de handoff para Frontend

Esta guía permite continuar el frontend sin reconstruir el contexto del backend ni leer las migraciones SQL. Es el documento de trabajo principal para la persona responsable de interfaz.

> Estado al 25 de agosto de 2026: backend, Supabase, migraciones, contratos, pruebas y CI están implementados y verificados. El acceso base del frontend ya está integrado en `main`; el trabajo pendiente principal es convertir el contrato disponible en una experiencia completa, responsive y accesible.

## 1. Mapa rápido del proyecto

```text
frontend/                         ← aquí se implementan todas las pantallas
  src/app/                        ← rutas de Next.js App Router
  src/components/                 ← componentes reutilizables
  src/lib/api/                    ← cliente de FastAPI (ampliar)
  src/lib/supabase/               ← Auth, cookies y sesión

backend/                          ← no modificar para tareas visuales
  app/api/v1/endpoints/           ← rutas FastAPI disponibles
  app/core/                       ← reglas de negocio y modelos

supabase/migrations/              ← esquema/RLS: no consumir desde UI
docs/frontend/                    ← contratos y esta guía
docs/requirements/                ← reglas de negocio y flujos funcionales
docs/postman/                     ← pruebas manuales de API
```

La aplicación sigue esta arquitectura:

```text
Usuario → Next.js (frontend) → FastAPI → Supabase PostgreSQL/RPC
                         └──→ Supabase Auth y Storage privado
```

El navegador usa Supabase **solo** para iniciar/cerrar sesión y cargar/descargar evidencias privadas. Todo lo demás —inventario, solicitudes, reservas, entrega, devolución, mantenimiento y reportes— pasa por FastAPI.

## 2. Qué ya está terminado

### Plataforma y frontend base

- Next.js 16, TypeScript estricto, Tailwind, ESLint, Vitest y build de producción configurados.
- Cliente SSR de Supabase, proxy de renovación de sesión, login y logout ya creados.
- Rutas iniciales: `/`, `/login` y `/dashboard`.
- `dashboard` valida que exista una sesión; aún debe transformarse en la navegación real por rol.
- Variables públicas documentadas en `frontend/.env.example`.
- GitHub Actions ejecuta lint, typecheck, tests y build del frontend en cada push a `main`.

### Bloque ya integrado — acceso y sesión

El trabajo inicial de interfaz está integrado desde la rama `codex/auth-supabase-ssr` (commit `edc27b5`, `feat(auth): agregar acceso y rutas protegidas`). No hay cambios adicionales pendientes en esa rama.

- [x] Cliente SSR de Supabase para componentes de servidor y cliente.
- [x] Renovación de cookies de sesión mediante `proxy`.
- [x] Formulario de inicio de sesión con correo y contraseña.
- [x] Cierre de sesión.
- [x] Rutas `/`, `/login` y `/dashboard`.
- [x] Redirección a `/login` cuando no hay una sesión válida en `/dashboard`.
- [~] Prueba manual con cuenta real y expiración de sesión. El código está listo; falta verificarlo contra el proyecto compartido de Supabase.

Esto **no** incluye todavía `GET /auth/me`, el estado global de roles, navegación por rol, cliente de FastAPI ni pantallas funcionales.

### Backend y Supabase disponibles

- Autenticación JWT de Supabase validada por FastAPI.
- Roles implementados: `ADMIN`, `MANAGER` y `TEACHER`. No hay rol ni pantalla para estudiantes en este MVP.
- Gestión académica, inventario por cantidad/unidad individual, disponibilidad, solicitudes, reservas, preparación, QR, préstamos, devoluciones, inspecciones, incidentes, evidencias, mantenimiento, auditoría y reportes.
- RLS, Storage privado `evidence`, migraciones sincronizadas y pruebas de backend completas.
- CI verde: backend y frontend pasan sus validaciones.

## 3. Documentos que debes leer y para qué sirven

| Documento | Cuándo usarlo | Qué resuelve |
| --- | --- | --- |
| [Contrato único de backend](/Users/hernandezaxel/proyectos/Gastronimia/docs/frontend/contrato-backend-supabase.md) | Siempre antes de consumir una ruta. | Roles, endpoints, payloads, estados y reglas de integración. Es la fuente técnica principal. |
| [Esta guía de handoff](/Users/hernandezaxel/proyectos/Gastronimia/docs/frontend/guia-de-handoff-frontend.md) | Al comenzar y al planear un bloque. | Orden de trabajo, archivos, dependencias y qué ya está listo. |
| [Contexto y alcance](/Users/hernandezaxel/proyectos/Gastronimia/docs/requirements/01_contexto_alcance_gastronomia.md) | Al decidir si una pantalla/módulo entra al MVP. | Qué sí y qué no se construye. |
| [Diseño de datos](/Users/hernandezaxel/proyectos/Gastronimia/docs/requirements/02_diseno_base_datos_gastronomia.md) | Si una relación o estado no es claro. | Significado de entidades y reglas de datos. No usarlo para consultar Supabase desde UI. |
| [Flujos y diagramas](/Users/hernandezaxel/proyectos/Gastronimia/docs/requirements/03_flujos_diagramas_gastronomia.md) | Antes de diseñar un proceso operativo. | Secuencia de solicitud, entrega, devolución e incidencias. |
| [Arquitectura](/Users/hernandezaxel/proyectos/Gastronimia/docs/architecture/tecnologias-y-arquitectura.md) | Al modificar infraestructura, sesión o cliente API. | Límites entre navegador, API y Supabase. |
| [Guía de skills frontend](/Users/hernandezaxel/proyectos/Gastronimia/docs/guides/uso-de-skills-para-frontend.md) | Antes de diseñar/probar un módulo visual. | Cómo explorar, implementar y validar UX. |
| [Pruebas y calidad](/Users/hernandezaxel/proyectos/Gastronimia/docs/guides/pruebas-y-calidad.md) | Antes de subir un bloque. | Comandos de validación y nivel de pruebas esperado. |
| [Postman](/Users/hernandezaxel/proyectos/Gastronimia/docs/postman/README.md) | Para comprobar una API sin UI. | Orden de pruebas manuales y variables necesarias. |
| [Plan y alcance](/Users/hernandezaxel/proyectos/Gastronimia/docs/roadmap/plan-de-trabajo-y-alcance.md) | Para marcar avance y evitar ampliar el alcance. | Fases del MVP y pendientes de las dos áreas. |

Con FastAPI levantado, Swagger es el contrato vivo para tipos exactos:

```text
http://localhost:8000/api/v1/docs
```

## 4. Arranque local

En una terminal:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia/frontend
cp .env.example .env.local  # solo la primera vez
npm install
npm run dev
```

En otra terminal, para tener la API disponible:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Variables permitidas en `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Nunca colocar en frontend: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, contraseña PostgreSQL, token de administrador ni contraseña de usuarios.

## 5. Código frontend existente

| Archivo | Estado y responsabilidad |
| --- | --- |
| `src/lib/env.ts` | Valida las tres variables públicas. Reutilizar, no duplicar lectura de `process.env`. |
| `src/lib/supabase/client.ts` | Cliente para componentes cliente: login, logout, Storage. |
| `src/lib/supabase/server.ts` | Cliente server-side con cookies. |
| `src/lib/supabase/proxy.ts` y `src/proxy.ts` | Renovación de sesión/protección base. Revisar antes de modificar autenticación. |
| `src/lib/api/client.ts` | Solo tiene `getApiHealth()`; es el lugar donde se debe crear el cliente API tipado. |
| `src/components/auth/login-form.tsx` | Formulario de login ya conectado a Supabase. |
| `src/components/auth/logout-button.tsx` | Cierre de sesión. |
| `src/app/login/page.tsx` | Pantalla inicial de acceso. |
| `src/app/dashboard/page.tsx` | Placeholder autenticado; reemplazar por layout/navegación según rol. |

## 6. Regla de integración con FastAPI

Todas las rutas FastAPI se construyen así:

```text
${NEXT_PUBLIC_API_BASE_URL}/api/v1/<ruta>
```

Excepto `GET /health`, enviar el token de Supabase:

```ts
Authorization: `Bearer ${session.access_token}`
```

Antes de dibujar una pantalla protegida:

1. Recuperar la sesión con Supabase.
2. Consultar `GET /auth/me` una vez.
3. Guardar `id`, `email` y `roles` en un provider/store de sesión.
4. Decidir navegación y acciones por rol, pero mantener FastAPI como defensa final.

Tratamiento estándar:

| Código | UX esperada |
| --- | --- |
| `401` | Renovar sesión; si no existe, enviar a `/login`. |
| `403` | Vista “No tienes permisos” sin ocultar el contexto de forma confusa. |
| `409` | Mostrar mensaje de regla de negocio: estado inválido, stock/reserva insuficiente o operación duplicada. No reintentar automáticamente. |
| `422` | Señalar campos inválidos en formulario; no mostrar solo un error genérico. |
| `5xx` / red | Estado recuperable, botón Reintentar y no perder el formulario. |

### Cliente API recomendado

Crear una única capa, por ejemplo `src/lib/api/http.ts`, que reciba token y centralice JSON, errores y tipos. Después crear módulos como `api/inventory.ts`, `api/requests.ts` y `api/reports.ts`.

No llamar `fetch()` repetido desde cada componente y no incluir URLs API dispersas por la interfaz.

## 7. Roles, navegación y permisos de UI

| Rol | Puede ver/operar |
| --- | --- |
| `TEACHER` | Inicio docente, disponibilidad, crear borrador, enviar solicitud y ver solo sus solicitudes. |
| `MANAGER` | Inventario, revisión, preparación, inspecciones, entrega, préstamos, devoluciones, mantenimiento, auditoría y reportes. |
| `ADMIN` | Todo lo de `MANAGER` + usuarios, roles y configuración académica. |

Propuesta de navegación inicial:

```text
TEACHER
  Inicio | Nueva solicitud | Mis solicitudes | Disponibilidad

MANAGER
  Inicio operativo | Pendientes | Preparación | Entregas | Devoluciones
  Inventario | Mantenimiento | Reportes

ADMIN
  Todo MANAGER + Academia | Usuarios y roles
```

Una persona puede tener más de un rol. Si ocurre, mostrar la unión de módulos y no asumir un único dashboard rígido.

## 8. Catálogo de endpoints por pantalla

Todos son relativos a `/api/v1`. Para campos exactos, revisar Swagger y el contrato único.

### Sesión y administración

| Pantalla | Rutas | Rol |
| --- | --- | --- |
| Carga de sesión | `GET /auth/me` | Autenticado |
| Usuarios y roles | `GET /admin/users`, `PUT /admin/users/{user_id}/roles` | ADMIN |
| Períodos | `GET/POST /admin/academic/periods` | ADMIN |
| Materias | `GET/POST /admin/academic/subjects` | ADMIN |
| Perfiles docentes | `GET/POST /admin/academic/teachers` | ADMIN |
| Secciones | `GET/POST /admin/academic/course-sections` | ADMIN |
| Laboratorios | `GET/POST /admin/academic/laboratories` | ADMIN |

### Inventario

| Pantalla | Rutas | Rol |
| --- | --- | --- |
| Categorías | `GET/POST/PATCH /admin/inventory/categories` | ADMIN/MANAGER |
| Ubicaciones | `GET/POST/PATCH /admin/inventory/locations` | ADMIN/MANAGER |
| Artículos | `GET/POST/PATCH /admin/inventory/items` | ADMIN/MANAGER |
| Unidades individuales | `GET/POST/PATCH /admin/inventory/units` | ADMIN/MANAGER |
| Hoja de vida unidad | `GET /admin/inventory/units/{id}/history` | ADMIN/MANAGER |
| Stock | `GET /admin/inventory/stock` | ADMIN/MANAGER |
| Kardex/movimientos | `GET/POST /admin/inventory/movements` | ADMIN/MANAGER |
| Disponibilidad | `GET /admin/inventory/availability?inventory_item_id=&start_at=&end_at=` | Todos los roles |

`tracking_mode = QUANTITY` representa stock por ubicación. `tracking_mode = INDIVIDUAL` representa unidades físicas con `asset_tag`, condición y estado.

### Solicitudes, entrega y devolución

| Pantalla / acción | Ruta | Rol |
| --- | --- | --- |
| Crear borrador | `POST /requests/drafts` | TEACHER |
| Mis solicitudes | `GET /requests/mine` | TEACHER |
| Enviar borrador | `POST /requests/{id}/submit` | TEACHER |
| Bandeja | `GET /admin/requests/pending` | ADMIN/MANAGER |
| Aprobar/rechazar | `POST /admin/requests/{id}/approve`, `/reject` | ADMIN/MANAGER |
| Preparación | `POST /admin/requests/{id}/preparation/start`, `/items`, `/complete` | ADMIN/MANAGER |
| Inspección salida | `POST /admin/inspections/requests/{id}/outbound` | ADMIN/MANAGER |
| QR de entrega | `POST /admin/deliveries/requests/{id}/qr` | ADMIN/MANAGER |
| Confirmar entrega | `POST /admin/deliveries/deliver` | ADMIN/MANAGER |
| Préstamos abiertos | `GET /admin/returns/loans` | ADMIN/MANAGER |
| Pendientes de un préstamo | `GET /admin/returns/loans/{id}/pending` | ADMIN/MANAGER |
| Registrar devolución | `POST /admin/returns/loans/{id}` | ADMIN/MANAGER |
| Inspección retorno | `POST /admin/inspections/returns/{return_id}` | ADMIN/MANAGER |

### Mantenimiento, evidencia y reportes

| Pantalla / acción | Ruta | Rol |
| --- | --- | --- |
| Iniciar/cerrar mantenimiento | `POST /admin/maintenance`, `/{id}/complete`, `/{id}/cancel` | ADMIN/MANAGER |
| Evidencia mantenimiento | `POST /admin/maintenance/{id}/evidences` | ADMIN/MANAGER |
| Evidencia incidente | `POST /admin/inspections/incidents/{id}/evidences` | ADMIN/MANAGER |
| Reportes | `GET /admin/reports/requests`, `/loans`, `/incidents`, `/stock`, `/kardex` | ADMIN/MANAGER |

## 9. Estados y reglas que la UI debe respetar

### Solicitudes

```text
DRAFT → PENDING → APPROVED/PARTIALLY_APPROVED → PREPARING → PREPARED
      → REJECTED
PREPARED → DELIVERED → CLOSED
```

- Un docente crea y envía; no aprueba su propia solicitud.
- El personal aprueba cantidades; el backend crea la reserva de forma atómica.
- No ofrecer entrega hasta que la solicitud esté `PREPARED` e inspeccionada.
- El QR expira y se usa una sola vez; mostrar tiempo restante y generar otro solo si el backend lo permite.

### Inventario, devoluciones y mantenimiento

- `AVAILABLE`: puede seleccionarse.
- `LOANED`: no puede seleccionarse para otro préstamo.
- `MAINTENANCE`: no puede prepararse ni prestarse.
- `DISABLED`: fuera de operación.
- Una unidad individual devuelta queda en `MAINTENANCE` hasta inspección. Si hay daño, no debe reaparecer como disponible.
- Nunca permitir en UI `AVAILABLE` con condición `DAMAGED`; el backend también lo rechaza.

### Evidencias privadas

1. Subir JPEG/PNG/WebP (máximo 10 MB) a bucket privado `evidence`.
2. Usar ruta `{auth.user.id}/{uuid}.ext`.
3. Enviar la ruta resultante como `storage_path` al endpoint de incidente o mantenimiento.
4. Para mostrarla, usar descarga autenticada; no URL pública.

## 10. Dependencias conocidas del frontend

Estas no son fallas de pantalla. Deben comunicarse a backend antes de intentar inventar una solución directa en Supabase:

1. **Detalle operativo de solicitud:** aún falta un endpoint que devuelva ítems de solicitud, detalles de reserva y preparación con sus UUID internos. Se necesitan `equipment_request_item_id` para aprobar y `equipment_reservation_detail_id` para preparar/entregar. En Postman hoy se copian desde Supabase únicamente para prueba manual.
2. **Detalle de préstamo:** `GET /admin/returns/loans/{id}/pending` cubre cantidades/unidades pendientes, pero el diseño de pantalla debe confirmar que expone todos los datos necesarios antes de la devolución.
3. **Creación cómoda de perfiles docentes:** la API administrativa requiere `user_id` de Supabase Auth. La pantalla puede listar usuarios y seleccionar uno, pero no debe pedir que alguien copie UUID. Si la respuesta de usuarios no da el dato necesario o falta UX, solicitar el ajuste a backend.
4. **No usar tablas Supabase como atajo:** aunque veas entidades en el dashboard, consumirlas directo rompe las reglas transaccionales, permisos y futura evolución del backend.

## 11. Plan de implementación por bloques

Trabajar en este orden. Cada bloque termina con UI, estados de carga/vacío/error/sin permiso, pruebas y validaciones antes de empezar el siguiente.

### Bloque F1 — Fundaciones de interfaz

- [x] Login, logout, sesión SSR y protección base de `/dashboard`.
- [ ] Crear cliente API central con token, errores tipados y JSON.
- [ ] Crear provider/store de sesión: Supabase session + `GET /auth/me`.
- [ ] Reemplazar dashboard placeholder por layout con navegación filtrada por roles.
- [ ] Crear componentes base: `PageHeader`, `EmptyState`, `ErrorState`, `LoadingState`, `PermissionDenied`, badge de estado, modal de confirmación y formulario reutilizable.
- [ ] Proteger rutas y redirigir correctamente por sesión/rol.

**Salida:** login → `/auth/me` → navegación correcta; 401/403/409/422 se ven correctamente.

### Bloque F2 — Configuración ADMIN

- [ ] Pantalla Usuarios y roles.
- [ ] CRUD disponible de períodos, materias, laboratorios, perfiles docentes y secciones.
- [ ] Formularios con UUID seleccionados mediante listas, no textos manuales.
- [ ] Filtros, vacío y validación de fechas en período.

**Salida:** ADMIN configura todos los datos requeridos antes de operación.

### Bloque F3 — Inventario ADMIN/MANAGER

- [ ] Categorías y ubicaciones.
- [ ] Artículos `QUANTITY` e `INDIVIDUAL` con formularios que cambian según `tracking_mode`.
- [ ] Unidades individuales, condición, estado y hoja de vida.
- [ ] Movimientos de cantidad y stock actual.
- [ ] Consulta de disponibilidad por intervalo.

**Salida:** personal puede registrar y localizar recursos sin ver campos que no aplican al tipo de artículo.

### Bloque F4 — Solicitudes TEACHER

- [ ] Dashboard docente y listado de sus solicitudes.
- [ ] Nueva solicitud: sección, laboratorio, fecha/hora, propósito, artículos y cantidades.
- [ ] Consulta de disponibilidad antes de enviar.
- [ ] Borrador, envío y lectura clara de estado/rechazo.

**Salida:** docente crea y entiende una solicitud sin acceder a funciones de personal.

### Bloque F5 — Revisión y preparación ADMIN/MANAGER

- [ ] Bandeja de solicitudes pendientes y acciones aprobar/rechazar.
- [ ] Vista de detalle operativo cuando backend entregue los IDs necesarios.
- [ ] Preparación: iniciar, registrar cantidades/unidades y completar.
- [ ] Confirmaciones para acciones que cambian estado.

**Salida:** personal puede avanzar una solicitud desde pendiente hasta preparada sin perder trazabilidad.

### Bloque F6 — Entrega y préstamos

- [ ] Inspección de salida.
- [ ] Vista/lector de QR temporal (primero mostrar token/QR; integrar cámara solo si aporta valor).
- [ ] Formulario de entrega con quien retira y ubicaciones/cantidades.
- [ ] Lista de préstamos, retrasos y detalle pendiente.

**Salida:** una solicitud preparada se convierte en préstamo trazable.

### Bloque F7 — Devolución, inspección y mantenimiento

- [ ] Devolución parcial/total desde pendientes del préstamo.
- [ ] Inspección de retorno con condición, completitud e incidencias.
- [ ] Carga y visualización autenticada de evidencias.
- [ ] Mantenimiento: iniciar, completar/cancelar y evidencia.

**Salida:** ninguna unidad dañada vuelve visualmente a disponible sin inspección/mantenimiento válido.

### Bloque F8 — Reportes, auditoría y cierre UX

- [ ] Reportes de solicitudes, préstamos, incidentes, stock y kardex.
- [ ] Hoja de vida por unidad y filtros de fechas/estado donde aplique.
- [ ] Estados vacíos, loading, error, éxito y permiso en todos los módulos.
- [ ] Responsive real para escritorio, tablet y teléfono.
- [ ] Accesibilidad: teclado, foco, etiquetas, contraste y mensajes no basados solo en color.
- [ ] Pruebas de componentes y flujos críticos; validaciones finales.

**Salida:** MVP navegable para los tres roles y listo para demostración.

## 12. Reglas de UX y responsive

- Diseñar primero la tarea principal por rol, no un dashboard genérico.
- En escritorio, priorizar tablas, filtros y acciones contextualizadas.
- En tablet/teléfono, priorizar tareas físicas: consulta de disponibilidad, preparación, entrega, devolución, inspección y evidencias.
- Las tablas deben tener alternativa usable en pantallas angostas: filas apiladas, detalles expandibles o filtros previos.
- Los estados críticos deben usar texto + icono + color. Nunca solo color.
- Deshabilitar una acción cuando el estado lo impida y explicar por qué.
- No mostrar secretos, UUID internos como dato de negocio ni errores técnicos crudos.

Antes de empezar cada módulo, seguir [la guía de skills](/Users/hernandezaxel/proyectos/Gastronimia/docs/guides/uso-de-skills-para-frontend.md): revisar requisito → explorar flujo → implementar → probar en navegador → verificar responsive/accesibilidad.

## 13. Pruebas que debe ejecutar frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Para probar la API sin interfaz, seguir [Postman](/Users/hernandezaxel/proyectos/Gastronimia/docs/postman/README.md) y ejecutar solicitudes manualmente por carpeta; no ejecutar toda la colección de una vez porque crea datos y existen rutas alternativas.

Al cerrar cada bloque, comprobar:

- [ ] Rol correcto ve la pantalla; otros roles reciben experiencia de sin permiso.
- [ ] Carga, vacío, error, éxito y datos reales están cubiertos.
- [ ] Formularios no pierden contexto ante un `409` o error de red.
- [ ] Escritorio, tablet y móvil fueron revisados.
- [ ] Teclado, foco, etiquetas y contraste fueron revisados.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` pasan.
- [ ] Si se detectó un faltante de contrato, se registró como tarea de backend en vez de leer/escribir la base directamente.

## 14. Lista final de responsabilidades

### Ya realizado por backend/Supabase

- [x] Esquema, migraciones, RLS y Storage privado.
- [x] Auth JWT, roles y autorización de API.
- [x] API de academia, inventario, solicitudes, operación, mantenimiento y reportes.
- [x] Operaciones críticas transaccionales: reserva, preparación, entrega, devolución e inspección.
- [x] Auditoría, kardex, historial de unidades y vistas de reporte.
- [x] Pruebas backend, lint, tipos, CI, Postman y documentación de contrato.
- [x] Frontend base: sesión Supabase, login, logout, rutas iniciales, toolchain y CI.

### Pendiente de frontend

- [ ] Cliente FastAPI y estado global de sesión/roles.
- [ ] Layout, navegación y protección visual por rol.
- [ ] Pantallas y formularios de los bloques F2 a F8.
- [ ] Integración de evidencias privadas.
- [ ] Responsive, accesibilidad, estados y pruebas de interfaz.
- [ ] Revisión de flujos reales con cuentas ADMIN, MANAGER y TEACHER.

### Pendiente de coordinación con backend

- [ ] Definir/exponer endpoint(s) de detalle operativo para solicitudes/reservas/preparación.
- [ ] Confirmar los campos necesarios para detalle de préstamo/devolución en UI.
- [ ] Resolver cualquier campo o listado que impida seleccionar relaciones sin UUID manual.

## 15. Primer día recomendado

1. Clonar/actualizar `main`, crear `.env.local` y levantar frontend + backend.
2. Leer esta guía y el contrato único, sin leer migraciones aún.
3. Probar login y `GET /auth/me` con una cuenta real.
4. Implementar Bloque F1 completo y subirlo con validaciones.
5. Continuar F2 → F8 en orden; abrir una tarea de coordinación si un endpoint no entrega la información necesaria.

Con ese orden se evita diseñar pantallas que dependan de estados o UUID inaccesibles y se mantiene el MVP dentro del alcance acordado.
