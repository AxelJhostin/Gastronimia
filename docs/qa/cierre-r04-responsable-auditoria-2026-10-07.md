# Cierre local de R-04: responsable de las ediciones de unidades

Fecha: **7 de octubre de 2026**, America/Guayaquil. Estado: **corregido y verificado en local**.

Las ediciones manuales de unidades generaban eventos sin responsable. Además, cambiar únicamente notas, etiqueta o número de serie no generaba un evento de auditoría. La pantalla mostraba «Sistema» cuando no se había registrado una identidad.

## Corrección

La operación protegida `edit_inventory_unit` transmite al trigger el usuario autenticado que ya valida el servidor. El contexto es local a la transacción y se restaura después de actualizar. El trigger conserva `performed_by_user_id`, valores completos anteriores y nuevos y fecha. Compara los datos excluyendo `updated_at`, de modo que los cambios descriptivos también se registran y reenviar valores idénticos no genera un evento de auditoría ficticio.

El registro pertenece a la misma transacción de la edición: si falla la auditoría, la edición se revierte. La operación no acepta que el cliente elija al responsable y sigue reservada al servidor, con comprobación de personal activo. Se conservan las protecciones de R-03.

La API de auditoría añade el nombre del perfil mediante `actor: {id, full_name} | null`. La pantalla del Administrador muestra el nombre, una referencia a la identidad y un detalle desplegable «Antes / Después» para las unidades. Los eventos sin identidad dicen «No registrado». El nombre corresponde al perfil actual; el identificador persistido en el evento conserva la atribución.

Migración: [20261008033527_attribute_inventory_unit_edits.sql](../../supabase/migrations/20261008033527_attribute_inventory_unit_edits.sql). Su fecha usa UTC; la ejecución corresponde al 7 de octubre en Guayaquil. El alcance transaccional del contexto sigue la [documentación de PostgreSQL sobre set_config](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET).

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Regresión nueva antes de corregir | 2 fallos esperados: faltaba el evento descriptivo |
| Consulta de los eventos anteriores de QA | 2 eventos, ambos sin responsable |
| Casos nuevos después | Encargado y Administrador aprobados; identidad, fecha, valores y visualización comprobados |
| Cypress completo | **148/148 aprobadas**, 12 archivos, sin fallos, omisiones ni reintentos |
| Backend | **120 aprobadas**, 2 integraciones optativas omitidas; cobertura 83,53 % |
| Frontend | **32 aprobadas**, 15 archivos |
| Ruff, mypy, lint, tipos y compilación de producción | Aprobados |
| Prueba directa de base | Identidad, cambios descriptivos, ausencia de duplicados, aislamiento del contexto y reversión por fallo de auditoría aprobados |
| Asesores de base | Sin advertencias ni errores |
| Migraciones | 39 alineadas; reconstrucción sin diferencias de esquema |

Evidencia: [antes](./evidencia-r04-antes-2026-10-07.json), [después](./evidencia-r04-despues-2026-10-07.json), [regresión de navegador](../../frontend/cypress/e2e/inventory-unit-audit.cy.ts) y [prueba transaccional de base](../../supabase/tests/inventory_unit_audit.sql).

La prueba de navegador comprueba también que el Encargado no puede leer la auditoría, que no se atribuye el cambio al usuario falso enviado en el cuerpo, que un cambio rechazado no crea otro evento y que los valores aparecen en la interfaz del Administrador. La prueba SQL provoca un fallo controlado de auditoría y verifica que se conserven la unidad y el registro anteriores. Todos sus datos y su trigger temporal se revierten.

## Alcance

El cierre cubre las ediciones manuales del catálogo de unidades descritas en R-04. Entrega, devolución, inspección y mantenimiento conservan sus eventos operativos propios con responsable; los eventos derivados de unidad sin contexto no reciben una identidad inferida. No se rellenaron responsables desconocidos en eventos históricos.

No hubo despliegue remoto. Aplicar la migración en el entorno de destino y desplegar el servidor y la interfaz actualizados para mostrar nombres y detalles. Las dos integraciones optativas del backend no se ejecutaron nuevamente; Cypress utilizó los servicios locales reales. La revisión manual integral de toda la auditoría continúa en su bloque de aceptación.

Con este punto termina el **bloque 1 en local**. Siguiente en el [seguimiento](../roadmap/seguimiento-cierre-mvp.md): **bloque 2, R-07, entrega simultánea con inicio de mantenimiento**.
