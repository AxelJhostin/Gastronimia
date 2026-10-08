# Verificación local: aprobaciones simultáneas sin sobre-reserva

Fecha: **7 de octubre de 2026**, America/Guayaquil. Estado: **verificado en local**.

La protección existente funciona en los escenarios comprobados. No fue necesario modificar la lógica de aprobación ni crear una migración: el trigger de reservas toma un bloqueo transaccional por artículo y consulta nuevamente su disponibilidad después de adquirirlo.

## Escenarios comprobados

| Dos solicitudes sobre el mismo artículo | Resultado |
| --- | --- |
| Cantidad: 7 + 7 sobre stock de 10, mismo horario | Primera aprobada; segunda rechazada y pendiente; quedan 3 disponibles |
| Individual: 1 + 1 sobre una única unidad, mismo horario | Solo una aprobada; ninguna unidad disponible para otra reserva |
| Cantidad: 4 + 6 sobre stock de 10 | Ambas aprobadas; disponibilidad 0 |
| Cantidad: 7 + 7 en horarios contiguos, sin superposición | Ambas aprobadas; quedan 3 disponibles en cada intervalo |
| Primera aprobación ejecutada pero su transacción se revierte | Segunda aprobada; primera pendiente y sin reserva; quedan 3 disponibles |

Para el primer caso se comprueba además el reintento por API: aprobar de nuevo 7 devuelve 409; aprobar parcialmente las 3 restantes funciona y deja disponibilidad 0.

## Método y consistencia

Cada escenario crea usuarios, inventario y dos solicitudes propios de QA mediante los servicios locales. La primera aprobación pertenece al Administrador y la segunda al Encargado.

Dos conexiones reales de PostgreSQL ejecutan las aprobaciones con rol de servidor. Se mantiene abierta la primera transacción hasta observar que la segunda espera específicamente el bloqueo consultivo del artículo, comprobado mediante `pg_stat_activity` y `pg_blocking_pids`. Después se confirma o revierte la primera y se verifica el resultado de ambas.

Las solicitudes rechazadas o revertidas permanecen `PENDING`, sin reserva, detalles de revisión ni decisión de aprobación persistidos. Las aprobadas conservan una única reserva y una única decisión con el revisor correcto. El stock físico no cambia al reservar: se comprueba por separado de la disponibilidad reservable.

La revisión por API confirma los estados finales y el rechazo 409 cuando falta disponibilidad. Estos escenarios no prueban una función de cancelación de solicitudes; el caso de reversión utiliza una transacción de base que no se confirma.

## Evidencia

- **5/5 escenarios nuevos aprobados.**
- **155/155 Cypress aprobadas**, 14 archivos, sin fallos, omisiones ni reintentos.
- Lint y tipos de Cypress aprobados.
- La regresión completa conserva las pruebas de entrega/mantenimiento simultáneos, auditoría, contraseña temporal y ciclo de préstamos.

Archivos: [resultado completo](./evidencia-aprobaciones-simultaneas-2026-10-07.json), [casos de prueba](../../frontend/cypress/e2e/approval-concurrency.cy.ts), [coordinación de aprobaciones](../../frontend/cypress/tasks/approval-concurrency.ts) y [conexiones locales compartidas](../../frontend/cypress/tasks/local-database.ts).

Repetición con los servicios locales encendidos:

```bash
npm run test:qa -- --spec cypress/e2e/approval-concurrency.cy.ts --config retries=0
```

## Alcance

Se añadieron pruebas y se extrajo el soporte de conexiones de R-07 para reutilizarlo. No hubo cambios en el código de aplicación, esquema, configuración de producción ni despliegue remoto. Las pruebas unitarias y la compilación previas no se contabilizan como ejecutadas nuevamente en este punto.

Las pruebas cubren dos solicitudes que compiten por un mismo artículo, tanto por cantidad como individual, y los límites indicados. No constituyen una prueba de carga general ni de todos los conjuntos posibles de múltiples artículos. Los demás escenarios de concurrencia permanecen separados en el [seguimiento](../roadmap/seguimiento-cierre-mvp.md).

Siguiente punto: **reserva, entrega y devolución duplicadas sin duplicar movimientos**.
