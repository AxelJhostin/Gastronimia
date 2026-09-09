# Resultado de QA — 8 de septiembre de 2026

> **Actualización del 9 de septiembre:** los cinco defectos de este informe fueron corregidos y verificados. La nueva ejecución terminó con 137/137 comprobaciones Cypress aprobadas. Ver el [informe de reverificación](./resultado-reverificacion-2026-09-09.md). El contenido siguiente se conserva como evidencia histórica de la ejecución que detectó los problemas.

**Resultado: RECHAZADO para cierre del MVP.** El ciclo operativo principal funciona, pero hay cinco defectos abiertos y criterios parcialmente comprobados. No se ha certificado todo el plan ni se han corregido los defectos de aplicación en este trabajo.

Para retomar la corrección sin releer este informe completo, usar la [hoja de arranque de QA](./arranque-qa-2026-09-09.md).

## Entorno y evidencia

- Aplicación: `main`, commit `6d9bebf`; cambios locales limitados a pruebas, ejecución QA y documentación.
- Servicios existentes: Next.js en `http://localhost:3000`, FastAPI en `http://127.0.0.1:8000`, Supabase local de `Gastronimia` en `http://127.0.0.1:54321`.
- Navegador: Electron 138 headless, Cypress 15.21.1, macOS arm64.
- Ejecución definitiva: 2026-09-08 22:36:47–22:38:43, America/Guayaquil (UTC−05:00).
- Comando: `npm run test:qa -- --config retries=0`.
- [Evidencia JSON versionada: cada prueba, estado y error](./evidencia-cypress-2026-09-08.json).
- Original local: `frontend/cypress/results/qa-2026-09-09T03-36-47-673Z.json`.
- Capturas: `frontend/cypress/screenshots/`; vídeos: `frontend/cypress/videos/`. Son artefactos locales ignorados por Git. Se conservan también ejecuciones exploratorias; este informe y el JSON enlazado corresponden únicamente a la ejecución definitiva.

No se reinició la base ni se restauró el demo. Se añadieron usuarios/recursos de prueba con nombres `cypress-`, `Cypress` y `QA`, una fotografía demo como evidencia y registros de integración con identificadores únicos. Algunos escenarios dejan préstamos o inspecciones pendientes intencionadamente. Las cuentas y los registros QA se conservan para inspección; no se ejecutó limpieza masiva.

## Resultados automatizados

| Archivo Cypress | Total | PASS | FAIL |
| --- | ---: | ---: | ---: |
| `auth.cy.ts` | 1 | 1 | 0 |
| `qa-boundaries.cy.ts` | 18 | 13 | 5 |
| `qa-forms-ux.cy.ts` | 22 | 22 | 0 |
| `qa-incidents.cy.ts` | 2 | 2 | 0 |
| `qa-management.cy.ts` | 14 | 11 | 3 |
| `qa-permissions.cy.ts` | 75 | 73 | 2 |
| `qa-workflow.cy.ts` | 3 | 3 | 0 |
| `request-lifecycle.cy.ts` | 1 | 1 | 0 |
| `return-recovery.cy.ts` | 1 | 1 | 0 |
| **Total** | **137** | **127** | **10** |

Cero pruebas omitidas o saltadas; salida del proceso: `10`. Son comprobaciones, no casos completos del documento. La [matriz consolidada](./plan-pruebas-manuales.md#22-matriz-consolidada-de-esta-ejecución) detalla qué criterios quedan sin verificar.

También pasaron ESLint, TypeScript del frontend y Cypress, Vitest (28 pruebas), Ruff, mypy (29 archivos), pytest unitario (95 pruebas; cobertura 82.40%) y las dos integraciones reales ejecutadas separadamente con opt-in. No se ejecutó build de producción; Cypress usó el servidor de desarrollo ya iniciado.

## Lo comprobado del ciclo principal

Se verificaron por interfaz solicitudes, disponibilidad preliminar, aprobación completa y parcial, rechazo con motivo, preparación, inspección de salida, token, entrega, consulta docente, devolución parcial y final e historial. El caso con Encargado contrastó el saldo real: **10 → 8 al entregar → 9 al devolver una parte → 10 al completar**. El préstamo parcial conservó un pendiente de 1; al terminar cerró solicitud y préstamo y quedó en el historial docente.

Un escenario adicional preparó y entregó un equipo individual mediante la API real, y realizó la devolución dañada por interfaz: exigió descripción, registró severidad alta, subió una WebP, abrió la URL firmada, rechazó acceso por URL pública y mantuvo condición `DAMAGED`/estado `MAINTENANCE`. Una reparación correctiva terminó con estado disponible y condición buena. Crear mantenimiento mientras la unidad estaba prestada devolvió `409`.

Dos docentes distintos no pudieron consultar solicitudes/préstamos ajenos por API; el detalle ajeno devolvió `403`. Los menús coincidieron con la matriz de los tres roles. Las comprobaciones de autorización de API se hicieron con JWT reales, no con respuestas simuladas. Solo los ensayos de caída de red usaron interceptación.

## Defectos reproducidos

### BUG-001 — Encargado accede a Auditoría reservada a Administrador

- Severidad: **Crítica**, según el criterio de acceso indebido del plan.
- Estado: **Reproducido; abierto**.
- Casos: `QA-AUTH-04`, `QA-AUD-01`.
- Rol: `MANAGER`.
- URLs: `/dashboard/audit-log`, `GET /api/v1/admin/audit`.

Pasos:

1. Iniciar sesión como Encargado.
2. Confirmar que Auditoría no aparece en el menú.
3. Escribir `/dashboard/audit-log` directamente.
4. Consultar la API de auditoría usando el token del mismo usuario.

Actual: la página muestra el registro de auditoría y la API devuelve `200`. Esperado por el plan: página de acceso denegado y API `403`.

Causa comprobada en código: `frontend/src/app/dashboard/audit-log/page.tsx` permite `ADMIN` o `MANAGER`; `backend/app/api/v1/endpoints/audit.py:13` utiliza `require_request_reviewer`. Además, `backend/tests/test_reports.py::test_manager_can_read_operational_audit` exige `200` para Encargado. La implementación y ese test contradicen el requisito de QA; pasar pruebas unitarias no resuelve esta diferencia.

Evidencia: dos fallos del grupo `manager` en `qa-permissions.cy.ts`, incluidos en el JSON. Capturas del mismo spec en la carpeta de evidencias local.

### BUG-002 — Listado de movimientos devuelve 500 y vacía Gestión de inventario

- Severidad: **Alta**.
- Estado: **Reproducido; abierto**.
- Casos: `QA-INV-02`, `QA-INV-03`, `QA-UX-02`.
- Roles: personal autorizado.
- URLs: `/dashboard/inventory/manage`, `GET /api/v1/admin/inventory/movements`.

Pasos:

1. Completar una entrega/devolución de recursos por cantidad.
2. Consultar el listado de movimientos: devuelve `500`.
3. En Gestión de inventario, crear/editar una categoría o ubicación, desactivarla y reactivarla.
4. Recargar la pantalla.

Actual: aparece `Failed to fetch` y los catálogos quedan visualmente vacíos. Esperado: movimientos operativos consultables y catálogos persistentes visibles.

Las escrituras de catálogo sí persistieron: se confirmó por consulta SQL de los registros QA. El problema no es que la edición se pierda. `InventoryMovement` hereda `QuantityStockMovementCreate`, cuyo enum `InventoryMovementType` en `backend/app/core/inventory.py:118` admite solo `INITIAL_STOCK`, `ADJUSTMENT_IN` y `ADJUSTMENT_OUT`. La base tiene movimientos válidos `LOAN_OUT`/`RETURN_IN`; al validarlos como respuesta falla la API. El `Promise.all` de Gestión de inventario descarta la carga de los otros catálogos cuando una de las consultas falla.

Evidencia: tres fallos de `qa-management.cy.ts`: API `500` y las dos recargas. El spec prepara antes un préstamo/devuelto para reproducirlo también en una base local limpia.

### BUG-003 — Detalles de devolución quedan cargando para Docente

- Severidad: **Media**.
- Estado: **Reproducido; abierto**.
- Casos: `QA-AUTH-04`, `QA-UX-02`.
- Rol: `TEACHER`.
- URLs: `/dashboard/returns/{loanId}` y `/dashboard/returns/inspections/{returnId}`.

Pasos: iniciar sesión como Docente y abrir directamente cualquiera de esos detalles usando un ID de prueba existente.

Actual: permanece “Cargando datos del préstamo…” o “Recuperando devolución…”. Esperado: pantalla 403 con salida al panel. No se observó acceso a datos protegidos; es un bloqueo de interfaz, distinto de BUG-001.

Causa: en `frontend/src/app/dashboard/returns/[id]/page.tsx:264` y `frontend/src/app/dashboard/returns/inspections/[id]/page.tsx:203`, se evalúa `loading` antes de `!hasAccess`. El efecto no carga datos para un usuario sin permiso y tampoco termina ese estado.

Evidencia: dos fallos de rutas `returns` y `returns/inspections` en `qa-boundaries.cy.ts`.

### BUG-004 — Confirmaciones sin gestión de foco ni cierre con Escape

- Severidad: **Media**.
- Estado: **Reproducido; abierto**.
- Caso: `QA-A11Y-01`.
- Pantalla usada: continuación de una inspección pendiente, con Encargado.

Pasos: abrir “Completar inspección”; inspeccionar el foco; presionar Escape.

Actual: el foco permanece fuera del diálogo y Escape no lo cierra. Esperado: foco dentro de la confirmación, navegación de teclado controlada y retorno lógico al cerrar. Los botones visibles permiten cancelar; no se presenta como bloqueo de todo el flujo.

Causa: `frontend/src/components/ui/confirm-modal.tsx` añade `role=dialog` y `aria-modal`, pero no implementa foco inicial, restauración, contención ni manejador Escape. Se comprobaron foco inicial y Escape; no se certifica todo el orden de tabulación.

Evidencia: dos pruebas de `QA-A11Y-01` en `qa-boundaries.cy.ts`.

### BUG-005 — Menú móvil no bloquea desplazamiento del fondo

- Severidad: **Media**.
- Estado: **Comprobación automática fallida; abierto**.
- Caso: `QA-NAV-04`.
- Tamaño: 390 × 844, Administrador.

Pasos: abrir el menú móvil y revisar el bloqueo de desplazamiento de la página.

Actual: no se aplica bloqueo de scroll al documento/cuerpo. El fondo tiene un overlay, pero `AppShell` no establece `overflow: hidden`, posición fija ni un manejador que impida el desplazamiento. Esperado por el plan: fondo bloqueado mientras se usa el menú.

Evidencia: prueba de estilos computados en `qa-boundaries.cy.ts`, contrastada con `frontend/src/components/layout/app-shell.tsx`. La apertura, cierre por navegación y atributo `inert` del menú cerrado sí pasaron para los tres roles. Queda pendiente comprobar gestos táctiles en dispositivo físico.

## Límites y siguiente ciclo

No se marcaron como PASS global los casos con criterios sin ejecutar. Quedan detallados en la matriz: tokens vencidos, distribución incorrecta de cantidades entre ubicaciones, preparación incompleta/excesiva por UI, ciertos CRUD administrativos y contraseñas temporales, filtros combinados, toda la secuencia de auditoría, concurrencia, revisión visual completa, contraste y lector de pantalla. La recuperación de servicios se simuló a nivel de red; no se detuvieron los servicios del usuario.

Prioridad propuesta: resolver BUG-001 y BUG-002, después BUG-003/004/005; volver a ejecutar los specs afectados y completar los criterios parciales. Mantener las expectativas que detectan los defectos. El informe no sustituye una aprobación manual final ni una revisión de seguridad/RLS completa.

## Reproducción

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run test:qa -- --config retries=0
```

Ejecutar un subconjunto:

```bash
npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-permissions.cy.ts
npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-management.cy.ts
npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-boundaries.cy.ts
```

El comando anterior reutiliza servicios locales existentes. `npm run test:e2e` conserva su comportamiento previo de reiniciar la base; elegir conscientemente entre ambos. Las claves de servicio se leen solo en Node y la configuración bloquea URLs remotas.
