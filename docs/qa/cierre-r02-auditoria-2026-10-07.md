# Cierre R-02 — Auditoría restringida al Administrador

**Punto 1.1 completado en el entorno local, 7 de octubre de 2026.** El Administrador conserva la lectura de auditoría; Encargado y Docente ya no reciben filas mediante la Data API de Supabase. Sin sesión, la consulta se rechaza.

## Cambio

La migración `20261007134832_restrict_operational_audit_to_admin.sql` sustituye la política que permitía ADMIN/MANAGER por una política de lectura para usuarios ADMIN activos, usando la función existente `private.has_role`. No cambia las concesiones de escritura del servidor: las operaciones del Encargado siguen creando eventos de auditoría.

Se aplicó únicamente en Supabase local y quedó registrada como migración 37. No se reinició la base ni se modificaron proyectos remotos. La aplicación del cambio en otros entornos queda dentro del bloque de despliegue.

## Prueba de regresión que detecta el problema

Se amplió `frontend/cypress/e2e/qa-permissions.cy.ts` con cuatro comprobaciones de la Data API: ADMIN, MANAGER, TEACHER y usuario sin sesión. La preparación crea un ajuste real con un Encargado y consulta exactamente el evento generado; así la comprobación no puede pasar porque la tabla esté vacía ni por leer eventos ajenos a la prueba.

- **Antes del cambio:** 79 comprobaciones, 78 aprobadas y 1 fallida. El Encargado recibió una fila donde debía recibir cero. [Evidencia anterior](./evidencia-r02-antes-2026-10-07.json).
- **Después del cambio:** suite completa, **141/141 aprobadas**, cero fallos, omisiones o reintentos. Incluye 79 comprobaciones de permisos y los recorridos operativos. [Evidencia posterior](./evidencia-r02-despues-2026-10-07.json).

| Acceso | Data API directa | Aplicación / FastAPI |
| --- | --- | --- |
| Administrador | 200, evento visible | Permitido |
| Encargado | 200, cero filas | Denegado |
| Docente | 200, cero filas | Denegado |
| Sin sesión | 401/403 admitidos por la prueba, sin lectura | No se amplió la prueba de aplicación para este caso; se conserva la protección existente |

RLS filtra filas de las consultas autenticadas denegadas; no es necesario que devuelva un error HTTP. Referencia: [documentación oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Comprobaciones adicionales

- ESLint frontend y tipos de Cypress: aprobados.
- `supabase db advisors --local --type security --level warn --fail-on error`: sin incidencias reportadas.
- `supabase migration list --local`: historial alineado, incluida la nueva migración.
- La comparación de esquemas reprodujo las 37 migraciones en una base auxiliar y no encontró diferencias. La CLI devolvió `LegacyDbPullInSyncError` / `No schema changes found` con salida 1 porque no había cambios por importar; no generó archivos adicionales.
- La suite sigue verificando que el Encargado puede registrar operaciones, y que el flujo de solicitud, entrega y devolución funciona.

No se repitieron las pruebas unitarias del backend ni su compilación: no cambió código Python ni de la aplicación. La regresión completa ejercitó los servicios reales sobre la política corregida.

**Siguiente punto:** 1.2 / R-01, validación del cambio obligatorio de contraseña temporal. Los demás hallazgos permanecen abiertos en el [seguimiento](../roadmap/seguimiento-cierre-mvp.md).
