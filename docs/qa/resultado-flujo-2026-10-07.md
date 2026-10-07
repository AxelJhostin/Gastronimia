# Prueba del flujo real — 7 de octubre de 2026

> **Actualización posterior:** R-02 fue corregido en local y la suite ampliada pasó 141/141 comprobaciones. Ver [cierre de auditoría](./cierre-r02-auditoria-2026-10-07.md). Este informe conserva la ejecución inicial de 137 pruebas anterior a la corrección.

**Resultado: flujo principal y regresión automatizada aprobados; cierre del MVP pendiente.** Pasaron 137/137 comprobaciones Cypress y las dos integraciones reales. Los defectos del diagnóstico siguen abiertos: la suite no cubre todos esos escenarios.

## Entorno y evidencia

- Código: `main`, commit `c86b50f`; sin cambios de aplicación durante la ejecución.
- Next.js: compilación de producción verificada hoy, servida en `http://localhost:3000`.
- FastAPI: `http://127.0.0.1:8000`; Supabase Docker local `Gastronimia`.
- Las 36 migraciones versionadas están aplicadas; credenciales locales verificadas sin mostrarlas.
- Docker 29.7.2; Cypress 15.21.1; Electron 138.0.7204.251; macOS arm64.
- Cypress: **08:39:41–08:40:42, America/Guayaquil**, sin reintentos.
- Comando: `npm run test:qa -- --config retries=0`.
- [Evidencia detallada Cypress](./evidencia-cypress-2026-10-07.json).
- Integraciones ejecutadas individualmente con `--no-cov`: `test_local_workflow.py` y `test_live_api.py`; ambas aprobadas, ninguna omitida.
- Logs temporales: `/private/tmp/gastronomia-qa-2026-10-07.log`, `/private/tmp/gastronomia-integration-2026-10-07.log` y `/private/tmp/gastronomia-auth-integration-2026-10-07.log`.

Se conservaron los datos existentes. No se ejecutaron `db reset`, restauración del demo, migraciones ni borrados masivos. Las suites crearon usuarios, recursos y operaciones identificables como QA/Cypress o integración; algunos escenarios dejan operaciones pendientes a propósito. No se alteró el proyecto Docker de Biblioteca. Frontend y FastAPI quedaron levantados para continuar la revisión local.

## Resultado por suite

| Suite | Aprobadas | Fallidas |
| --- | ---: | ---: |
| Autenticación | 1 | 0 |
| Límites de acceso, accesibilidad y estados | 18 | 0 |
| Formularios y experiencia de uso | 22 | 0 |
| Novedades y evidencia privada | 2 | 0 |
| Gestión y reportes | 14 | 0 |
| Permisos de interfaz y API por rol | 75 | 0 |
| Flujo del Encargado y consistencia | 3 | 0 |
| Ciclo completo de préstamo | 1 | 0 |
| Recuperación de inspección pendiente | 1 | 0 |
| **Total Cypress** | **137** | **0** |
| Integración Auth → JWT → API → permisos | 1 | 0 |
| Integración solicitud → devolución | 1 | 0 |

## Recorridos verificados

- Acceso/salida y menús por rol; rechazo de accesos en los casos UI/FastAPI incluidos.
- Creación/envío de solicitud, aprobación total/parcial y rechazo con motivo.
- Preparación, inspección de salida, token temporal y entrega con nombre de quien retira.
- Consulta del préstamo por el docente responsable y aislamiento entre docentes.
- Devolución parcial/final: stock **10 → 8 → 9 → 10**, pendiente de una unidad tras la primera devolución y cierre de solicitud/préstamo al completar.
- Devolución de unidad individual con daño, fotografía privada, bloqueo de disponibilidad y mantenimiento correctivo.
- Recuperación de inspección pendiente después de recargar.
- Ajustes, kardex, reportes y operaciones administrativas específicas incluidas en los specs.

El token temporal no equivale al QR escaneable pendiente. Las pruebas de reportes tampoco certifican todas las columnas, totales con gran volumen o paginación.

## R-02 confirmado en la base activa

La política de `public.operational_audit_log` permite `ADMIN` y `MANAGER`. Se seleccionó un Encargado QA y se consultó la tabla en una transacción con rol PostgreSQL `authenticated` y su identidad JWT local. La consulta confirmó filas visibles. Se ejecutó `ROLLBACK`, sin cambios persistentes.

Esto confirma el acceso por permisos de base/RLS; no se hizo una petición HTTP directa a PostgREST en esa comprobación. Las pruebas Cypress de 403 en pantalla/FastAPI no cubren esa vía.

## Pendientes conservados

R-01 a R-07 del [diagnóstico](./diagnostico-retoma-2026-10-07.md) siguen abiertos. R-07 sigue siendo un riesgo por inspección, sin reproducción concurrente. También quedan QR, cancelaciones, pérdidas por cantidad, recuperación de borradores, aceptación manual y despliegue.

El [seguimiento de cierre](../roadmap/seguimiento-cierre-mvp.md) contiene el orden vigente para trabajar un punto a la vez.
