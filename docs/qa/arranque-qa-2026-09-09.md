# Arranque de QA — 9 de septiembre de 2026

Esta es la hoja de trabajo para retomar el proyecto. El resultado actual es **rechazado para cierre del MVP**: Cypress ejecutó 137 comprobaciones, con 127 aprobadas y 10 fallidas, agrupadas en cinco defectos.

El detalle, las capturas y la evidencia exacta están en el [informe de QA](./resultado-qa-2026-09-08.md). La [matriz del plan manual](./plan-pruebas-manuales.md#22-matriz-consolidada-de-esta-ejecución) indica qué casos están aprobados, fallidos o parciales.

## Orden de trabajo

| Prioridad | Defecto | Qué arreglar | Archivos principales | Verificación al terminar |
| --- | --- | --- | --- | --- |
| P0 | BUG-001 | Solo `ADMIN` puede ver y consultar Auditoría. | `frontend/src/app/dashboard/audit-log/page.tsx`, `backend/app/api/v1/endpoints/audit.py`, `backend/tests/test_reports.py` | `npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-permissions.cy.ts` |
| P1 | BUG-002 | Aceptar los movimientos operativos (`LOAN_OUT`, `RETURN_IN`) al listar kardex/movimientos; Gestión de inventario debe conservar los catálogos visibles aun si una consulta falla. | `backend/app/core/inventory.py`, `frontend/src/app/dashboard/inventory/manage/page.tsx`, pruebas de inventario | `npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-management.cy.ts` |
| P1 | BUG-003 | Un Docente que abra un detalle de devolución o inspección debe recibir 403, sin quedarse cargando. | `frontend/src/app/dashboard/returns/[id]/page.tsx`, `frontend/src/app/dashboard/returns/inspections/[id]/page.tsx` | `npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-boundaries.cy.ts` |
| P2 | BUG-004 | El modal de confirmación debe enfocar un control al abrir, cerrar con Escape, retener el foco y devolverlo al disparador. | `frontend/src/components/ui/confirm-modal.tsx` | `npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-boundaries.cy.ts` |
| P2 | BUG-005 | El menú móvil debe bloquear el desplazamiento del fondo mientras esté abierto. | `frontend/src/components/layout/app-shell.tsx` | `npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-boundaries.cy.ts` |

No modificar las expectativas de Cypress para convertir un defecto en éxito. Primero se corrige el comportamiento y después se vuelve a ejecutar el caso que lo detectó.

## Comandos de inicio

Con Docker Desktop abierto, usar tres terminales:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run seed:demo
```

```bash
cd /Users/hernandezaxel/proyectos/Gastronomia
source backend/.venv/bin/activate
npm run dev:backend
```

```bash
cd /Users/hernandezaxel/proyectos/Gastronomia
npm run dev:frontend
```

Luego, para no reiniciar la base durante la corrección:

```bash
cd /Users/hernandezaxel/proyectos/Gastronomia
npm run test:qa -- --config retries=0 --spec cypress/e2e/qa-permissions.cy.ts
```

`test:qa` reutiliza los servicios locales y añade registros identificados como `QA`/`Cypress`. `test:e2e` sí restablece la base local; no usarlo mientras se esté revisando un escenario creado manualmente.

## Antes de dar por cerrado un defecto

1. Ejecutar el spec asociado al defecto y confirmar que pasa.
2. Ejecutar las pruebas unitarias del área modificada.
3. Ejecutar al final la suite completa:

```bash
npm run test:qa -- --config retries=0
```

4. Actualizar el estado del defecto y la matriz de QA, con fecha y resultado real.

Después de corregir los cinco defectos, todavía quedarán criterios `PARCIAL` en el plan: token vencido, distribución incorrecta por ubicación, preparación incompleta/excesiva, CRUD académico completo, filtros combinados, auditoría de eventos, concurrencia, revisión visual amplia y accesibilidad manual.
