# Seguimiento de cierre del MVP

Actualizado: **7 de octubre de 2026**, America/Guayaquil.

Este es el tablero vigente. Los requisitos originales se conservan en el plan de alcance; sus casillas históricas no sustituyen este seguimiento.

**Regla de avance:** corregir un punto a la vez, comprobarlo, guardar evidencia y marcarlo antes de pasar al siguiente. `[x]` significa verificado en el alcance descrito; `[ ]` significa abierto. Un módulo con pruebas aprobadas puede conservar defectos en otros escenarios.

## Bloque 0 — Entorno y verificación inicial: completado

- [x] Docker y Supabase local operativos; 36 migraciones aplicadas.
- [x] Configuración local de frontend/backend coincidente con Supabase.
- [x] Compilación de producción, tipos y controles de calidad aprobados hoy.
- [x] 28 pruebas frontend y 96 backend aprobadas hoy.
- [x] Cypress: **137/137 aprobadas**, sin fallos, omisiones ni reintentos.
- [x] Integración real de autenticación, JWT y permisos aprobada.
- [x] Integración real de solicitud hasta devolución aprobada.
- [x] Base existente conservada: no se restauró ni reinició.

Evidencia: [resultado del flujo real](../qa/resultado-flujo-2026-10-07.md), [JSON Cypress](../qa/evidencia-cypress-2026-10-07.json) y [diagnóstico](../qa/diagnostico-retoma-2026-10-07.md).

## Flujo disponible y comprobado

- [x] Acceso/salida y navegación de Administrador, Encargado y Docente.
- [x] Creación/envío de solicitud con validaciones.
- [x] Aprobación total/parcial y rechazo con motivo.
- [x] Preparación e inspección de salida.
- [x] Token temporal y entrega, registrando quién retira.
- [x] Consulta del préstamo por el docente responsable.
- [x] Devolución parcial/final con stock y pendientes correctos.
- [x] Cierre de solicitud/préstamo e historial.
- [x] Daño de unidad, evidencia privada y mantenimiento correctivo.
- [x] Recuperación de inspección pendiente después de recargar.

Estas marcas corresponden a escenarios automatizados concretos; no certifican todos los criterios manuales de cada módulo.

## Bloque 1 — Reglas y permisos: completado en local

**Puntos 1.1 a 1.4 cerrados en local. Bloque 2 iniciado; siguiente: aprobaciones simultáneas sin sobre-reserva.** Ver los cierres de [R-02](../qa/cierre-r02-auditoria-2026-10-07.md), [R-01](../qa/cierre-r01-contrasena-temporal-2026-10-07.md), [R-03](../qa/cierre-r03-estados-unidades-2026-10-07.md) y [R-04](../qa/cierre-r04-responsable-auditoria-2026-10-07.md). La aceptación manual y el despliegue siguen pendientes.

| Orden | Estado | Punto | Criterio para cerrarlo |
| --- | --- | --- | --- |
| 1.1 | [x] | R-02: auditoría exclusiva de ADMIN también en Supabase | Migración 37 aplicada localmente; lectura directa probada con los tres roles y sin sesión; 141/141 Cypress |
| 1.2 | [x] | R-01: cambio obligatorio de contraseña temporal | Sin contraseña o reutilizando la temporal: rechazado; cambio, renovación de sesión y nuevo ingreso comprobados; 142/142 Cypress |
| 1.3 | [x] | R-03: estados de unidades protegidos | Edición bloqueada durante procesos pendientes; condición y artículo protegidos; devolución e historial comprobados; migración 38 y 146/146 Cypress |
| 1.4 | [x] | R-04: responsable en auditoría de unidades | Ediciones manuales con identidad, valores y fecha en la misma transacción; nombre y detalle visibles; 148/148 Cypress y migración 39 |

## Bloque 2 — Concurrencia, saldos y recuperación: en curso

- [x] R-07: entrega e inicio de mantenimiento simultáneos; defecto reproducido y corregido en local, ambos órdenes probados. [Cierre y evidencia](../qa/cierre-r07-entrega-mantenimiento-2026-10-07.md).
- [ ] Dos aprobaciones simultáneas sin sobre-reserva.
- [ ] Reserva/entrega/devolución duplicada sin duplicar movimientos.
- [ ] Expiración del token y distribución inválida por ubicación.
- [ ] Preparación insuficiente/excesiva desde interfaz.
- [ ] R-06: error recuperable cuando falla la identidad en detalle de solicitud.
- [ ] Recuperar y reenviar borradores sin duplicarlos tras fallar el envío.

## Bloque 3 — Funciones pendientes del MVP

- [ ] QR visible para Docente y escaneable por Encargado.
- [ ] Cancelación en estados permitidos, liberación de reservas y auditoría.
- [ ] Pérdidas/roturas por cantidad y cierre del saldo con trazabilidad.
- [ ] R-05: paginación, filtros y totales con más de 1000 registros.

## Bloque 4 — Aceptación manual y presentación: pendiente

- [ ] CRUD completo de artículos/unidades y configuración académica por interfaz.
- [ ] Alta de usuario, contraseña temporal y protección del último Administrador.
- [ ] Creación/cancelación de mantenimiento por interfaz.
- [ ] Métricas contrastadas con datos y revisión completa de reportes.
- [ ] Secuencia de auditoría con actor, acción y valores.
- [ ] Móvil/tablet/escritorio: tablas, formularios y modales de todos los módulos.
- [ ] Teclado, foco, contraste y lector de pantalla.
- [ ] Carga, vacío, error y recuperación en todos los módulos.
- [ ] Textos antiguos y documentación de pantallas actualizados.

La [matriz manual histórica](../qa/plan-pruebas-manuales.md) conserva los criterios detallados. No convertir sus casos PARCIAL a PASS automáticamente por tener la suite verde.

## Bloque 5 — Despliegue y entrega: pendiente

- [ ] Unificar configuración e instrucciones de despliegue.
- [ ] Verificar Auth, CORS, rutas API, permisos de base y Storage en entorno de prueba.
- [ ] Ejecutar el ciclo completo desplegado con datos representativos.
- [ ] Documentar operación, respaldo y recuperación.
- [ ] Cerrar el MVP sin defectos altos; cada pendiente debe estar cerrado o excluido explícitamente del alcance.

## Registro de avances

| Fecha | Avance | Evidencia |
| --- | --- | --- |
| 2026-10-07 | Diagnóstico inicial; compilación y pruebas unitarias aprobadas | Diagnóstico técnico |
| 2026-10-07 | Bloque 0 completado; flujo real y regresión aprobados | 137/137 Cypress y 2/2 integraciones |
| 2026-10-07 | R-02 confirmado en base activa; sigue abierto | Lectura con identidad MANAGER en transacción revertida |
| 2026-10-07 | R-02 corregido y cerrado en local; siguiente R-01 | Regresión falla antes y pasa después; 141/141 Cypress; migraciones alineadas |
| 2026-10-07 | R-01 corregido y cerrado en local; siguiente R-03 | 109 backend, 32 frontend y 142/142 Cypress; cambio real y sesión renovada comprobados |
| 2026-10-07 | R-03 corregido y cerrado en local; siguiente R-04 | 4 pruebas fallan antes y pasan después; 146/146 Cypress, 120 backend, 32 frontend; migración 38 alineada |

| 2026-10-07 | R-04 cerrado en local; bloque 1 completo | 148/148 Cypress; fallo de auditoría revierte edición; 39 migraciones alineadas |

| 2026-10-07 | R-07 cerrado en local; siguiente aprobaciones simultáneas | Dos conexiones coordinadas; 150/150 Cypress; 40 migraciones alineadas |

El bloque inicial no cambió código funcional. El cierre de R-02 añade la migración de permisos y las pruebas de regresión. El cierre de R-01 coordina el cambio real de contraseña desde el servidor y renueva la sesión en la interfaz. El cierre de R-03 protege la edición de unidades con la migración 38 y pruebas de los flujos reales. El cierre de R-04 atribuye las ediciones manuales y muestra su detalle en auditoría. El cierre de R-07 serializa la validación de mantenimiento con la entrega sobre la misma unidad. Las cuentas y recursos QA permanecen identificables en la base local; no son datos para producción.
