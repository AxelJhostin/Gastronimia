# Contrato único para Frontend

Este documento es el punto de entrada para implementar la interfaz. Describe el backend disponible en `main`, Supabase y el orden de los flujos. No hace falta leer migraciones para consumir la aplicación.

## Conexiones y seguridad

| Servicio | Uso desde frontend | Variable pública |
| --- | --- | --- |
| FastAPI | Todo el dominio: inventario, solicitudes, entregas, devoluciones y mantenimiento. | `NEXT_PUBLIC_API_BASE_URL` |
| Supabase Auth | Inicio/cierre de sesión y recuperación de sesión. | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Supabase Storage | Carga de fotografías de evidencias al bucket privado `evidence`. | Las mismas variables públicas de Supabase |

Nunca usar `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, claves secretas ni la contraseña PostgreSQL en el navegador. La API recibe `Authorization: Bearer <access_token>` de Supabase en todas las rutas salvo `GET /api/v1/health`.

La API está en `http://localhost:8000/api/v1` durante desarrollo. El contrato vivo, con esquemas exactos, está en `http://localhost:8000/api/v1/docs` cuando FastAPI está levantado.

## Sesión y roles

Después de `supabase.auth.signInWithPassword`, conservar `session.access_token` y enviarlo a FastAPI. Al iniciar la aplicación consultar `GET /auth/me`.

| Rol | Pantallas principales |
| --- | --- |
| `TEACHER` | Crear/enviar solicitudes, ver las propias y consultar disponibilidad. |
| `MANAGER` | Inventario, revisión, preparación, entrega, devolución, inspección, mantenimiento y auditoría operativa. |
| `ADMIN` | Todo lo de encargado más usuarios, roles y configuración académica. |

Si FastAPI responde `401`, renovar sesión o enviar a login. Si responde `403`, mostrar pantalla sin permisos. `409` representa una regla de negocio o conflicto (por ejemplo, stock insuficiente, estado inválido o doble operación). `422` indica payload inválido.

## Estados que debe representar la UI

| Entidad | Valores |
| --- | --- |
| Solicitud | `DRAFT`, `PENDING`, `APPROVED`, `PARTIALLY_APPROVED`, `REJECTED`, `PREPARING`, `PREPARED`, `DELIVERED`, `CLOSED` |
| Préstamo | `ACTIVE`, `PARTIALLY_RETURNED`, `CLOSED` |
| Unidad | `AVAILABLE`, `LOANED`, `MAINTENANCE`, `DISABLED` |
| Condición | `NEW`, `GOOD`, `FAIR`, `DAMAGED` |
| Mantenimiento | `OPEN`, `COMPLETED`, `CANCELLED` |

`MAINTENANCE` no es seleccionable para preparar ni prestar. Una unidad devuelta permanece en ese estado hasta que se complete su inspección; la inspección la habilita o la mantiene fuera de servicio según condición y novedades.

## Rutas FastAPI

Todos los paths siguientes son relativos a `/api/v1`. Las rutas `ADMIN/MANAGER` se identifican como **Personal**.

### Sesión, administración y academia

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `GET /health` | Público | Health check. |
| `GET /auth/me` | Cualquiera autenticado | Usuario actual y roles. |
| `GET /admin/users` | ADMIN | Usuarios gestionables. |
| `PUT /admin/users/{user_id}/roles` | ADMIN | Body: `{ "roles": ["ADMIN"] }`; responde 204. |
| `GET/POST /admin/academic/periods` | ADMIN | Listar/crear períodos. |
| `GET/POST /admin/academic/subjects` | ADMIN | Listar/crear asignaturas. |
| `GET/POST /admin/academic/teachers` | ADMIN | Listar/crear perfiles docentes. |
| `GET/POST /admin/academic/course-sections` | ADMIN | Listar/crear paralelos. |
| `GET/POST /admin/academic/laboratories` | ADMIN | Listar/crear laboratorios. |

### Inventario

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `GET/POST /admin/inventory/categories` | Personal | Categorías. |
| `PATCH /admin/inventory/categories/{id}` | Personal | Actualizar categoría. |
| `GET/POST /admin/inventory/locations` | Personal | Ubicaciones. |
| `PATCH /admin/inventory/locations/{id}` | Personal | Actualizar ubicación. |
| `GET/POST /admin/inventory/items` | Personal | Artículos; `tracking_mode` es `QUANTITY` o `INDIVIDUAL`. |
| `PATCH /admin/inventory/items/{id}` | Personal | Actualizar artículo. |
| `GET/POST /admin/inventory/units` | Personal | Unidades físicas; solo para artículos `INDIVIDUAL`. |
| `PATCH /admin/inventory/units/{id}` | Personal | Estado, condición, ubicación y datos de la unidad. |
| `GET /admin/inventory/units/{id}/history` | Personal | Hoja de vida automática. |
| `GET /admin/inventory/stock` | Personal | Stock actual por artículo y ubicación. |
| `GET /admin/inventory/movements` | Personal | Kardex de artículos por cantidad. |
| `GET /admin/inventory/availability?inventory_item_id=&start_at=&end_at=` | Todos | Disponibilidad reservable; fechas ISO 8601. |
| `POST /admin/inventory/movements` | Personal | Ajuste o ingreso manual `QUANTITY`. |

### Solicitudes y operación

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `POST /requests/drafts` | TEACHER | Crear solicitud con artículos. |
| `GET /requests/mine` | TEACHER | Solicitudes propias. |
| `POST /requests/{id}/submit` | TEACHER | Cambia `DRAFT` a `PENDING`. |
| `GET /admin/requests/pending` | Personal | Bandeja de revisión. |
| `POST /admin/requests/{id}/approve` | Personal | Aprueba cantidades y crea reserva atómica. |
| `POST /admin/requests/{id}/reject` | Personal | Rechaza con motivo. |
| `POST /admin/requests/{id}/preparation/start` | Personal | Inicia preparación. |
| `POST /admin/requests/{id}/preparation/items` | Personal | Registra cantidades/unidades preparadas. |
| `POST /admin/requests/{id}/preparation/complete` | Personal | Finaliza solo cuando todo cuadra. |
| `POST /admin/inspections/requests/{id}/outbound` | Personal | Inspección obligatoria antes de entregar. |
| `POST /admin/deliveries/requests/{id}/qr` | Personal | Genera QR temporal de entrega. |
| `POST /admin/deliveries/deliver` | Personal | Canjea QR, crea préstamo y descuenta inventario. |
| `GET /admin/returns/loans` | Personal | Préstamos abiertos, con `is_overdue`. |
| `GET /admin/returns/loans/{id}/pending` | Personal | Cantidades y unidades aún pendientes. |
| `POST /admin/returns/loans/{id}` | Personal | Devolución parcial o total. |
| `POST /admin/inspections/returns/{return_id}` | Personal | Inspección y novedades de devolución. |

### Mantenimiento y evidencias

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `POST /admin/maintenance` | Personal | Inicia mantenimiento y cambia unidad a `MAINTENANCE`. |
| `POST /admin/maintenance/{id}/complete` | Personal | Completa con estado y condición final segura. |
| `POST /admin/maintenance/{id}/cancel` | Personal | Cancela con estado final seguro. |
| `POST /admin/maintenance/{id}/evidences` | Personal | Asocia foto ya cargada. |
| `POST /admin/inspections/incidents/{id}/evidences` | Personal | Asocia foto a una novedad. |
| `GET /admin/reports/requests` | Personal | Resumen operativo de solicitudes. |
| `GET /admin/reports/loans` | Personal | Resumen y conteos de préstamos/devoluciones. |
| `GET /admin/reports/incidents` | Personal | Novedades y conteo de evidencias. |
| `GET /admin/reports/stock` | Personal | Stock por artículo y ubicación. |
| `GET /admin/reports/kardex?inventory_item_id=` | Personal | Kardex; filtro opcional por artículo. |

## Payloads esenciales

Los UUID se envían como texto; las fechas como ISO 8601 con zona horaria y los decimales como string para evitar redondeos en el navegador.

```json
// POST /requests/drafts
{
  "course_section_id": "uuid",
  "laboratory_id": "uuid",
  "start_at": "2026-08-25T08:00:00-05:00",
  "end_at": "2026-08-25T10:00:00-05:00",
  "purpose": "Práctica de panadería",
  "items": [{ "inventory_item_id": "uuid", "requested_quantity": "4.000" }]
}

// POST /admin/requests/{id}/approve
{ "items": [{ "equipment_request_item_id": "uuid", "approved_quantity": "3.000" }] }

// POST /admin/requests/{id}/preparation/items
{
  "items": [{
    "equipment_reservation_detail_id": "uuid",
    "prepared_quantity": "2.000",
    "inventory_unit_ids": ["uuid"]
  }]
}

// POST /admin/deliveries/deliver
{
  "qr_token": "token-opaco",
  "collected_by_name": "Nombre de quien retira",
  "quantity_locations": [{
    "equipment_reservation_detail_id": "uuid",
    "location_id": "uuid",
    "loaned_quantity": "2.000"
  }]
}

// POST /admin/returns/loans/{loan_id}
{
  "returned_by_name": "Nombre de quien devuelve",
  "quantity_details": [{
    "equipment_loan_detail_id": "uuid",
    "location_id": "uuid",
    "returned_quantity": "1.000"
  }],
  "loan_unit_ids": ["uuid"]
}
```

`inventory_unit_ids` solo se manda para artículos `INDIVIDUAL`; para `QUANTITY` se omite. En devolución, `loan_unit_ids` contiene IDs de **detalle de préstamo**, obtenidos en `GET /admin/returns/loans/{id}/pending`, no IDs de inventario.

```json
// POST /admin/inspections/returns/{return_id}
{
  "notes": "Revisión de devolución",
  "items": [{
    "inventory_unit_id": "uuid",
    "observed_condition": "GOOD",
    "is_complete": true,
    "incidents": [{
      "incident_type": "DAMAGE",
      "severity": "HIGH",
      "description": "Golpe en la carcasa"
    }]
  }]
}

// POST /admin/maintenance
{
  "inventory_unit_id": "uuid",
  "maintenance_type": "CORRECTIVE",
  "reason": "Falla detectada en inspección",
  "description": "No enciende"
}
```

Para completar mantenimiento se envía `resolution`, `final_status` (`AVAILABLE`, `MAINTENANCE` o `DISABLED`) y `final_condition`. No se permite `AVAILABLE` con condición `DAMAGED`.

## Flujo de pantallas recomendado

1. Login Supabase → `/auth/me` → redirigir por rol.
2. Docente: consultar disponibilidad → crear borrador → enviar → revisar `mine`.
3. Personal: pendientes → aprobar/rechazar → preparar → inspeccionar salida → QR → entregar.
4. Personal: préstamos → pendientes → devolución → inspección de retorno → mantenimiento si aplica.
5. Administración: catálogo académico, inventario, usuarios y consultas de kardex/hoja de vida.

No intentar saltar estados desde la UI: las RPC de Supabase validan transiciones y son la fuente de verdad.

## Supabase: datos y Storage

El frontend usa Supabase directamente solo para Auth y carga de evidencia. Toda tabla funcional se consulta/escribe mediante FastAPI; esto centraliza reglas, transacciones y mensajes de error.

El bucket `evidence` es privado, admite JPEG, PNG y WebP hasta 10 MB. Antes de asociar una foto, cargarla a una ruta con esta forma:

```text
{auth.user.id}/{uuid}.jpg
```

Luego enviar `storage_path` en la ruta de evidencias correspondiente. El bucket valida por RLS que la carpeta inicial corresponda al usuario autenticado. Para visualizar, usar descarga autenticada de Supabase; nunca construir una URL pública.

Las entidades de base de datos ya disponibles son: academia (`academic_periods`, `subjects`, `course_sections`, `laboratories`, `teachers`), inventario, solicitudes/reservas/preparación, préstamos/devoluciones, inspecciones/incidentes, mantenimiento, kardex e `operational_audit_log`. Para reportes de solo lectura existen `inventory_kardex`, `inventory_unit_lifecycle`, `request_operational_summary`, `loan_operational_summary`, `incident_operational_summary` e `inventory_stock_summary`; actualmente están pensadas para personal autorizado y son la base de reportes posteriores.

## Checklist de integración

- [ ] Configurar URL de API y cliente Supabase público en `frontend/.env.local`.
- [ ] Implementar cliente HTTP que inyecte `Bearer access_token` y trate 401/403/409/422.
- [ ] Cargar `/auth/me` una vez por sesión y guardar roles en estado global.
- [ ] Usar los estados de este documento para etiquetas, filtros y acciones habilitadas.
- [ ] Consumir disponibilidad antes de crear una solicitud.
- [ ] Mantener los UUID devueltos por cada paso; no intentar reconstruirlos en frontend.
- [ ] Cargar fotos al bucket privado antes de registrar su `storage_path`.
- [ ] Consultar Swagger para cualquier campo opcional o respuesta que se quiera tipar exactamente.
