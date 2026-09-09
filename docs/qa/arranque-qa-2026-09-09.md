# Arranque de QA — actualizado el 9 de septiembre de 2026

Esta es la hoja de trabajo para retomar el proyecto. La regresión automatizada actual está **aprobada: 137/137 comprobaciones Cypress pasan**. Los cinco defectos detectados el 8 de septiembre quedaron corregidos y verificados; no hay fallos automatizados conocidos pendientes de corregir.

El resultado completo está en el [informe de reverificación](./resultado-reverificacion-2026-09-09.md). El [informe del 8 de septiembre](./resultado-qa-2026-09-08.md) se conserva como evidencia histórica y la [matriz del plan manual](./plan-pruebas-manuales.md#22-matriz-consolidada-de-esta-ejecución) separa lo aprobado de los criterios todavía parciales.

## Defectos de la ejecución anterior

| Prioridad | Defecto | Estado | Verificación |
| --- | --- | --- | --- |
| P0 | BUG-001 | Corregido y verificado | `qa-permissions.cy.ts`: Auditoría 200 para Administrador y 403 para Encargado/Docente. |
| P1 | BUG-002 | Corregido y verificado | `qa-management.cy.ts`: movimientos operativos y recarga de catálogos pasan. |
| P1 | BUG-003 | Corregido y verificado | `qa-boundaries.cy.ts`: Docente recibe 403 sin carga permanente. |
| P2 | BUG-004 | Corregido y verificado | `qa-boundaries.cy.ts`: foco inicial, Escape y restauración pasan. |
| P2 | BUG-005 | Corregido y verificado | `qa-boundaries.cy.ts`: scroll de fondo bloqueado. |

Las expectativas que detectaron los defectos no se relajaron ni se omitieron.

## Comandos de inicio

Con Docker Desktop abierto, usar tres terminales. No es necesario reiniciar la base:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
./frontend/node_modules/.bin/supabase start
```

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia/backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run dev:frontend
```

Si se quiere restaurar/actualizar únicamente el demo local, ejecutar `npm run seed:demo` desde la raíz. Para validar sin reiniciar la base:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run test:qa -- --config retries=0
```

`test:qa` reutiliza los servicios locales y añade registros identificados como `QA`/`Cypress`. `test:e2e` sí restablece la base local; no usarlo mientras se esté revisando un escenario creado manualmente.

## Credenciales locales de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `axel@gmail.com` | `axelaxel` |
| Encargado | `encargado@gastronomia.test` | `Prueba-Encargado-2026!` |
| Docente | `docente@gastronomia.test` | `Prueba-Docente-2026!` |

Son cuentas exclusivas del entorno local creadas/actualizadas por `npm run seed:demo`.

## Validación antes de cerrar el próximo cambio

1. Ejecutar el spec asociado al defecto y confirmar que pasa.
2. Ejecutar las pruebas unitarias del área modificada.
3. Ejecutar al final la suite completa:

```bash
npm run test:qa -- --config retries=0
```

4. Actualizar el informe y la matriz de QA con la fecha y el resultado real.

## Qué falta para el cierre manual completo

No quedan bugs abiertos de esta ejecución. Sí quedan criterios `PARCIAL` del plan: token vencido, distribución incorrecta por ubicación, preparación incompleta/excesiva, CRUD académico completo, filtros combinados, secuencia completa de auditoría, concurrencia, revisión visual amplia, contraste y lector de pantalla.
