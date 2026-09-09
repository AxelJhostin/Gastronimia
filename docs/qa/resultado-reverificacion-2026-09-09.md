# Reverificación de QA — 9 de septiembre de 2026

**Resultado: regresión automatizada aprobada.** Los cinco defectos abiertos en la ejecución del 8 de septiembre fueron corregidos y verificados. Cypress terminó con **137 de 137 comprobaciones aprobadas**, sin fallos, omisiones ni reintentos. El cierre manual completo del MVP continúa **con observaciones** porque todavía existen criterios parciales que no forman parte de esos 137 checks.

## Entorno y evidencia

- Base de trabajo: `main`, commit `0f35699`, más las correcciones locales descritas en este informe.
- Servicios: Next.js en `http://localhost:3000`, FastAPI en `http://127.0.0.1:8000` y Supabase local en `http://127.0.0.1:54321`.
- Navegador: Electron 138 headless, Cypress 15.21.1, macOS arm64.
- Ejecución definitiva: 9 de septiembre de 2026, 07:33:19–07:34:42, America/Guayaquil.
- Comando: `npm run test:qa -- --config retries=0`.
- [Resumen JSON versionado](./evidencia-cypress-2026-09-09.json); evidencia local completa en `frontend/cypress/results/qa-2026-09-09T12-33-19-651Z.json` y vídeos en `frontend/cypress/videos/`.
- Cypress reutilizó la base local y añadió únicamente registros identificables como `QA`/`Cypress`; no ejecutó `db reset`.

## Resultado de Cypress

| Archivo Cypress | Total | PASS | FAIL |
| --- | ---: | ---: | ---: |
| `auth.cy.ts` | 1 | 1 | 0 |
| `qa-boundaries.cy.ts` | 18 | 18 | 0 |
| `qa-forms-ux.cy.ts` | 22 | 22 | 0 |
| `qa-incidents.cy.ts` | 2 | 2 | 0 |
| `qa-management.cy.ts` | 14 | 14 | 0 |
| `qa-permissions.cy.ts` | 75 | 75 | 0 |
| `qa-workflow.cy.ts` | 3 | 3 | 0 |
| `request-lifecycle.cy.ts` | 1 | 1 | 0 |
| `return-recovery.cy.ts` | 1 | 1 | 0 |
| **Total** | **137** | **137** | **0** |

Antes de la suite completa también se ejecutaron juntos los tres specs que detectaban los defectos: `qa-permissions`, `qa-management` y `qa-boundaries`. El resultado fue **107/107 PASS**.

## Defectos cerrados

| Defecto | Estado | Corrección verificada |
| --- | --- | --- |
| BUG-001 | **Corregido y verificado** | Auditoría exige `ADMIN` tanto en la interfaz como en `GET /api/v1/admin/audit`; Encargado obtiene 403. |
| BUG-002 | **Corregido y verificado** | El modelo de lectura admite movimientos operativos `LOAN_OUT`, `RETURN_IN`, `LOSS`, `DISPOSAL` y `REACTIVATION`, sin permitirlos como ajustes manuales. Gestión de inventario conserva las secciones que sí cargaron si otra consulta falla. |
| BUG-003 | **Corregido y verificado** | Docente recibe la pantalla 403 al abrir directamente detalles de devolución o inspección, sin quedar en carga permanente. |
| BUG-004 | **Corregido y verificado** | El modal recibe foco, contiene la tabulación, cierra con Escape y devuelve el foco al control que lo abrió. |
| BUG-005 | **Corregido y verificado** | El menú móvil bloquea el scroll de `body`/`html` mientras permanece abierto y restaura el estilo al cerrar. |

## Regresión técnica

| Validación | Resultado |
| --- | --- |
| ESLint frontend | PASS |
| TypeScript frontend | PASS |
| TypeScript Cypress | PASS |
| Vitest frontend | 28/28 PASS en 14 archivos |
| Ruff backend | PASS |
| mypy backend | PASS en 29 archivos |
| pytest backend | 96 PASS, 2 integraciones opt-in omitidas; cobertura 82.57% |
| Cypress QA | 137/137 PASS en 9 specs |

No se ejecutó el build de producción ni se repitieron las dos integraciones opt-in en esta reverificación. Las integraciones habían pasado en el ciclo anterior y la suite Cypress ejercitó los servicios locales reales.

## Observaciones todavía pendientes

La regresión verde cierra los cinco bugs, pero no convierte automáticamente todos los casos manuales en PASS. Continúan parciales, entre otros: token vencido, distribución incorrecta por ubicación, preparación insuficiente/excesiva desde UI, CRUD académico completo, filtros combinados, secuencia completa de auditoría, concurrencia, revisión visual amplia, contraste y lector de pantalla.

El estado actualizado de cada caso está en la [matriz consolidada](./plan-pruebas-manuales.md#22-matriz-consolidada-de-esta-ejecución). Para retomar el trabajo usar la [hoja de arranque](./arranque-qa-2026-09-09.md).
