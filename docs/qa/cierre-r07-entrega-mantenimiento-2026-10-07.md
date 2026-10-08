# Cierre local de R-07: entrega e inicio de mantenimiento simultáneos

Fecha: **7 de octubre de 2026**, America/Guayaquil. Estado: **corregido y verificado en local**.

## Defecto reproducido

Se preparó una solicitud individual de QA por la API real. Una conexión ejecutó la entrega sin confirmar todavía su transacción. Una segunda conexión inició mantenimiento: el SELECT sin bloqueo vio la versión anterior disponible y su UPDATE quedó esperando la entrega. Después de confirmar la primera conexión, el mantenimiento sobrescribió `LOANED` con `MAINTENANCE`.

El resultado anterior fue una solicitud `DELIVERED`, reserva `CONSUMED`, QR usado, un préstamo con su unidad y un mantenimiento abierto simultáneamente. Ambos eventos operativos se habían registrado. La prueba detectó esta inconsistencia; el caso inverso, mantenimiento primero, ya rechazaba la entrega correctamente.

La reproducción usa dos sesiones reales de PostgreSQL con rol `service_role`. Antes de confirmar la primera transacción consulta `pg_stat_activity` y `pg_blocking_pids` para demostrar que la segunda está esperando un bloqueo. No depende de que dos peticiones coincidan por casualidad ni modifica la función de producción para introducir pausas.

## Corrección

`start_equipment_maintenance` ahora adquiere `FOR UPDATE` sobre la unidad antes de comprobar su existencia, activación y estado. Si debe esperar a una entrega, valida la versión que queda después de que esa entrega termine. Conserva el bloqueo hasta confirmar o revertir la operación.

La entrega ya actualiza la unidad de manera condicional, exigiendo `AVAILABLE`. Por ello, si mantenimiento confirma primero, la entrega rechaza la unidad y revierte sus escrituras previas. No fue necesario cambiar la función de entrega ni los contratos de la API.

Este comportamiento se apoya en las reglas documentadas de PostgreSQL para [espera y revalidación de filas bajo Read Committed](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-READ-COMMITTED).

Migración: [20261008034524_serialize_maintenance_with_delivery.sql](../../supabase/migrations/20261008034524_serialize_maintenance_with_delivery.sql). El nombre utiliza fecha UTC; la ejecución corresponde al 7 de octubre en Guayaquil.

## Verificación

| Escenario | Resultado |
| --- | --- |
| Antes: entrega confirma primero | Fallo reproducido: préstamo y mantenimiento abiertos simultáneamente |
| Después: entrega confirma primero | Un préstamo, unidad `LOANED`, ningún mantenimiento ni evento de inicio de mantenimiento |
| Después: mantenimiento confirma primero | Un mantenimiento, unidad `MAINTENANCE`, ningún préstamo ni unidad de préstamo ni evento de entrega |
| Entrega rechazada | Solicitud `PREPARED`, reserva `ACTIVE`, QR sin consumir |
| Recuperación | Completar mantenimiento y entregar con el mismo QR vigente funciona |
| API tras la colisión | Devuelve 409 para la operación incompatible |
| Regresión completa | **150/150 Cypress aprobadas**, 13 archivos, sin fallos, omisiones ni reintentos |
| Lint y tipos Cypress | Aprobados |
| Asesores de base | Sin advertencias ni errores |
| Esquema | 40 migraciones alineadas; reconstrucción sin diferencias |

Evidencia: [antes](./evidencia-r07-antes-2026-10-07.json), [después](./evidencia-r07-despues-2026-10-07.json), [casos Cypress](../../frontend/cypress/e2e/unit-concurrency.cy.ts) y [coordinación de las conexiones](../../frontend/cypress/tasks/unit-concurrency.ts).

Para repetir únicamente estos escenarios con los servicios locales ya encendidos:

```bash
npm run test:qa -- --spec cypress/e2e/unit-concurrency.cy.ts --config retries=0
```

El coordinador solo admite el contenedor local `supabase_db_Gastronimia`; prepara datos propios de QA y sus operaciones se ejecutan como servidor. La conexión que observa bloqueos utiliza el usuario local de pruebas. Las sesiones tienen límites de tiempo y se cierran al terminar. Si detecta el defecto anterior, conserva el resultado para la aserción y restaura exclusivamente la unidad QA afectada: cancela su mantenimiento de prueba y restablece el estado prestado, manteniendo el historial.

## Alcance

Se modificó una función de base y el soporte de pruebas. No hubo cambios en el código de aplicación ni despliegue remoto. Se conserva la suite unitaria previamente aprobada; no se contabiliza como ejecutada nuevamente en este cierre.

El cierre demuestra el conflicto entre entrega e inicio de mantenimiento sobre una misma unidad en ambos órdenes. Las aprobaciones simultáneas, entregas/devoluciones duplicadas y demás escenarios de concurrencia conservan sus casillas independientes en el [seguimiento](../roadmap/seguimiento-cierre-mvp.md).

Siguiente punto: **dos aprobaciones simultáneas sin reservar más de lo disponible**.
