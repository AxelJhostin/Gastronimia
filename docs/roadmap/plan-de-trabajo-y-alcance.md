# Plan de trabajo, alcance y control del MVP

Este documento define exactamente qué se construirá, en qué orden y qué debe comprobarse antes de dar el proyecto por terminado. Es la referencia de control para evitar funcionalidades improvisadas, crecimiento innecesario del alcance y trabajo que no aporte al ciclo principal del sistema.

## 1. Objetivo del MVP

Entregar una aplicación web responsive que permita controlar de forma trazable el ciclo completo:

```text
Inventario → Solicitud → Disponibilidad → Reserva → Preparación
→ Entrega → Préstamo → Devolución → Inspección
→ Novedad/Mantenimiento → Kardex/Auditoría
```

El MVP estará terminado cuando una institución pueda responder de manera estructurada:

- qué artículos tiene y en qué estado están;
- qué recursos están disponibles para una fecha y horario;
- quién solicitó y qué docente es responsable;
- quién retiró y quién entregó;
- qué salió, qué regresó y qué quedó pendiente;
- qué daños, faltantes o novedades existieron;
- qué unidades están en mantenimiento;
- quién realizó cada operación.

## 2. Cómo usar este documento

Cada tarea debe marcarse así:

- `[ ]` Pendiente.
- `[~]` En progreso.
- `[x]` Terminada y verificada.
- `[!]` Bloqueada, con el motivo escrito en la tarea o en el pull request.

Una fase no se considera terminada porque el código exista. Debe cumplir sus criterios de salida, tener pruebas proporcionales al riesgo y pasar la revisión de la otra integrante.

## 2.1 Forma de trabajo del equipo

El equipo está formado por:

- **Axel**
- **Shoma (La del buen front)**

La división no es por persona ni por especialidad fija. Cualquiera puede tomar tareas de frontend o backend según la fase, disponibilidad y complejidad del trabajo. La responsabilidad se asigna por tarea o pull request, no por una propiedad permanente del área.

Supabase —base de datos, migraciones, RLS, Auth y Storage— queda inicialmente como responsabilidad principal tentativa de Axel, pero debe revisarse entre ambos antes de integrar cambios de seguridad, esquema o permisos.

Reglas de colaboración:

- Cada tarea debe indicar quién la ejecuta y quién la revisa.
- Una persona puede implementar frontend y la otra revisar backend, o al contrario.
- Nadie debe modificar contratos de API, migraciones o políticas RLS sin avisar en el pull request.
- Las tareas de frontend y backend deben coordinarse mediante contratos escritos, no mediante suposiciones.
- Si una persona termina una tarea antes, puede tomar otra área sin crear una frontera artificial.
- La revisión cruzada sigue siendo obligatoria aunque ambas personas puedan trabajar en cualquier capa.

## 3. Reglas de alcance

### Sí se puede hacer

- Lo que esté incluido en las fases de este documento.
- Correcciones necesarias para seguridad, integridad, accesibilidad, rendimiento o funcionamiento del alcance aprobado.
- Mejoras técnicas internas que no cambien el comportamiento ni agreguen módulos.

### No se debe hacer todavía

- Agregar módulos por intuición o porque parezcan interesantes.
- Diseñar compras, proveedores, contabilidad, multas, pagos, recetas o recursos humanos.
- Crear cuentas propias para estudiantes en el MVP.
- Crear aplicaciones móviles nativas.
- Añadir IA, RFID, IoT, reconocimiento de daños o chat interno.
- Crear un segundo flujo para resolver el mismo problema sin justificarlo.
- Perfeccionar dashboards o animaciones antes de cerrar los flujos operativos.

Si una idea no responde directamente al ciclo del MVP, se registra como propuesta futura y no entra en el trabajo actual.

## 4. Fases de implementación

### Fase 0 — Base técnica y reglas del proyecto

Estado inicial: `[x]` Base creada; `[ ]` cierre de fase.

- `[x]` Separar `frontend`, `backend`, `docs` y `supabase/migrations`.
- `[x]` Crear frontend Next.js con TypeScript estricto.
- `[x]` Crear backend FastAPI con API versionada.
- `[x]` Crear plantillas de variables de entorno.
- `[x]` Crear README, guías técnicas y guía de uso de skills.
- `[x]` Configurar lint, typecheck, pruebas y CI.
- `[x]` Verificar endpoint de salud del backend.
- `[ ]` Confirmar que ambas integrantes pueden clonar, configurar e iniciar el proyecto.
- `[ ]` Confirmar la primera asignación temporal de tareas entre Axel y Shoma (La del buen front).

Criterio de salida:

- Frontend y backend arrancan localmente.
- Las validaciones automáticas pasan.
- Ambas integrantes entienden dónde agregar código y documentación.

### Fase 1 — Contratos, seguridad y Supabase

- `[x]` Crear o confirmar el proyecto compartido de Supabase.
- `[ ]` Definir convenciones de nombres, fechas, zonas horarias e identificadores.
- `[x]` Crear la migración inicial de extensiones, enums/checks y funciones auxiliares.
- `[x]` Crear tablas de usuarios, roles y perfiles docentes.
- `[x]` Definir RLS por rol: administrador, encargado y docente.
- `[~]` Definir políticas de Storage privado para evidencias. Bucket privado y políticas RLS aplicados y verificados; falta prueba con dos cuentas reales.
- `[~]` Crear tipos o contratos compartidos para respuestas de la API. Contratos iniciales de Auth, administración y configuración académica listos.
- `[~]` Documentar qué operaciones usan RPC/transacción. `replace_user_roles` queda documentada e implementada; faltan los flujos operativos.
- `[~]` Probar que una cuenta no puede leer ni modificar información ajena. Cubiertos JWT/RLS sin sesión y denegación por rol; falta prueba entre dos cuentas reales.

Criterio de salida:

- La base se puede levantar desde migraciones versionadas.
- No existe una tabla expuesta sin RLS o permisos mínimos.
- Las claves privilegiadas solo están en el backend.
- La autenticación y autorización tienen pruebas de acceso permitido y denegado.

### Fase 2 — Autenticación y configuración académica

- `[~]` Implementar inicio y cierre de sesión con Supabase Auth. Cliente SSR, formulario de inicio y cierre de sesión listos; falta prueba manual con una cuenta real.
- `[~]` Implementar protección de rutas en Next.js. El panel usa `getClaims()` validado y el proxy renueva cookies; falta prueba manual de redirección con sesión expirada.
- `[x]` Resolver el rol del usuario de forma segura desde la base de datos.
- `[~]` Crear gestión de usuarios y asignación de roles para administrador. Migración, API y RPC aplicadas; falta crear/probar el primer ADMIN real.
- `[~]` Crear periodos académicos. Migración, RLS y endpoints administrativos aplicados; falta probar el flujo real.
- `[~]` Crear asignaturas. Migración, RLS y endpoints administrativos aplicados; falta probar el flujo real.
- `[~]` Crear cursos/paralelos asociados a docente y periodo. Migración, RLS y endpoints administrativos aplicados; falta probar el flujo real.
- `[~]` Crear laboratorios. Migración, RLS y endpoints administrativos aplicados; falta probar el flujo real.
- `[ ]` Aplicar permisos por pantalla y por operación.

Criterio de salida:

- Cada rol llega únicamente a sus funciones.
- Un docente puede ver su contexto académico.
- Un administrador puede configurar los datos base.
- Los intentos de acceso no autorizado son rechazados por frontend y backend.

### Fase 3 — Inventario

- `[~]` Crear categorías y ubicaciones. Creación, consulta, edición y desactivación lógica listas; falta prueba real.
- `[~]` Crear artículos controlados por cantidad. Modelo `QUANTITY` y endpoints administrativos listos; falta registrar movimientos y probar flujo real.
- `[~]` Crear artículos individualizados. Modelo `INDIVIDUAL`, validación de unidades y endpoints administrativos listos; falta probar flujo real.
- `[~]` Crear, editar, desactivar y consultar unidades físicas. Operaciones administrativas y restricciones de integridad listas; falta prueba real.
- `[ ]` Registrar condición física y disponibilidad separadamente.
- `[~]` Validar cantidades no negativas. RPC transaccional y saldo por ubicación listos; falta prueba real de concurrencia.
- `[~]` Registrar entradas y ajustes iniciales. Endpoint y kardex atómico para `INITIAL_STOCK`, `ADJUSTMENT_IN` y `ADJUSTMENT_OUT` listos; falta prueba real.
- `[~]` Registrar movimientos de inventario. Kardex inmutable para artículos `QUANTITY` listo; faltan movimientos de préstamos/devoluciones y unidades individuales.
- `[~]` Crear vista de stock actual. Vista protegida y endpoint administrativo listos; falta prueba real.
- `[~]` Crear historial básico por unidad. Hoja de vida automática y endpoint de consulta listos; falta prueba real.
- `[ ]` Diseñar interfaz operativa para escritorio, tablet y teléfono.

Criterio de salida:

- Se pueden representar utensilios por cantidad y equipos por unidad.
- Una unidad dada de baja o deshabilitada no se puede prestar.
- El stock actual puede explicarse mediante movimientos y estados.
- El encargado puede encontrar un artículo o unidad sin recorrer pantallas innecesarias.

### Fase 4 — Disponibilidad temporal

- `[~]` Implementar consulta por artículo, fecha y horario. RPC y endpoint administrativo listos; falta prueba real con datos.
- `[~]` Considerar existencia física, reservas, préstamos, mantenimiento y bajas. La base actual considera stock, unidades activas, mantenimiento y bajas; reservas y préstamos se descuentan al implementar sus flujos operativos.
- `[~]` Separar el cálculo para artículos por cantidad y unidades individuales. La consulta suma stock para `QUANTITY` y cuenta unidades activas `AVAILABLE` para `INDIVIDUAL`.
- `[~]` Validar intervalos inválidos. API y RPC rechazan intervalos sin duración positiva.
- `[~]` Evitar disponibilidad negativa. Las reservas activas se descuentan de la consulta y la transacción rechaza compromisos que excedan el saldo; falta prueba real de concurrencia.
- `[~]` Crear pruebas de intervalos superpuestos, consecutivos y sin conflicto. Cubierto por lógica transaccional; falta ejecutar casos reales con datos.
- `[~]` Preparar la revalidación transaccional del servidor. La aprobación crea reservas en la misma transacción y usa bloqueos por artículo; falta prueba real de concurrencia.

Criterio de salida:

- La interfaz muestra disponibilidad preliminar.
- El backend vuelve a calcular la disponibilidad al aprobar.
- Dos operaciones concurrentes no pueden sobre-reservar el mismo recurso.

### Fase 5 — Solicitudes

- `[~]` Permitir al docente crear un borrador. API y RPC transaccional listas; falta prueba real con un perfil docente.
- `[~]` Seleccionar asignatura/curso, laboratorio, fecha y horario. La base valida que el curso activo pertenece al docente y que el laboratorio e intervalo son válidos.
- `[~]` Seleccionar artículos y cantidades. El borrador incorpora los ítems en la misma transacción; se validan artículos activos y cantidades enteras para unidades individuales.
- `[~]` Mostrar disponibilidad durante la creación. La consulta de disponibilidad ya admite docentes autenticados; falta integración de interfaz y prueba real.
- `[~]` Enviar solicitud a estado `PENDING`. RPC controlada por propietario e ítems mínimos lista; falta prueba real.
- `[~]` Permitir consultar solicitudes propias. Endpoint de listado propio listo; falta detalle e interfaz.
- `[~]` Permitir al encargado revisar solicitudes pendientes. Endpoint administrativo de listado listo; falta interfaz y prueba real.
- `[~]` Permitir aprobar completamente. RPC transaccional valida estado, propietario revisor, cantidades solicitadas y disponibilidad actual; falta crear reservas en Fase 6 y prueba real.
- `[~]` Permitir aprobar parcialmente. Cada ítem debe recibir una cantidad aprobada entre cero y lo solicitado; el estado se deriva de forma automática.
- `[~]` Permitir rechazar con motivo. RPC y endpoint exigen un motivo no vacío; falta prueba real.
- `[~]` Registrar revisión y auditoría. Se guarda revisor, estado previo, decisión, motivo y fecha; falta exponer el detalle en interfaz.

Criterio de salida:

- Toda solicitud tiene docente, contexto académico, intervalo y detalles válidos.
- La aprobación no excede lo solicitado ni lo disponible.
- El docente puede entender claramente el estado y motivo de su solicitud.

### Fase 6 — Reservas y preparación

- `[~]` Crear reservas al aprobar. Trigger transaccional crea reserva y detalles para cantidades aprobadas; falta prueba real.
- `[ ]` Liberar reservas al cancelar cuando la política lo permita.
- `[~]` Implementar estados de solicitud y transiciones válidas. `DRAFT → PENDING → APPROVED/PARTIALLY_APPROVED/REJECTED` está controlado por RPC; faltan cancelación, preparación y entrega.
- `[~]` Iniciar preparación solo desde una solicitud aprobada. RPC requiere solicitud aprobada y reserva activa; falta prueba real.
- `[~]` Seleccionar unidades individuales cuando corresponda. Las unidades deben estar activas, disponibles y no seleccionadas en un intervalo superpuesto; falta prueba real.
- `[~]` Registrar cantidades preparadas. La preparación admite registros parciales por detalle reservado; falta interfaz y prueba real.
- `[~]` Impedir preparar más de lo aprobado. La RPC bloquea cualquier cantidad acumulada superior a la reserva.
- `[~]` Finalizar preparación en estado `PREPARED`. Solo permite cerrar cuando todos los detalles reservados están completos y las unidades individuales fueron seleccionadas.

Criterio de salida:

- Una solicitud aprobada tiene recursos comprometidos.
- El encargado sabe exactamente qué debe preparar.
- No se puede entregar una solicitud incompleta o no preparada.

### Fase 7 — QR y entrega

- `[~]` Generar QR asociado a la solicitud. Endpoint y RPC generan token efímero para solicitudes `PREPARED`; falta interfaz visual QR y prueba real.
- `[~]` Usar un identificador/token verificable, sin información sensible. Solo se persiste el hash del token, expira en 30 minutos y se consume una vez.
- `[ ]` Permitir leer el QR desde teléfono o tablet.
- `[~]` Validar estado antes de entregar. La RPC exige QR válido y solicitud `PREPARED`.
- `[~]` Registrar docente responsable. Se deriva de la solicitud y se guarda en el préstamo.
- `[~]` Registrar persona que retira: docente, estudiante u otra. Se registra nombre obligatorio al entregar.
- `[~]` Registrar encargado que entrega. Se registra el usuario ADMIN/MANAGER responsable.
- `[~]` Crear préstamo y detalles. Operación atómica con detalles por ubicación y unidades físicas.
- `[~]` Cambiar unidades a `LOANED` cuando corresponda. Se actualizan las unidades preparadas al confirmar entrega.
- `[~]` Consumir reservas. La reserva se marca `CONSUMED` al crear el préstamo.
- `[~]` Crear movimiento `LOAN_OUT`. Cada salida `QUANTITY` por ubicación queda en kardex.
- `[ ]` Auditar la entrega.

Criterio de salida:

- Solo una solicitud preparada puede convertirse en préstamo.
- El docente responsable no se confunde con la persona que retira.
- La operación es atómica: no puede quedar entrega parcial por error técnico.

### Fase 8 — Préstamos y devoluciones

- `[x]` Mostrar préstamos activos y vencidos. El listado expone préstamos `ACTIVE` y `PARTIALLY_RETURNED` con `is_overdue`, calculado frente al fin programado de la solicitud.
- `[x]` Mostrar cantidades y unidades pendientes. Un endpoint dedicado calcula cantidades prestadas/devueltas/pendientes y unidades físicas aún no devueltas.
- `[x]` Registrar quién devuelve.
- `[x]` Registrar quién recibe.
- `[x]` Permitir devoluciones parciales.
- `[x]` Impedir devolver más de lo prestado.
- `[x]` Crear `return` y `return_details`.
- `[x]` Crear movimiento `RETURN_IN`.
- `[x]` Actualizar estados de unidades y stock. Las unidades devueltas pasan a `AVAILABLE` y dejan de bloquear preparaciones futuras.
- `[x]` Actualizar el estado del préstamo. Estados: `ACTIVE`, `PARTIALLY_RETURNED` y `CLOSED`.
- `[x]` Cerrar la solicitud cuando corresponda. Se cierra al cuadrar todas las cantidades y unidades del préstamo.
- `[x]` Auditar la devolución. Quedan registrados emisor, receptor, fecha y movimientos de inventario.

Criterio de salida:

- Se puede devolver por partes sin perder pendientes.
- Las cantidades devueltas siempre cuadran con lo prestado.
- Se puede identificar a las personas de cada operación.

### Fase 9 — Inspecciones, novedades y evidencias

- `[x]` Registrar inspección previa y de devolución. La entrega exige inspección previa; cada devolución de unidades se inspecciona por separado.
- `[x]` Comparar condición de salida y de regreso.
- `[x]` Registrar faltantes, daños, roturas, suciedad, incompletos, desgaste y fallas.
- `[x]` Registrar severidad y descripción.
- `[x]` Crear seguimiento de novedades. Las novedades se vinculan a detalle de inspección y unidad física.
- `[x]` Adjuntar fotografías opcionales.
- `[x]` Mantener evidencias en Storage privado. Se reutiliza el bucket privado `evidence`; el registro verifica que la ruta corresponda a la carpeta del usuario responsable.
- `[x]` Cambiar la disponibilidad de la unidad cuando una novedad lo requiera. Una devolución queda en `MAINTENANCE` hasta la inspección; daño, faltante, rotura o falla la mantienen fuera de disponibilidad.
- `[x]` Cerrar préstamos con y sin novedades correctamente. El cierre de devolución es trazable y la inspección posterior determina la disponibilidad segura de cada unidad.

Criterio de salida:

- Una devolución con novedad deja evidencia estructurada.
- Las fotos no son obligatorias para cerrar una operación.
- Una unidad dañada no vuelve a estar disponible por accidente.

### Fase 10 — Mantenimiento

- `[ ]` Crear mantenimiento preventivo, correctivo o de inspección.
- `[ ]` Cambiar unidad a `MAINTENANCE` al iniciar.
- `[ ]` Impedir prestar unidades en mantenimiento.
- `[ ]` Registrar motivo, responsable, fechas y descripción.
- `[ ]` Completar o cancelar mantenimiento.
- `[ ]` Recalcular el estado permitido al finalizar.
- `[ ]` Registrar evidencias y auditoría.

Criterio de salida:

- El encargado puede saber qué equipos están en mantenimiento.
- El mantenimiento modifica disponibilidad de forma segura.
- El historial de la unidad muestra sus mantenimientos.

### Fase 11 — Kardex, historial y auditoría

- `[ ]` Completar movimientos para entradas, entregas, devoluciones, ajustes, pérdidas, bajas y reactivaciones.
- `[ ]` Crear historial por artículo.
- `[ ]` Crear hoja de vida por unidad individual.
- `[ ]` Registrar acción, usuario, entidad, fecha, estado anterior y estado posterior.
- `[ ]` Impedir que usuarios normales modifiquen auditoría.
- `[ ]` Crear vistas de préstamos, solicitudes, novedades y stock.

Criterio de salida:

- Cada operación crítica puede reconstruirse.
- La hoja de vida muestra movimientos, préstamos, inspecciones, novedades y mantenimiento.
- No se elimina físicamente el historial operativo.

### Fase 12 — Dashboards, reportes y cierre del MVP

- `[ ]` Dashboard del docente: solicitudes, estados, préstamos y notificaciones.
- `[ ]` Dashboard del encargado: pendientes, preparaciones, préstamos, devoluciones, novedades e inventario.
- `[ ]` Dashboard del administrador: usuarios, configuración, reportes y auditoría.
- `[ ]` Reportes operativos mínimos.
- `[ ]` Reportes históricos mínimos.
- `[ ]` Estados de carga, vacío, error, éxito y sin permisos en todas las áreas.
- `[ ]` Revisión responsive final.
- `[ ]` Revisión de accesibilidad y teclado.
- `[ ]` Prueba de flujo completo con datos representativos.
- `[ ]` Revisión de seguridad, RLS y secretos.
- `[ ]` Revisión del README y guías de inicio.
- `[ ]` Despliegue de prueba en Vercel.

Criterio de salida:

- Los criterios de aceptación de los tres documentos funcionales están cubiertos.
- El flujo principal funciona de inicio a fin.
- CI pasa.
- Las dos integrantes pueden explicar cómo operar y mantener el sistema.
- Toda tarea pendiente pertenece a una fase futura explícita o tiene justificación.

## 5. Matriz de trazabilidad mínima

| Área | Documento funcional | Implementación esperada | Prueba de cierre |
| --- | --- | --- | --- |
| Roles | Documento 1, reglas RN-01 a RN-02 | Auth, perfiles, RLS | Acceso permitido/denegado por rol |
| Inventario | Documento 1, RF-07 a RF-08 | `items`, `item_units` | Crear, desactivar y consultar |
| Disponibilidad | Documento 1, RN-03 a RN-07 | Consulta y transacción | Casos de intervalos y concurrencia |
| Solicitudes | Documento 1, RF-10 a RF-14 | `requests`, reservas | Aprobación total/parcial/rechazo |
| Entrega | Documento 1, RF-15 a RF-21 | Preparación, QR, `loans` | Entrega con docente/estudiante |
| Devolución | Documento 1, RF-22 a RF-24 | `returns` | Devolución completa/parcial |
| Novedades | Documento 1, RF-25 a RF-27 | Inspecciones/incidentes/evidencias | Daño, faltante y foto opcional |
| Mantenimiento | Documento 1, RF-28 a RF-29 | `maintenance_records` | Bloqueo y liberación de unidad |
| Historial | Documento 1, RF-30 a RF-33 | Kardex, auditoría, reportes | Reconstrucción de operación |

## 6. Definition of Done

Una tarea puede marcarse `[x]` únicamente si:

- implementa el comportamiento solicitado;
- valida entradas en frontend y backend cuando corresponda;
- respeta roles, RLS y secretos;
- tiene pruebas o una justificación clara de por qué no aplica;
- contempla errores, carga, vacío y permisos;
- no rompe las validaciones existentes;
- fue revisada por la otra integrante;
- actualiza documentación si cambia el contrato o el flujo;
- no introduce una funcionalidad fuera del alcance.

## 7. Control de cambios

Toda nueva idea debe registrarse antes de implementarse con esta información:

```text
Nombre:
Problema que resuelve:
Usuario beneficiado:
Regla o requisito relacionado:
Por qué es necesaria para el MVP:
Qué módulos afecta:
Costo aproximado:
Riesgos:
Decisión: aceptar / dejar para futuro / rechazar
```

Una idea solo se acepta en el MVP si es necesaria para inventario, solicitud, reserva, préstamo, devolución, novedad, mantenimiento o trazabilidad, o si evita un riesgo crítico de seguridad o integridad.

## 8. Orden de trabajo semanal recomendado

Cada semana debe cerrar una unidad pequeña y comprobable:

1. Elegir una sola fase o parte de fase.
2. Convertirla en tareas técnicas y de interfaz.
3. Definir datos, estados y permisos antes de programar.
4. Implementar backend y pruebas.
5. Implementar frontend y estados visuales.
6. Verificar con navegador y datos representativos.
7. Ejecutar CI local.
8. Hacer revisión cruzada.
9. Marcar tareas y registrar decisiones.

No avanzar al siguiente módulo si el módulo actual deja operaciones críticas sin validar.

## 8.1 División paralela por tarea

Para cada módulo se pueden abrir dos líneas de trabajo:

```text
Contrato y datos ──┐
                   ├─ Integración ── Prueba completa
Interfaz y flujo ──┘
```

La línea de contrato y datos puede incluir migraciones, endpoints, modelos, permisos y pruebas de API. La línea de interfaz y flujo puede incluir pantallas, componentes, estados visuales, consumo del contrato y pruebas de interacción.

Antes de iniciar una tarea paralela se debe acordar:

1. Qué datos entran y salen.
2. Qué estados y errores existen.
3. Qué permisos aplican.
4. Qué criterio permite integrar ambas partes.
5. Quién implementa y quién revisa.

La asignación debe registrarse en el pull request o en el tablero de trabajo. No se debe interpretar que Axel pertenece al backend o que Shoma (La del buen front) pertenece al frontend: ambos pueden trabajar en cualquiera de las dos capas.

## 9. Registro de decisiones y bloqueos

| Fecha | Tema | Decisión/bloqueo | Responsable | Estado |
| --- | --- | --- | --- | --- |
| 2026-08-20 | Base del proyecto | Next.js + FastAPI + Supabase + Vercel | Equipo | Cerrado |
| 2026-08-20 | Plataforma frontend | Next.js responsive, con guía de skills de diseño y verificación | Equipo | Cerrado |
| 2026-08-20 | Roles MVP | Administrador, encargado y docente | Equipo | Cerrado |
| 2026-08-20 | Estudiantes | Sin cuenta propia; se registran como persona que retira/devuelve | Equipo | Cerrado |
| 2026-08-20 | Inventario | Control por cantidad e individualizado | Equipo | Cerrado |
| 2026-08-20 | Evidencias | Fotografías opcionales y Storage privado | Equipo | Cerrado |
| 2026-08-20 | Trabajo paralelo | Axel y Shoma (La del buen front) pueden trabajar en frontend o backend; la asignación será por tarea | Equipo | Cerrado |
| 2026-08-20 | Supabase | Axel la toma inicialmente como responsabilidad principal, con revisión cruzada | Axel / Shoma | Abierto a ajuste |

Agregar aquí cualquier decisión que cambie una regla, estado, tabla, permiso o alcance.

## 10. Definición de terminado del proyecto

El proyecto se puede declarar terminado cuando:

- todas las tareas obligatorias de las fases 1 a 12 están en `[x]`;
- no existen bloqueos abiertos en operaciones críticas;
- el flujo completo fue probado con los tres roles;
- los criterios de aceptación están cubiertos;
- CI y despliegue de prueba están verdes;
- las migraciones, variables de entorno y políticas RLS están documentadas;
- el README permite a una persona nueva iniciar y entender el proyecto;
- las funcionalidades fuera del alcance permanecen fuera del código del MVP.
