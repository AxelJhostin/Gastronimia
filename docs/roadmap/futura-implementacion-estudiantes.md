# Futura implementación del rol Estudiante

## 1. Estado de esta propuesta

| Campo | Valor |
| --- | --- |
| Estado | Propuesta para implementación futura |
| Prioridad sugerida | Después de estabilizar el flujo operativo actual |
| Rol nuevo | `STUDENT` |
| Enfoque recomendado | Participante autorizado con acceso de consulta |
| Responsable formal | El Docente se mantiene como responsable académico |
| Impacto estimado | Medio |

Este documento define el diseño recomendado. No crea todavía el rol, tablas, endpoints, políticas ni pantallas.

## 2. Decisión principal

El Estudiante no será una copia del Docente.

El modelo recomendado separa tres responsabilidades:

```text
Docente
  Responsable académico
  Crea la solicitud
  Autoriza participantes

Estudiante
  Participante autorizado
  Consulta la práctica y los recursos relacionados
  Puede identificarse para retirar o devolver
  Puede reportar una novedad vinculada al préstamo

Encargado
  Responsable de la operación física
  Aprueba, prepara, entrega, recibe e inspecciona
```

El Docente seguirá siendo el `responsible_teacher_id` del préstamo aunque un Estudiante retire o devuelva los recursos.

## 3. Problema que resuelve

Actualmente un Estudiante puede retirar o devolver físicamente, pero queda registrado únicamente mediante un nombre escrito por el Encargado. No dispone de una cuenta para:

- revisar en qué práctica está autorizado;
- consultar qué recursos fueron entregados;
- comprobar fechas o pendientes;
- visualizar el estado de una devolución;
- reportar una novedad relacionada;
- conservar un historial personal de participación.

El nuevo rol formaliza esa participación sin transferirle la responsabilidad académica ni permisos operativos.

## 4. Alcance recomendado para la primera versión

### 4.1 El Estudiante podrá

- iniciar y cerrar sesión;
- consultar su perfil académico;
- consultar los cursos o paralelos donde está matriculado;
- ver solicitudes donde fue autorizado explícitamente;
- consultar propósito, laboratorio, horario y recursos de esas solicitudes;
- ver préstamos asociados a solicitudes autorizadas;
- ver quién retiró y quién devolvió;
- consultar cantidades o unidades relacionadas;
- ver novedades relacionadas con esos préstamos;
- reportar una novedad vinculada a una solicitud o préstamo visible;
- consultar el estado de revisión de su reporte;
- utilizar la interfaz desde móvil.

### 4.2 El Estudiante no podrá

- crear solicitudes en nombre propio;
- modificar o enviar solicitudes del Docente;
- aprobar o rechazar solicitudes;
- reservar inventario;
- preparar recursos;
- generar el token operativo de entrega;
- confirmar una entrega o devolución;
- cambiar stock, ubicación, condición o estado de una unidad;
- crear o cerrar mantenimientos;
- consultar solicitudes de otros estudiantes o cursos;
- consultar reportes globales;
- consultar auditoría;
- gestionar usuarios, roles o configuración académica.

### 4.3 Fuera del alcance inicial

- solicitudes creadas directamente por estudiantes;
- aprobación previa del Docente sobre solicitudes estudiantiles;
- firma digital con validez legal;
- notificaciones push, SMS o WhatsApp;
- geolocalización;
- pagos, multas o sanciones;
- chat entre Estudiante, Docente y Encargado;
- carga masiva desde un sistema académico externo;
- códigos QR permanentes almacenados en capturas.

## 5. Reglas de negocio

1. Todo préstamo conserva un Docente responsable.
2. Estar matriculado en un curso no permite ver automáticamente todas las solicitudes del curso.
3. El Docente debe autorizar explícitamente al Estudiante en una solicitud.
4. Solo estudiantes activos y matriculados en la sección de la solicitud pueden ser autorizados.
5. La autorización debe conservar quién la creó y cuándo.
6. Una autorización revocada no habilita nuevas acciones, pero permanece en el historial.
7. Un Estudiante solo puede leer solicitudes, préstamos, devoluciones y novedades vinculadas a autorizaciones propias.
8. El Encargado confirma físicamente la identidad de quien retira o devuelve.
9. Registrar al Estudiante no elimina el campo de nombre de retiro/devolución; el nombre queda como evidencia histórica.
10. Un reporte de novedad del Estudiante no cambia inventario automáticamente.
11. El Encargado debe revisar el reporte antes de bloquear una unidad o abrir mantenimiento.
12. No se borran físicamente perfiles, matrículas, autorizaciones ni historial operativo.
13. Un usuario con varios roles obtiene la unión de menús, pero cada endpoint mantiene su autorización independiente.
14. La autorización nunca se decide usando `user_metadata` editable por el usuario.

## 6. Matriz de permisos futura

| Función | Administrador | Encargado | Docente | Estudiante |
| --- | :---: | :---: | :---: | :---: |
| Administrar usuarios y roles | Sí | No | No | No |
| Administrar períodos, materias y laboratorios | Sí | No | No | No |
| Administrar estudiantes y matrículas | Sí | No | No | No |
| Consultar inventario global | Sí | Sí | Catálogo para solicitud | Solo recursos relacionados |
| Crear solicitud | No | No | Sí | No |
| Autorizar estudiantes en solicitud | No | No | Sí, propias | No |
| Revisar solicitud | Sí | Sí | No | No |
| Preparar | Sí | Sí | No | No |
| Entregar | Sí | Sí | No | No |
| Registrar devolución | Sí | Sí | No | No |
| Ver préstamos globales | Sí | Sí | No | No |
| Ver préstamos propios/relacionados | No | No | Sí | Sí, autorizados |
| Registrar novedad operativa | Consulta | Sí | No | Propuesta sujeta a revisión |
| Mantenimiento | Consulta | Sí | No | No |
| Reportes globales | Sí | Sí | Limitado | No |
| Auditoría | Sí | No | No | No |

## 7. Modelo de datos propuesto

### 7.1 Rol

Agregar `STUDENT` al tipo `public.role_code` y crear su registro en el catálogo de roles si el esquema actual lo requiere.

La migración debe verificar primero cómo está definido el enum y generarse con la CLI vigente:

```bash
./frontend/node_modules/.bin/supabase migration new add_student_participation
```

No crear manualmente un nombre de migración con timestamp.

### 7.2 Perfil de estudiante

Tabla propuesta: `public.students`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK con UUID aleatorio |
| `user_id` | `uuid` | FK única a `public.users` |
| `student_code` | `text` | Código institucional único, opcional hasta confirmación |
| `is_active` | `boolean` | `true` por defecto |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()` y trigger de actualización |

Restricciones:

- un usuario tiene como máximo un perfil Estudiante;
- no borrar físicamente el perfil;
- un perfil inactivo no puede recibir nuevas autorizaciones;
- el correo continúa almacenado en Auth/usuarios, no se duplica aquí.

### 7.3 Matrículas

Tabla propuesta: `public.course_section_students`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `course_section_id` | `uuid` | FK a `course_sections` |
| `student_id` | `uuid` | FK a `students` |
| `is_active` | `boolean` | Estado de matrícula |
| `enrolled_at` | `timestamptz` | Fecha de matrícula |
| `ended_at` | `timestamptz` | Fecha opcional de cierre |
| `created_at` | `timestamptz` | Auditoría |

Índices y restricciones:

- índice por `student_id`;
- índice por `course_section_id`;
- unicidad por estudiante y sección;
- `ended_at` obligatorio cuando `is_active = false`, si se adopta esa regla.

La matrícula sirve para validar pertenencia académica, pero no concede por sí sola acceso a solicitudes.

### 7.4 Participación explícita en una solicitud

Tabla propuesta: `public.equipment_request_participants`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `equipment_request_id` | `uuid` | FK a `equipment_requests` |
| `student_id` | `uuid` | FK a `students` |
| `authorized_by_teacher_id` | `uuid` | FK a `teachers` |
| `can_pickup` | `boolean` | Autorización para retirar |
| `can_return` | `boolean` | Autorización para devolver |
| `authorized_at` | `timestamptz` | Momento de autorización |
| `revoked_at` | `timestamptz` | Revocación opcional |
| `notes` | `text` | Observación opcional y limitada |

Restricciones:

- unicidad por solicitud y estudiante;
- el Docente autorizador debe ser responsable de la solicitud;
- el Estudiante debe tener matrícula activa en la sección de la solicitud;
- `can_pickup` o `can_return` debe ser verdadero;
- una autorización revocada no se elimina.

Esta tabla es la frontera principal para evitar accesos horizontales entre estudiantes.

### 7.5 Referencias en préstamo y devolución

Agregar campos opcionales, sin reemplazar los nombres existentes:

```text
equipment_loans.collected_by_student_id    uuid nullable
equipment_returns.returned_by_student_id   uuid nullable
```

Se conservan:

```text
equipment_loans.collected_by_name
equipment_returns.returned_by_name
```

Razón: el nombre es una fotografía histórica de lo declarado en el momento; el ID permite trazabilidad cuando la persona sí tiene cuenta.

### 7.6 Reportes de novedades del Estudiante

No insertar directamente en `equipment_incidents`, porque esa entidad representa una novedad confirmada durante una inspección operativa.

Tabla propuesta: `public.student_incident_reports`.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `student_id` | `uuid` | Autor del reporte |
| `equipment_request_id` | `uuid` | Solicitud visible para el estudiante |
| `equipment_loan_id` | `uuid` | Préstamo relacionado, opcional según estado |
| `inventory_unit_id` | `uuid` | Unidad individual opcional |
| `description` | `text` | Obligatoria, máximo definido |
| `status` | enum | `SUBMITTED`, `REVIEWING`, `CONFIRMED`, `DISMISSED` |
| `reviewed_by_user_id` | `uuid` | Encargado revisor, opcional |
| `review_notes` | `text` | Resultado de revisión |
| `created_at` | `timestamptz` | Auditoría |
| `reviewed_at` | `timestamptz` | Auditoría |

Una confirmación puede crear posteriormente una incidencia operativa mediante una transacción controlada.

## 8. Diseño de seguridad y RLS

### 8.1 Principios

- habilitar RLS en toda tabla nueva del esquema expuesto;
- conceder acceso únicamente después de definir las políticas;
- no usar solamente `TO authenticated` como autorización;
- combinar autenticación con pertenencia o propiedad explícita;
- no usar `raw_user_meta_data` para decidir roles;
- mantener `service_role` exclusivamente en backend;
- preferir funciones `SECURITY INVOKER`;
- si una función `SECURITY DEFINER` fuera imprescindible, ubicarla en esquema privado, revocar `EXECUTE` a `PUBLIC` y validar `auth.uid()` dentro de la función;
- cualquier vista expuesta debe usar `security_invoker = true`;
- revisar los cambios actuales de exposición de Data API antes de implementar y declarar los `GRANT` de forma explícita.

### 8.2 Funciones privadas de contexto

Funciones sugeridas:

```text
private.current_student_id()
private.is_active_student()
private.student_can_read_request(request_id)
private.student_can_read_loan(loan_id)
```

Deben usar el usuario autenticado y las relaciones de perfil/participación. No deben aceptar un `student_id` libre enviado por el cliente para decidir acceso.

### 8.3 Políticas mínimas

`students`:

- Estudiante lee únicamente su perfil;
- Administrador gestiona perfiles;
- Encargado puede leer datos mínimos de identificación necesarios para una entrega;
- Docente puede leer estudiantes activos de sus propias secciones.

`course_section_students`:

- Estudiante lee únicamente sus matrículas;
- Docente lee matrículas de secciones propias;
- Administrador gestiona;
- Encargado no necesita acceso general.

`equipment_request_participants`:

- Estudiante lee únicamente su participación;
- Docente crea, modifica o revoca participantes solo en solicitudes propias y estados permitidos;
- Encargado lee participantes de solicitudes que procesa;
- Administrador consulta.

`equipment_requests`, préstamos, devoluciones y novedades:

- ampliar políticas de lectura para permitir acceso al Estudiante solo cuando exista participación activa en la solicitud correspondiente;
- no conceder `INSERT`, `UPDATE` o `DELETE` operativo al rol Estudiante;
- los reportes propuestos por estudiantes se insertan únicamente con `student_id = private.current_student_id()`.

### 8.4 Prevención de BOLA/IDOR

Probar siempre:

- Estudiante A intenta consultar solicitud de Estudiante B por UUID;
- Estudiante A intenta consultar préstamo de otro curso;
- Estudiante cambia `student_id` en un payload;
- Estudiante revocado intenta reutilizar una URL guardada;
- Estudiante inactivo conserva una sesión anterior;
- usuario con rol `STUDENT` pero sin perfil intenta consultar datos;
- perfil Estudiante sin matrícula intenta ser autorizado;

Todas deben fallar sin filtrar si el registro existe.

## 9. API propuesta

Rutas relativas a `/api/v1`.

### 9.1 Administración académica

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `GET /admin/academic/students` | ADMIN | Listar perfiles |
| `POST /admin/academic/students` | ADMIN | Crear perfil |
| `PATCH /admin/academic/students/{id}` | ADMIN | Editar/activar/desactivar |
| `GET /admin/academic/enrollments` | ADMIN | Listar matrículas |
| `POST /admin/academic/enrollments` | ADMIN | Matricular |
| `PATCH /admin/academic/enrollments/{id}` | ADMIN | Activar/cerrar matrícula |

### 9.2 Autorización del Docente

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `GET /requests/{id}/participants` | TEACHER propietario / personal | Listar participantes |
| `POST /requests/{id}/participants` | TEACHER propietario | Autorizar Estudiante |
| `PATCH /requests/{id}/participants/{participant_id}` | TEACHER propietario | Cambiar permisos o revocar |

Reglas:

- no confiar en un `teacher_id` enviado por el navegador;
- resolver el perfil Docente desde el usuario autenticado;
- validar que la solicitud le pertenece;
- validar matrícula y estado del Estudiante;
- limitar cambios después de la entrega.

### 9.3 Experiencia del Estudiante

| Método y ruta | Rol | Uso |
| --- | --- | --- |
| `GET /student/me` | STUDENT | Perfil y matrículas propias |
| `GET /student/requests` | STUDENT | Solicitudes autorizadas |
| `GET /student/requests/{id}` | STUDENT participante | Detalle limitado |
| `GET /student/loans` | STUDENT | Préstamos relacionados |
| `GET /student/loans/{id}` | STUDENT participante | Detalle limitado |
| `GET /student/incidents` | STUDENT | Novedades relacionadas |
| `POST /student/incident-reports` | STUDENT | Reportar novedad |
| `GET /student/incident-reports/{id}` | STUDENT propietario | Estado del reporte |

Todas las respuestas deben usar modelos Pydantic específicos. No devolver filas crudas con campos internos que la pantalla no necesita.

### 9.4 Operación del Encargado

Extender el contexto de entrega/devolución para incluir participantes autorizados:

```text
authorized_participants[]
  student_id
  full_name
  student_code
  can_pickup
  can_return
```

Al registrar la operación:

- el Encargado puede seleccionar un Estudiante autorizado;
- el backend verifica nuevamente la autorización;
- guarda el ID y una copia del nombre;
- si la persona no tiene cuenta, conserva el flujo actual de nombre manual;
- no se acepta un ID de estudiante no relacionado con la solicitud.

## 10. Interfaz propuesta

### 10.1 Menú Estudiante

```text
Inicio
Mis prácticas
Mis préstamos
Mis novedades
```

No mostrar módulos administrativos u operativos.

### 10.2 Dashboard Estudiante

Métricas:

- prácticas próximas;
- préstamos activos;
- devoluciones pendientes;
- novedades en revisión.

Contenido:

- próxima práctica con fecha, laboratorio y Docente;
- recursos principales;
- estado de autorización para retirar/devolver;
- historial reciente;
- acceso a reportar novedad.

Estados necesarios:

- sin perfil académico;
- sin matrícula;
- sin prácticas autorizadas;
- autorización revocada;
- préstamo activo;
- préstamo atrasado;
- préstamo cerrado;
- error de carga;
- sesión inválida.

### 10.3 Pantalla “Mis prácticas”

Cada tarjeta debe mostrar:

- propósito;
- materia/sección;
- Docente responsable;
- laboratorio;
- inicio y fin;
- estado de solicitud;
- permisos de participación;
- enlace a detalle.

El detalle debe ocultar información administrativa como IDs internos de usuarios, observaciones privadas y datos de otras personas.

### 10.4 Pantalla “Mis préstamos”

Reutilizar la experiencia actual del Docente, ajustada a participación:

- activos;
- atrasados;
- devueltos;
- recursos entregados;
- quién retiró;
- quién devolvió;
- fecha de cierre;
- novedades relacionadas.

### 10.5 Pantalla “Reportar novedad”

Campos:

- práctica o préstamo visible;
- recurso/unidad visible;
- descripción;
- fotografía opcional;
- confirmación antes de enviar.

Después de enviar:

- mostrar número de reporte;
- mostrar estado `Enviado`;
- aclarar que no reemplaza la inspección del Encargado;
- impedir edición destructiva del historial.

### 10.6 Cambios en Docente

En crear/editar solicitud:

- sección “Participantes autorizados”;
- buscar únicamente estudiantes activos de la sección seleccionada;
- marcar “Puede retirar” y/o “Puede devolver”;
- explicar que el Docente conserva la responsabilidad;
- permitir revocar antes de la entrega;
- mostrar historial de autorizaciones.

### 10.7 Cambios en Encargado

En entrega y devolución:

- mostrar participantes autorizados;
- permitir seleccionar una persona autorizada;
- mostrar código institucional para verificación;
- conservar alternativa de nombre manual para una persona sin cuenta;
- advertir si la autorización fue revocada o no corresponde.

### 10.8 Cambios en Administrador

En Usuarios:

- agregar rol Estudiante;
- crear cuenta e indicar si requiere cambio de contraseña;
- activar/desactivar.

En Academia:

- crear perfil Estudiante;
- matricular en sección;
- cerrar matrícula;
- consultar estado sin borrar historial.

## 11. QR e identificación

### Primera versión recomendada

Mantener el token temporal de entrega bajo control del Encargado y usar la selección del Estudiante autorizado como evidencia de identidad.

### Evolución opcional

Crear una credencial QR temporal del participante:

- ligada a autorización, solicitud y usuario;
- vida corta;
- de un solo uso cuando corresponda;
- regenerable después de expirar;
- nunca incluir UUIDs o datos personales en texto plano;
- almacenar únicamente hash del token;
- validar estado de cuenta, matrícula y autorización al canjear;
- no aceptar capturas antiguas después de revocación.

No reutilizar indefinidamente el QR operativo actual como credencial personal.

## 12. Notificaciones

Posponer notificaciones externas hasta estabilizar permisos.

Primera versión:

- avisos dentro del dashboard;
- solicitud autorizada;
- recursos entregados;
- devolución próxima;
- préstamo atrasado;
- reporte de novedad revisado.

Evolución:

- correo institucional;
- preferencias de notificación;
- registro de envío y reintentos.

## 13. Estrategia de migración

### Fase 0 — Confirmación funcional

Resolver antes de programar:

- fuente oficial de códigos de estudiante;
- quién administra matrículas;
- si Docente puede autorizar después de aprobación;
- si Estudiante puede reportar sobre artículos por cantidad;
- tiempo de conservación de fotografías;
- política institucional de privacidad;
- si una cuenta puede ser Docente y Estudiante simultáneamente.

### Fase 1 — Base de datos y seguridad

1. Agregar rol.
2. Crear perfiles, matrículas y participantes.
3. Agregar referencias opcionales de retiro/devolución.
4. Crear reportes de novedades estudiantiles.
5. Crear índices y restricciones.
6. Habilitar RLS.
7. Crear políticas de propiedad y pertenencia.
8. Declarar `GRANT` explícitos según configuración vigente de Data API.
9. Ejecutar asesores de seguridad.
10. Verificar migraciones en una base local limpia.

No existe backfill obligatorio: las operaciones históricas sin `student_id` mantienen su nombre textual.

### Fase 2 — Backend

1. Agregar `STUDENT` al enum Python.
2. Extender `/auth/me`.
3. Crear modelos Pydantic.
4. Implementar administración académica.
5. Implementar autorización del Docente.
6. Implementar endpoints de consulta del Estudiante.
7. Extender entrega y devolución.
8. Implementar reporte/revisión de novedades.
9. Agregar auditoría.

### Fase 3 — Frontend

1. Agregar `STUDENT` al tipo compartido.
2. Crear navegación por rol.
3. Crear dashboard Estudiante.
4. Crear Mis prácticas, Mis préstamos y Mis novedades.
5. Añadir participantes al formulario/detalle Docente.
6. Añadir selección de participante a entrega/devolución.
7. Añadir administración de perfiles y matrículas.
8. Cubrir estados responsive, vacíos, error y permisos.

### Fase 4 — Datos y QA

1. Crear cuenta Estudiante demo.
2. Crear al menos dos estudiantes en cursos distintos.
3. Autorizar solo uno en una solicitud.
4. Ejecutar pruebas de acceso cruzado.
5. Recorrer préstamo y devolución.
6. Confirmar reportes, auditoría e historial.
7. Ejecutar pruebas automatizadas y manuales.

## 14. Datos demo futuros

Propuesta:

| Rol | Correo | Uso |
| --- | --- | --- |
| Estudiante A | `estudiante.a@gastronomia.test` | Autorizado en práctica A |
| Estudiante B | `estudiante.b@gastronomia.test` | Otro curso; prueba de aislamiento |

Escenarios:

- A matriculado y autorizado para retirar/devolver;
- B matriculado en otra sección y sin acceso;
- A con préstamo activo;
- A con préstamo cerrado;
- A con reporte de novedad en revisión;
- perfil inactivo para pruebas negativas.

Las contraseñas deben ser exclusivas del entorno local y documentarse en el script de seed demo, no en producción.

## 15. Pruebas necesarias

### 15.1 Base de datos y RLS

- Estudiante lee su perfil y no el de otro.
- Estudiante lee sus matrículas y no las de otro.
- matrícula no concede acceso sin participación.
- participación concede acceso solo a la solicitud asociada.
- revocación retira acceso nuevo.
- Estudiante no puede insertar/editar solicitudes.
- Estudiante no puede editar préstamo o devolución.
- Estudiante crea reporte únicamente con su propio ID.
- vista con `security_invoker` respeta RLS.
- cuenta inactiva no opera con token anterior en endpoints sensibles.

### 15.2 Backend

- cada endpoint exige `STUDENT` cuando corresponde;
- UUID de otro estudiante responde 403 o 404 sin filtrar existencia;
- payload no puede suplantar `student_id`;
- Docente solo administra participantes de solicitudes propias;
- Estudiante debe pertenecer a la sección;
- Encargado solo selecciona participantes autorizados;
- IDs y nombres quedan guardados juntos;
- errores de Supabase se traducen a mensajes seguros.

### 15.3 Frontend

- menú correcto con un solo rol;
- unión correcta con múltiples roles;
- rutas directas protegidas;
- sin parpadeo de contenido administrativo durante la carga;
- dashboard vacío y con datos;
- préstamo activo/atrasado/cerrado;
- reporte de novedad y validaciones;
- móvil 390 px, tableta y escritorio;
- navegación completa por teclado;
- contraste y etiquetas accesibles.

### 15.4 Flujo E2E mínimo

```text
Administrador crea cuenta y perfil Estudiante
  → matricula en sección
Docente crea solicitud
  → autoriza Estudiante
Encargado aprueba y prepara
  → confirma identidad y entrega al Estudiante
Estudiante ve préstamo
  → registra reporte opcional
Encargado recibe e inspecciona
  → préstamo queda cerrado
Estudiante y Docente conservan historial
```

Prueba negativa paralela:

```text
Estudiante B intenta abrir solicitud/préstamo de Estudiante A
  → acceso denegado
  → no se filtra contenido ni existencia
```

## 16. Observabilidad y auditoría

Registrar al menos:

- creación y desactivación de perfil;
- matrícula y cierre de matrícula;
- autorización, modificación y revocación;
- retiro/devolución vinculados a Estudiante;
- creación y revisión de reporte;
- intentos denegados únicamente en logs técnicos apropiados, sin almacenar secretos.

Los reportes operativos pueden agregar filtros por Estudiante para Administrador/Encargado, pero el Estudiante nunca recibe el reporte global.

## 17. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Acceso a solicitudes de otros cursos | Crítico | Participación explícita + RLS + pruebas BOLA |
| Estudiante se convierte accidentalmente en responsable | Alto | Mantener `responsible_teacher_id` obligatorio |
| Matrícula histórica pierde trazabilidad | Alto | Desactivación lógica, no borrado |
| Suplantación al retirar | Alto | Encargado verifica y backend valida autorización |
| Reporte estudiantil bloquea inventario sin revisión | Alto | Separar reporte propuesto de incidencia confirmada |
| QR compartido o capturado | Alto | Token corto, hash, expiración, un solo uso |
| Datos personales excesivos | Medio | Respuestas mínimas y política de retención |
| Menú correcto pero API vulnerable | Crítico | Proteger backend y RLS; UI no es seguridad |
| Usuario con varios roles obtiene privilegios no deseados | Alto | Autorización por endpoint y pruebas de unión de roles |

## 18. Archivos y módulos que probablemente cambiarán

### Supabase

- nueva migración en `supabase/migrations/`;
- actualización del seed local;
- políticas RLS de solicitudes, préstamos, devoluciones e incidentes;
- funciones privadas de contexto;
- vistas/reportes si se añaden campos de Estudiante.

### Backend

- `app/core/auth.py`;
- `app/core/academic.py`;
- `app/core/requests.py`;
- endpoints académicos;
- endpoints de solicitudes, entrega, devolución e inspecciones;
- nuevos endpoints `/student`;
- pruebas unitarias, API e integración.

### Frontend

- `src/lib/api/client.ts`;
- proveedor de identidad;
- navegación por roles;
- dashboard;
- solicitudes Docente;
- entrega/devolución Encargado;
- usuarios y academia Administrador;
- nuevas rutas `dashboard/student` o rutas compartidas por dominio;
- pruebas Vitest y Cypress.

### Documentación

- requisitos funcionales;
- diseño de base de datos;
- diagramas de flujo;
- contrato API;
- plan QA;
- guía de despliegue si cambia Auth.

## 19. Estimación inicial

Estimación orientativa para una persona familiarizada con el proyecto:

| Bloque | Tiempo |
| --- | ---: |
| Decisiones funcionales y diseño | 0.5–1 día |
| Migración, restricciones y RLS | 1–1.5 días |
| Backend y pruebas | 1–1.5 días |
| Frontend responsive | 1.5–2 días |
| E2E, QA y correcciones | 1 día |
| Total estimado | 5–7 días laborales |

La credencial QR personal, notificaciones externas o importación masiva deben estimarse aparte.

## 20. Criterios de aceptación

La implementación futura estará completa cuando:

- [ ] existe el rol `STUDENT` en base de datos, backend y frontend;
- [ ] Administrador puede crear perfil y matrícula;
- [ ] Docente puede autorizar un Estudiante de su sección;
- [ ] Estudiante ve únicamente solicitudes autorizadas;
- [ ] Estudiante ve préstamos y novedades relacionados;
- [ ] Docente permanece como responsable formal;
- [ ] Encargado puede registrar quién retira/devuelve usando identidad vinculada;
- [ ] se conserva también el nombre histórico;
- [ ] Estudiante puede reportar una novedad sin alterar inventario;
- [ ] Encargado puede revisar ese reporte;
- [ ] rutas directas y API niegan accesos cruzados;
- [ ] RLS cubre cada tabla expuesta;
- [ ] no se usa `user_metadata` para autorización;
- [ ] `service_role` no llega al navegador;
- [ ] datos antiguos sin Estudiante continúan funcionando;
- [ ] pruebas unitarias, integración, E2E y QA manual están aprobadas;
- [ ] la interfaz funciona en móvil, tableta y escritorio;
- [ ] documentación y contrato API están actualizados.

## 21. Decisiones pendientes antes de iniciar

- [ ] ¿El código institucional del Estudiante es obligatorio?
- [ ] ¿Quién crea y cierra matrículas?
- [ ] ¿Docente puede autorizar después de aprobar la solicitud?
- [ ] ¿La autorización puede cambiar después de preparar?
- [ ] ¿Estudiante puede retirar, devolver o ambas?
- [ ] ¿Se permite una persona sin cuenta junto con estudiantes registrados?
- [ ] ¿Qué tipos de novedades puede reportar?
- [ ] ¿Cuánto tiempo se conservan fotografías?
- [ ] ¿Se requiere consentimiento o aviso de privacidad?
- [ ] ¿Se necesita QR personal en la primera versión?
- [ ] ¿Se enviarán notificaciones por correo?
- [ ] ¿Una cuenta puede combinar `STUDENT` y otro rol?

## 22. Recomendación final

Implementar primero el acceso de consulta con participación explícita, sin permitir que el Estudiante cree solicitudes ni ejecute operaciones de inventario.

Este alcance entrega trazabilidad y transparencia al Estudiante con un riesgo controlable. Una segunda fase puede evaluar QR personal, notificaciones y reportes, después de comprobar que autorización, RLS y flujo operativo funcionan correctamente.
