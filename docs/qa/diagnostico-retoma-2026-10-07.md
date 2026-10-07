# Diagnóstico para retomar Gastronomía — 7 de octubre de 2026

Base revisada: `main`, commit `c86b50f`. El árbol de trabajo estaba limpio al iniciar.

> **Actualización posterior del mismo día:** Docker ya está operativo. Pasaron 137/137 comprobaciones Cypress y las dos integraciones reales; R-02 se confirmó en la base activa. Ver el [resultado del flujo](./resultado-flujo-2026-10-07.md) y el [seguimiento vigente](../roadmap/seguimiento-cierre-mvp.md). Los apartados siguientes conservan el alcance y las limitaciones de la revisión inicial.

El proyecto tiene implementado el núcleo del MVP y supera las comprobaciones técnicas locales. Está en una etapa de corrección y cierre funcional, pero todavía no hay evidencia suficiente para declararlo listo para producción. No hace falta reconstruirlo. Conviene proteger primero las reglas de negocio, completar los flujos pendientes y repetir la aceptación con los tres roles.

Esta revisión no modifica la aplicación, las migraciones ni los datos. Se añade únicamente este informe. Los hallazgos SQL describen las migraciones del repositorio; no se verificó su estado aplicado en una base remota.

## 1. Verificación realizada hoy

| Comprobación | Resultado |
| --- | --- |
| ESLint frontend | Aprobado |
| Tipos Next.js y TypeScript | Aprobado |
| Vitest | 28 pruebas aprobadas, 14 archivos |
| Compilación de producción | Aprobada con Next.js 16.3.1 y Webpack |
| Tipos de Cypress | Aprobado |
| Ruff backend | Aprobado |
| mypy backend | Aprobado, 29 archivos |
| pytest backend | 96 aprobadas, 2 integraciones omitidas por ser opt-in |
| Cobertura Python | 82,57 %, por encima del mínimo configurado de 80 % |
| Inspección de migraciones | 36 archivos; las 39 tablas públicas creadas tienen activación explícita de RLS; las vistas detectadas usan `security_invoker` |
| Búsqueda limitada de secretos | Sin coincidencias de claves `sb_secret_` ni JWT completos en los archivos actualmente versionados. No equivale a una auditoría del historial ni del despliegue |
| Navegador | Pantalla de acceso renderizada desde la compilación de producción; no se certificó navegación autenticada |
| Cypress y flujo real con base local | No ejecutados hoy: Docker no está operativo |

Las variables locales de frontend y backend apuntan a servicios locales. Supabase y FastAPI estaban apagados. Docker no respondió y macOS rechazó abrir `/Applications/Docker.app` con `kLSNoExecutableErr`, indicando que falta el ejecutable de la aplicación. No se reinstaló Docker ni se reinició/restauró ninguna base.

La evidencia anterior sigue siendo útil: el [informe del 9 de septiembre](./resultado-reverificacion-2026-09-09.md) registra 137/137 comprobaciones Cypress aprobadas. Ese resultado es histórico, no una ejecución de hoy, y ya advertía que la aceptación manual estaba incompleta.

## 2. Qué existe

| Área | Estado observado |
| --- | --- |
| Acceso y usuarios | Inicio de sesión, roles, alta con contraseña temporal, cambio de contraseña, activación/desactivación |
| Configuración académica | Períodos, materias, docentes, secciones y laboratorios con pantallas y API |
| Inventario | Categorías, ubicaciones, artículos por cantidad, unidades individuales, stock, movimientos y hoja de vida |
| Solicitudes | Creación, envío, consulta propia, revisión, aprobación total/parcial y rechazo |
| Operación | Reserva transaccional, preparación, inspección de salida, token de entrega y préstamo |
| Devoluciones | Totales/parciales, saldos pendientes, inspecciones recuperables y evidencias |
| Novedades y mantenimiento | Novedades vinculadas a unidades inspeccionadas; mantenimiento y cierre/cancelación de mantenimiento |
| Consulta | Paneles por rol, reportes operativos, kardex e interfaz de auditoría |
| Calidad | Pruebas unitarias, integración opt-in, Cypress y flujo de CI versionado |

La presencia de un módulo no implica que todos sus escenarios estén certificados. El rol Estudiante sigue siendo una propuesta futura y queda fuera del MVP original.

## 3. Hallazgos prioritarios

### R-01 · Alta · El cambio obligatorio de contraseña se puede dar por completado sin cambiarla

`backend/app/api/v1/endpoints/auth.py:37` acepta `POST /auth/password-change-complete` con un usuario autenticado, sin recibir ni comprobar una nueva contraseña. `backend/app/core/admin.py:253` cambia directamente `must_change_password` a `false` mediante la API administrativa. La interfaz sí cambia primero la contraseña, pero el servidor confía en que el cliente haya hecho ese paso.

**Impacto:** quien tenga la contraseña temporal puede llamar directamente al endpoint, renovar su sesión y continuar usando la contraseña temporal sin cumplir la regla obligatoria.

**Evidencia de hoy:** reproducción aislada con `TestClient`, identidad temporal simulada y HTTP externo sustituido por un mock: respuesta 204 y una llamada cuyo único cambio es `{"app_metadata":{"must_change_password":false}}`. No se cambió ninguna cuenta real.

**Cierre esperado:** el servidor debe comprobar o realizar el cambio antes de retirar la obligación. Añadir prueba negativa de llamada directa sin cambio y positiva del flujo completo con renovación de sesión.

### R-02 · Alta · El permiso de auditoría no coincide entre la API y Supabase

> **Corregido y verificado posteriormente en local:** migración 37, acceso directo con los tres roles y sin sesión, y 141/141 comprobaciones Cypress aprobadas. Ver [cierre R-02](./cierre-r02-auditoria-2026-10-07.md). Lo siguiente describe el defecto original.

`backend/app/api/v1/endpoints/audit.py:8` y la pantalla permiten únicamente `ADMIN`. Sin embargo, `supabase/migrations/20260821200142_operational_audit_and_history_views.sql:106` concede lectura de `operational_audit_log` a `authenticated`, y la política de la línea 112 permite tanto `ADMIN` como `MANAGER`. No hay una migración posterior que la restrinja.

**Impacto:** con las migraciones versionadas aplicadas, un Encargado puede consultar directamente la tabla mediante la Data API de Supabase usando su propia sesión, aunque FastAPI devuelva 403. El arreglo histórico de BUG-001 cubrió interfaz y API, pero no este acceso directo.

**Cierre esperado:** alinear RLS con la política ADMIN y probar los tres roles tanto contra FastAPI como contra la Data API. Hallazgo confirmado en código; falta comprobarlo contra la base activa.

### R-03 · Alta · La edición de unidades permite saltarse préstamos, devoluciones y mantenimiento

`frontend/src/app/dashboard/inventory/manage/page.tsx:326` permite elegir libremente Disponible, Prestado, Mantenimiento y Fuera de servicio. `backend/app/api/v1/endpoints/inventory.py:175` recibe el mismo modelo usado para creación y `backend/app/core/inventory.py:415` lo envía como actualización directa privilegiada. Los triggers versionados no validan esas transiciones contra préstamos o mantenimientos abiertos.

Además, el modelo acepta `status=AVAILABLE` junto con `condition=DAMAGED`; se verificó esa aceptación de forma aislada. El cálculo de disponibilidad cuenta unidades activas con estado AVAILABLE sin excluir esa condición.

**Impacto:** editar una unidad prestada a Disponible deja el préstamo abierto y puede impedir su devolución, porque esa operación exige estado LOANED; también permite devolver disponibilidad a una unidad dañada o en mantenimiento sin completar su flujo. Cambiar el artículo asociado puede alterar la interpretación de su historial.

**Cierre esperado:** separar edición de datos descriptivos de transiciones operativas. Proteger las reglas en servidor/base, incluyendo préstamos, preparación activa, inspección pendiente, mantenimiento, condición y cambios de artículo. Verificar con préstamos reales; ocultar opciones en la interfaz por sí solo no basta.

### R-04 · Media · Los cambios manuales de unidades pierden al responsable en auditoría

El trigger `private.audit_inventory_unit_change`, en `supabase/migrations/20260821200142_operational_audit_and_history_views.sql:37`, inserta el evento sin `performed_by_user_id`. La ruta de actualización tampoco transmite al actor a una operación transaccional. La pantalla muestra «Sistema» cuando ese campo está vacío.

**Impacto:** una modificación hecha por un Encargado o Administrador conserva los valores anterior y nuevo, pero no permite responder quién la hizo. Esto incumple parte de la trazabilidad exigida.

**Cierre esperado:** registrar el usuario autenticado dentro de la misma operación y comprobar nombre/identidad, fecha y valores antes/después en auditoría.

### R-05 · Media · Reportes y listados pueden quedar incompletos al crecer los datos

`supabase/config.toml:18` establece `max_rows=1000`. `backend/app/core/reports.py:9` y `backend/app/core/inventory.py:393` hacen una sola consulta sin paginación ni total. Varias pantallas calculan métricas a partir de la longitud de esas listas.

**Impacto:** con más de 1000 filas y esa configuración, reportes e inventario pueden omitir registros sin advertencia y las métricas dejan de representar el total. Es un riesgo condicionado al volumen, no una pérdida de datos observada hoy.

**Cierre esperado:** paginación y totales explícitos; filtros en servidor. Validar con un conjunto que supere el límite, especialmente kardex e historial.

### R-06 · Media · El detalle de solicitud puede quedar cargando cuando falla la identidad

En `frontend/src/app/dashboard/requests/[id]/page.tsx:107`, la condición de carga incluye `!detail && !error` antes de comprobar `identity.status === "unavailable"`. Si no se puede verificar la sesión, no hay token, no se inicia la consulta y se sigue mostrando «Cargando solicitud…».

**Cierre esperado:** resolver primero el estado de identidad no disponible y ofrecer recuperación. Verificar el detalle con fallo de consulta de identidad; no asumir que los arreglos previos de devoluciones cubren esta pantalla.

### R-07 · Media · Revisar la concurrencia entre entrega e inicio de mantenimiento

`supabase/migrations/20260821195707_maintenance_operations.sql:40` comprueba que una unidad no está prestada con un SELECT sin bloqueo. Luego la actualización solo exige que no esté ya en MAINTENANCE. Una entrega concurrente puede cambiarla a LOANED entre ambas operaciones, y el mantenimiento sobrescribir ese estado.

**Estado:** riesgo identificado por inspección del orden de consultas; no reproducido con dos transacciones reales por falta de base local. No presentarlo como un fallo ejecutado.

**Cierre esperado:** bloquear y validar la misma unidad dentro de la operación; reproducir entrega y mantenimiento simultáneos y comprobar que solo una operación incompatible prospera.

## 4. Funciones pendientes o incompletas

1. **QR completo.** Existe un token aleatorio, con expiración y uso único, pero la entrega lo muestra como texto (`frontend/src/app/dashboard/deliveries/[id]/page.tsx:339`). Falta la imagen QR, el acceso del docente a su QR y la lectura por el Encargado desde teléfono/tablet. El requisito describe ese recorrido, no solo generar un token internamente.
2. **Cancelación de solicitudes/reservas.** El plan la mantiene pendiente y no existe una ruta de cancelación de solicitudes. Definir estados permitidos, responsable, motivo, liberación de recursos preparados y auditoría; implementar la operación de forma atómica.
3. **Pérdidas y novedades por cantidad.** Las novedades actuales requieren un detalle de inspección asociado a una unidad individual. Los tipos LOSS/DISPOSAL/REACTIVATION existen en el enum de movimientos, pero el ajuste manual solo admite stock inicial y ajustes de entrada/salida. Falta cerrar funcionalmente cómo registrar utensilios perdidos o rotos por cantidad y resolver el saldo del préstamo con trazabilidad, sin simular una devolución física.
4. **Recuperación de borradores.** Hay creación y envío por API, pero la pantalla de nueva solicitud los ejecuta consecutivamente. Si falla el envío tras guardar el borrador, hay que comprobar cómo retomarlo; el detalle actual no ofrece edición/envío del borrador. Evitar duplicarlo al reintentar.
5. **Presentación de reportes y estados.** La pantalla de reportes deriva columnas de las claves de la respuesta. Revisar nombres legibles, fechas, identificadores, filtros y lectura en móvil. En nueva novedad todavía aparece un texto que promete inspección y evidencias «en el siguiente bloque», aunque ya existen.

## 5. Documentación que puede confundir al retomar

- El roadmap sigue marcando pendientes los paneles docente/encargado y la auditoría de entrega, aunque existen implementación y evidencia posterior. No usar sus casillas como porcentaje de avance.
- La matriz de QA manual sí conserva pendientes reales: concurrencia, expiración del token, distribución por ubicación, preparación insuficiente/excesiva, CRUD completo desde interfaz, secuencia de auditoría, accesibilidad y revisión responsive.
- README y guía describen dos proyectos Vercel, mientras `vercel.json` en la raíz describe servicios frontend/backend con un rewrite. Antes del despliegue hay que elegir y validar la configuración efectiva, variables, prefijos de API y CORS. La revisión local no certifica un despliegue remoto.
- `npm run test:e2e` ejecuta `supabase db reset --local`. Para retomar sin borrar datos locales, usar el recorrido de `test:qa` una vez arrancados los servicios y verificadas las variables. Esa suite sí crea/modifica datos de prueba identificables.

## 6. Orden de trabajo propuesto

| Bloque | Trabajo | Criterio de cierre |
| --- | --- | --- |
| 1. Entorno reproducible | Recuperar Docker, iniciar Supabase/FastAPI, conservar la base existente | Inicio de sesión real con los tres roles y verificación de migraciones |
| 2. Reglas y seguridad | R-01, R-02, R-03 y R-04 | Pruebas negativas de acceso y estados; operaciones con responsable registrado |
| 3. Concurrencia y saldos | R-07, reservas simultáneas, entregas/devoluciones duplicadas y pérdidas | Ninguna doble asignación, saldo negativo ni unidad incoherente |
| 4. Completar operación | QR, cancelación y recuperación de borradores | Recorrido completo desde teléfono y escritorio, incluyendo cancelación y recuperación |
| 5. Cierre de interfaz | R-05/R-06, métricas, reportes, textos, responsive, teclado y estados de error | Matriz de aceptación actualizada con evidencia por criterio |
| 6. Despliegue de prueba | Unificar configuración, validar claves/CORS/Auth y documentar operación | Flujo completo en el entorno desplegado, con datos representativos |

El primer bloque técnico a corregir es la integridad de inventario junto con los permisos y la contraseña temporal. Después conviene recorrer juntos Docente → Encargado → entrega → devolución y cerrar cada pendiente con evidencia. El código que hoy compila y pasa pruebas ofrece una base aprovechable; el cierre depende de esas reglas y recorridos, no de añadir más módulos.
