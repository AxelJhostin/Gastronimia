# Cierre local de R-03: estados de unidades

Fecha: **7 de octubre de 2026**, America/Guayaquil. Estado: **corregido y verificado en local**.

La edición de catálogo permitía marcar una unidad prestada o en mantenimiento como disponible sin completar su proceso. También permitía crear estados operativos sin una operación real, dejar equipos dañados disponibles y cambiar el artículo asociado a su historial.

## Corrección

- El alta y la edición de catálogo solo aceptan `AVAILABLE` y `DISABLED`. Préstamos, devoluciones, inspecciones y mantenimiento administran sus propios estados.
- La base impide que una unidad `DAMAGED` quede `AVAILABLE` o `LOANED`, y conserva el artículo asociado a la unidad mediante un trigger.
- La edición se ejecuta con una operación transaccional que bloquea la unidad, coordina con el bloqueo de selección de preparación y comprueba preparación activa, préstamo pendiente de devolución, inspección pendiente y mantenimiento abierto. También rechaza unidades cuyo estado actual sea `LOANED` o `MAINTENANCE`.
- Solo el servidor puede ejecutar esa operación; recibe el usuario autenticado y verifica que sea personal activo. Los clientes no tienen permiso de escritura directa sobre la tabla.
- La interfaz conserva el artículo, elimina los estados operativos del selector y deshabilita editar/activar/desactivar las unidades prestadas o en mantenimiento. Los rechazos al guardar se muestran dentro del formulario.
- Los cambios válidos siguen generando el historial existente; los cambios rechazados no lo alteran. La atribución del actor en auditoría sigue pendiente en **R-04**.

Migración: [20261007222224_guard_inventory_unit_edits.sql](../../supabase/migrations/20261007222224_guard_inventory_unit_edits.sql). La operación usa permisos del invocador y acceso restringido conforme a la [documentación de funciones de Supabase](https://supabase.com/docs/guides/database/functions).

## Evidencia antes y después

Las cuatro pruebas nuevas fallaron antes de la corrección: se aceptaba crear una unidad prestada, modificar una unidad preparada, liberar una prestada y liberar otra en mantenimiento. Tras aplicar la corrección, las cuatro pasaron y la suite completa también pasó.

| Comprobación | Resultado |
| --- | --- |
| Reproducción antes de corregir | 4 fallos esperados, 0 aprobadas |
| Regresión completa Cypress después | **146/146 aprobadas**, 11 archivos, sin fallos, omisiones ni reintentos |
| Backend | **120 aprobadas**, 2 integraciones optativas omitidas; cobertura 83,49 % |
| Frontend | **32 aprobadas**, 15 archivos |
| Ruff, mypy, lint y tipos de aplicación/Cypress | Aprobados |
| Compilación de producción | Aprobada |
| Prueba directa de base con reversión | Permisos, restricciones, actor autorizado e historial aprobados |
| Asesores de Supabase | Sin advertencias ni errores |
| Migraciones y reproducción del esquema | 38 alineadas; sin diferencias entre migraciones y base local |

Archivos de evidencia: [antes](./evidencia-r03-antes-2026-10-07.json), [después](./evidencia-r03-despues-2026-10-07.json), [pruebas de navegador](../../frontend/cypress/e2e/inventory-unit-guards.cy.ts) y [prueba directa de base](../../supabase/tests/inventory_unit_guards.sql).

El recorrido nuevo comprueba además el rechazo de una unidad dañada disponible y del cambio de artículo; conserva una edición válida desde la interfaz, el historial, la devolución completa con inspección y el cierre normal del mantenimiento. La suite conserva los flujos de daño con evidencia, permisos de auditoría y contraseña temporal.

La comprobación de esquema reconstruyó las migraciones en una base auxiliar. El comando terminó con `LegacyDbPullInSyncError / No schema changes found`, que en esta versión de la herramienta indica que no hay diferencias que guardar.

## Alcance y siguientes pasos

La migración se aplicó únicamente al proyecto local Gastronomía. Antes de desplegar el backend debe aplicarse en el entorno de destino; si ese entorno contiene unidades dañadas disponibles o prestadas, la restricción detendrá la migración para revisar esas inconsistencias, sin corregirlas automáticamente.

Se conservaron los datos existentes. Las cuatro unidades QA alteradas al reproducir el fallo se restauraron a estados coherentes, limitando la operación a las etiquetas QA, su intervalo de creación y los cambios de estado registrados en esa ejecución. La prueba directa de base revierte todos sus datos; los escenarios Cypress permanecen identificables como QA.

Este cierre protege la edición de catálogo. La revisión de operaciones simultáneas de entrega y mantenimiento (**R-07**) permanece en el bloque de concurrencia; no se considera resuelta por estas pruebas. Las dos integraciones optativas del backend no se ejecutaron nuevamente en este punto, aunque Cypress sí utilizó los servicios locales reales.

Siguiente punto del [seguimiento](../roadmap/seguimiento-cierre-mvp.md): **1.4 / R-04, responsable de los cambios en la auditoría de unidades**.
