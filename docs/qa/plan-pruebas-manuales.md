# Plan completo de pruebas manuales y QA

## 1. Información del ciclo

| Campo | Valor |
| --- | --- |
| Proyecto | Sistema de Gestión de Gastronomía |
| Entorno | Local, con Supabase local |
| URL | `http://localhost:3000` |
| API | `http://localhost:8000/api/v1` |
| Swagger | `http://localhost:8000/api/v1/docs` |
| Fecha de ejecución | ____________________ |
| Responsable QA | ____________________ |
| Commit o versión | ____________________ |
| Navegador y versión | ____________________ |
| Sistema operativo | ____________________ |

Este documento permite ejecutar una revisión funcional completa del MVP, registrar evidencia y confirmar que cada rol solo puede realizar las operaciones que le corresponden.

## 2. Resultado general

Marcar únicamente después de terminar el ciclo.

- [ ] APROBADO: no existen defectos bloqueantes ni críticos abiertos.
- [ ] APROBADO CON OBSERVACIONES: solo existen defectos menores aceptados.
- [ ] RECHAZADO: existe al menos un defecto bloqueante o crítico.

Resumen:

| Métrica | Cantidad |
| --- | ---: |
| Casos ejecutados | |
| Casos aprobados | |
| Casos fallidos | |
| Casos bloqueados | |
| Defectos críticos | |
| Defectos altos | |
| Defectos medios | |
| Defectos bajos | |

## 3. Reglas de seguridad del entorno

1. Ejecutar estas pruebas únicamente contra Supabase local.
2. Confirmar que las URLs de frontend, backend y Supabase contienen `localhost` o `127.0.0.1`.
3. No copiar la clave `service_role` en el navegador, capturas o reportes.
4. No usar correos ni información personal real.
5. `npm run test:e2e` reinicia la base local. No ejecutarlo contra un proyecto compartido.

## 4. Preparación del entorno

### 4.1 Iniciar servicios

Abrir Docker Desktop y esperar hasta que indique que el motor está iniciado.

Terminal 1, desde la raíz:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run seed:demo
```

Resultado esperado:

- Supabase local queda activo.
- El comando termina con `Datos de demostración listos`.
- Se muestran las tres cuentas de prueba.

Terminal 2:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
source backend/.venv/bin/activate
npm run dev:backend
```

Terminal 3:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
npm run dev:frontend
```

Comprobaciones:

- [ ] `http://localhost:3000/login` abre sin error.
- [ ] `http://localhost:8000/api/v1/health` responde correctamente.
- [ ] No hay errores rojos en las terminales.
- [ ] La consola del navegador no muestra errores sin controlar.

### 4.2 Credenciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `axel@gmail.com` | `axelaxel` |
| Encargado | `encargado@gastronomia.test` | `Prueba-Encargado-2026!` |
| Docente | `docente@gastronomia.test` | `Prueba-Docente-2026!` |

### 4.3 Datos demo esperados

- Docente: Daniela Docente.
- Solicitud pendiente: “Práctica de cortes y fondos ecuatorianos”.
- Borrador: “Producción de masas y cremas”.
- Préstamo histórico devuelto: “Técnicas de mise en place y cocción”.
- Inventario: cuchillos, bowls, mangas, batidoras y licuadora.
- Una incidencia de severidad alta.
- Un mantenimiento correctivo abierto.

No volver a ejecutar `npm run seed:demo` durante el flujo principal, porque restaura los estados de los registros demostrativos.

## 5. Matriz de permisos esperada

| Función | Administrador | Encargado | Docente |
| --- | :---: | :---: | :---: |
| Inicio | Sí | Sí | Sí |
| Crear solicitud | No | No | Sí |
| Ver solicitudes propias | No | No | Sí |
| Revisar solicitudes | Sí | Sí | No |
| Preparar | Sí | Sí | No |
| Entregar | Sí | Sí | No |
| Inventario y stock | Sí | Sí | No |
| Préstamos y devoluciones operativas | Sí | Sí | No |
| Ver préstamos propios | No | No | Sí |
| Mantenimiento | Sí | Sí | No |
| Incidencias | Sí | Sí | No |
| Reportes operativos | Sí | Sí | No |
| Auditoría | Sí | No | No |
| Usuarios y roles | Sí | No | No |
| Configuración académica | Sí | No | No |

Nota: “Solicitudes” sí debe aparecer para Encargado, porque ahí revisa y aprueba. El botón “Nueva solicitud” solo debe aparecer para Docente.

## 6. Convenciones de ejecución

Usar uno de estos estados por caso:

- `PASS`: comportamiento igual al esperado.
- `FAIL`: comportamiento distinto al esperado.
- `BLOCKED`: no se pudo continuar por un problema anterior.
- `N/A`: caso no aplicable, con justificación.

Severidad de defectos:

- `Crítica`: pérdida de datos, acceso indebido, fuga de secretos o flujo principal imposible.
- `Alta`: función principal incorrecta sin alternativa razonable.
- `Media`: función secundaria incorrecta o UX que dificulta terminar el flujo.
- `Baja`: problema visual, textual o de consistencia sin impacto funcional.

Guardar como evidencia:

- Captura completa de la pantalla.
- Rol utilizado.
- URL.
- Fecha y hora.
- Datos introducidos.
- Mensaje observado.
- Error de consola o terminal, si existe.

## 7. Pruebas rápidas de humo

| ID | Prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| SMK-01 | Abrir `/login`. | Formulario visible y usable. | [ ] |
| SMK-02 | Iniciar sesión como Administrador. | Abre `/dashboard`; no aparece error. | [ ] |
| SMK-03 | Cerrar sesión. | Regresa a `/login`; una ruta privada vuelve a pedir autenticación. | [ ] |
| SMK-04 | Iniciar sesión como Encargado. | Panel operativo con datos demo. | [ ] |
| SMK-05 | Iniciar sesión como Docente. | Panel docente con solicitudes y préstamos propios. | [ ] |
| SMK-06 | Recargar cada panel. | La sesión y el contenido se conservan. | [ ] |
| SMK-07 | Revisar a 390 px de ancho. | No hay desplazamiento horizontal ni controles cortados. | [ ] |

## 8. Autenticación y control de acceso

### QA-AUTH-01 — Credenciales válidas

1. Abrir `/login`.
2. Introducir una cuenta de prueba válida.
3. Seleccionar “Iniciar sesión”.

Esperado:

- [ ] Redirige a `/dashboard`.
- [ ] El correo y rol correctos aparecen en la navegación.
- [ ] No expone tokens ni claves en pantalla.

### QA-AUTH-02 — Credenciales inválidas

1. Usar `docente@gastronomia.test` con contraseña incorrecta.
2. Intentar iniciar sesión.

Esperado:

- [ ] Permanece en login.
- [ ] Muestra un mensaje comprensible.
- [ ] No revela si el correo existe ni detalles internos.

### QA-AUTH-03 — Ruta privada sin sesión

1. Cerrar sesión.
2. Abrir directamente `/dashboard`.

Esperado:

- [ ] Redirige a login o bloquea el contenido privado.
- [ ] No muestra datos de otro usuario durante la carga.

### QA-AUTH-04 — Rutas prohibidas por rol

Probar escribiendo directamente estas URLs:

| Rol | URL | Esperado |
| --- | --- | --- |
| Encargado | `/dashboard/requests/new` | Página 403; no existe enlace visible hacia ella. |
| Encargado | `/dashboard/audit-log` | Página 403; Auditoría no aparece en el menú. |
| Encargado | `/dashboard/users` | Página 403; Usuarios no aparece en el menú. |
| Docente | `/dashboard/inventory` | Página 403; Inventario no aparece en el menú. |
| Docente | `/dashboard/returns` | Página 403; Devoluciones no aparece en el menú. |
| Docente | `/dashboard/maintenance` | Página 403; Mantenimiento no aparece en el menú. |

Para cada fila:

- [ ] El servidor niega la operación aunque se escriba la URL manualmente.
- [ ] La pantalla ofrece una salida clara al panel.
- [ ] No se muestran datos protegidos antes del 403.

## 9. Menús por rol

### QA-NAV-01 — Menú Docente

Esperado:

- [ ] Inicio.
- [ ] Solicitudes.
- [ ] Mis préstamos.
- [ ] No aparecen opciones operativas o administrativas.

### QA-NAV-02 — Menú Encargado

Esperado:

- [ ] Inicio.
- [ ] Solicitudes.
- [ ] Preparaciones.
- [ ] Entregas.
- [ ] Inventario y stock.
- [ ] Préstamos y devoluciones.
- [ ] Mantenimiento.
- [ ] Incidencias.
- [ ] Reportes.
- [ ] No aparece Auditoría.
- [ ] No aparecen Usuarios ni Academia.

### QA-NAV-03 — Menú Administrador

Esperado:

- [ ] Opciones operativas.
- [ ] Usuarios.
- [ ] Academia.
- [ ] Auditoría.
- [ ] Reportes.

### QA-NAV-04 — Menú móvil

Para cada rol:

1. Usar un ancho aproximado de 390 px.
2. Abrir el menú.
3. Recorrer todos los enlaces.
4. Cerrar el menú con el botón y tocando el fondo.

Esperado:

- [ ] El foco no entra al menú cuando está cerrado.
- [ ] El fondo queda bloqueado cuando está abierto.
- [ ] Todos los enlaces y “Cerrar sesión” son alcanzables.
- [ ] El menú se cierra al navegar.

## 10. Flujo del Docente

### QA-DOC-01 — Panel inicial

1. Entrar como Docente.
2. Abrir Inicio.

Esperado:

- [ ] Saludo “Hola, Docente”.
- [ ] Métricas de solicitudes y préstamos.
- [ ] Lista de solicitudes recientes.
- [ ] Tarjeta “Mis préstamos”.
- [ ] La tarjeta oscura “Próximo paso” muestra título, descripción y botón; no está vacía ni estirada.

### QA-DOC-02 — Historial de préstamos

1. Seleccionar “Mis préstamos”.
2. Revisar el préstamo demo devuelto.

Esperado:

- [ ] Activos: 0, Atrasados: 0, Devueltos: 1, antes de ejecutar el flujo principal.
- [ ] Se muestra “Técnicas de mise en place y cocción”.
- [ ] Se muestran quién retiró, fecha de entrega, solicitud y fecha de cierre.
- [ ] No aparecen préstamos pertenecientes a otros docentes.

### QA-DOC-03 — Listado de solicitudes

1. Abrir “Solicitudes”.

Esperado:

- [ ] Muestra únicamente solicitudes del docente autenticado.
- [ ] Incluye pendiente, borrador e histórico cerrado del escenario demo.
- [ ] Aparece el botón “Nueva solicitud”.
- [ ] Cada fila permite abrir su detalle.

### QA-DOC-04 — Validaciones de nueva solicitud

1. Abrir “Nueva solicitud”.
2. Intentar consultar disponibilidad sin fecha ni artículo.
3. Introducir una fecha final anterior o igual al inicio.
4. Introducir cantidad 0.
5. Intentar seleccionar dos veces el mismo artículo.

Esperado:

- [ ] Solicita horario y artículo cuando faltan.
- [ ] Rechaza un intervalo inválido.
- [ ] Rechaza cantidades no positivas.
- [ ] No permite artículos duplicados.
- [ ] El formulario conserva los datos válidos después de un error.

### QA-DOC-05 — Crear y enviar solicitud

Usar valores que no se superpongan con otras pruebas:

- Sección: una sección de Daniela Docente.
- Laboratorio: Cocina caliente.
- Inicio: al menos 10 días en el futuro.
- Fin: 3 horas después.
- Propósito: `QA flujo completo AAAA-MM-DD HH:mm`.
- Cuchillo de chef: 2.
- Bowl de acero: 2.

Pasos:

1. Consultar disponibilidad.
2. Confirmar que ambos recursos tienen disponibilidad.
3. Enviar solicitud.

Esperado:

- [ ] Se presenta disponibilidad preliminar por recurso.
- [ ] Después de enviar abre el detalle.
- [ ] El estado es `PENDING`.
- [ ] Las cantidades y fechas coinciden con lo introducido.
- [ ] La nueva solicitud aparece en el listado y panel Docente.

Guardar el propósito y los primeros ocho caracteres del ID:

```text
Propósito QA:
ID corto:
Fecha/hora:
```

### QA-DOC-06 — Restricciones del detalle

En el detalle de una solicitud propia:

- [ ] Docente puede ver artículos, cantidades, estado y revisión.
- [ ] Docente no ve campos para aprobar o rechazar.
- [ ] Docente no ve acciones para preparar, entregar o devolver.

## 11. Flujo completo del Encargado

Este bloque continúa con la solicitud creada en `QA-DOC-05`. No recargar el seed entre pasos.

### QA-ENC-01 — Bandeja de solicitudes

1. Entrar como Encargado.
2. Abrir “Solicitudes”.

Esperado:

- [ ] Se muestran solicitudes pendientes de revisión.
- [ ] No aparece el botón “Nueva solicitud”.
- [ ] La solicitud de `QA-DOC-05` está presente.

### QA-ENC-02 — Rechazo validado

Usar la solicitud demo pendiente “Práctica de cortes y fondos ecuatorianos” solo si no se utilizará para el recorrido aprobado.

1. Abrir una solicitud pendiente.
2. Seleccionar “Rechazar” sin motivo.
3. Introducir un motivo de prueba y confirmar.

Esperado:

- [ ] Sin motivo, muestra validación y no cambia el estado.
- [ ] Con motivo, muestra confirmación antes de guardar.
- [ ] Después de confirmar, el estado es `REJECTED` y conserva el motivo.
- [ ] Desaparece de la bandeja pendiente.

### QA-ENC-03 — Aprobación total o parcial

1. Abrir la solicitud de `QA-DOC-05`.
2. Escribir una cantidad aprobada para cada artículo.
3. Para aprobación total, usar exactamente las cantidades solicitadas.
4. Confirmar “Aprobar solicitud”.

Esperado:

- [ ] Ninguna cantidad supera lo solicitado.
- [ ] Cantidades menores producen `PARTIALLY_APPROVED`.
- [ ] Cantidades completas producen `APPROVED`.
- [ ] Se crea la reserva sin duplicar stock.
- [ ] Aparece la acción “Iniciar preparación”.

### QA-ENC-04 — Preparación

1. Abrir “Iniciar preparación”.
2. Confirmar el inicio.
3. Revisar cantidades precargadas.
4. Intentar finalizar con una cantidad distinta a la reservada.
5. Restaurar las cantidades exactas.
6. Confirmar “Registrar y finalizar preparación”.

Esperado:

- [ ] El estado cambia primero a `PREPARING`.
- [ ] No permite finalizar con faltantes o excesos.
- [ ] La confirmación explica el efecto de la operación.
- [ ] Al finalizar, el estado es `PREPARED`.
- [ ] La solicitud aparece en “Entregas”.

### QA-ENC-05 — Inspección de salida

1. Abrir la solicitud desde “Entregas”.
2. Revisar artículos preparados.
3. Registrar notas: `Inspección QA sin novedades`.
4. Confirmar la inspección.

Esperado:

- [ ] El paso 2 permanece deshabilitado antes de inspeccionar.
- [ ] La inspección requiere confirmación.
- [ ] Después de registrar aparece la marca “Registrada”.
- [ ] Se habilita “Generar token temporal”.

### QA-ENC-06 — Token y entrega

1. Generar el token temporal.
2. Confirmar que muestra cuenta regresiva.
3. Escribir “Estudiante QA autorizado” como persona que retira.
4. Para cada artículo por cantidad, verificar que la suma distribuida entre ubicaciones sea exactamente la cantidad preparada.
5. Probar temporalmente una suma incorrecta.
6. Restaurar la suma correcta y confirmar la entrega.

Esperado:

- [ ] No permite entregar con distribución incorrecta.
- [ ] No permite entregar sin indicar quién retira.
- [ ] Un token vencido no puede utilizarse.
- [ ] La entrega válida crea un préstamo activo.
- [ ] El stock disminuye exactamente en las cantidades entregadas.
- [ ] La solicitud cambia a `DELIVERED`.

Guardar el ID del préstamo:

```text
ID corto del préstamo:
Persona que retiró:
Hora de entrega:
```

### QA-ENC-07 — Visibilidad del préstamo para Docente

1. Cerrar sesión e ingresar como Docente.
2. Abrir “Mis préstamos”.

Esperado:

- [ ] Activos aumenta en uno.
- [ ] El nuevo préstamo aparece asociado al propósito correcto.
- [ ] Se muestra “Estudiante QA autorizado” como quien retiró.
- [ ] Docente puede consultar, pero no registrar la devolución.

### QA-ENC-08 — Devolución parcial

1. Volver a entrar como Encargado.
2. Abrir “Préstamos y devoluciones”.
3. Seleccionar el préstamo activo.
4. Introducir quién devuelve.
5. Devolver solo parte de uno de los artículos.
6. Confirmar.

Esperado:

- [ ] No permite cantidades mayores a lo pendiente.
- [ ] Registra la devolución parcial.
- [ ] El estado del préstamo queda `PARTIALLY_RETURNED`.
- [ ] El stock aumenta solo por la cantidad devuelta.
- [ ] La cantidad restante continúa visible como pendiente.

### QA-ENC-09 — Devolución final e inspección

1. Abrir nuevamente el préstamo.
2. Registrar todas las cantidades pendientes.
3. Usar “Estudiante QA autorizado” como quien devuelve.
4. Añadir notas: `Recepción QA completa`.
5. Completar la inspección sin novedad.
6. Confirmar.

Esperado:

- [ ] El stock regresa a su valor esperado.
- [ ] El préstamo cambia a `CLOSED`.
- [ ] La solicitud cambia a `CLOSED`.
- [ ] El préstamo deja de aparecer como activo para Encargado.
- [ ] El préstamo permanece en el historial del Docente como “Devuelto”.

## 12. Inventario y stock

### QA-INV-01 — Galería y filtros

1. Entrar como Encargado o Administrador.
2. Abrir “Inventario y stock”.
3. Buscar `batidora`.
4. Filtrar por categoría.
5. Buscar un texto inexistente.

Esperado:

- [ ] Las imágenes cargan sin deformarse.
- [ ] La búsqueda filtra por nombre o código.
- [ ] El filtro de categoría combina correctamente con la búsqueda.
- [ ] Sin coincidencias aparece un estado vacío útil.
- [ ] Las tarjetas muestran código, seguimiento, condición y cantidad.

### QA-INV-02 — Gestión de catálogos

En “Gestionar inventario”, comprobar:

- [ ] Crear y editar categoría.
- [ ] Crear y editar ubicación.
- [ ] Crear artículo por cantidad.
- [ ] Crear artículo individual.
- [ ] Crear unidad individual con etiqueta única.
- [ ] Desactivar y reactivar registros con confirmación.
- [ ] Los registros inactivos conservan historial.

Usar el prefijo `QA-` en nombres y códigos para identificarlos después.

### QA-INV-03 — Movimiento de stock

1. Seleccionar un artículo por cantidad.
2. Registrar un ingreso o ajuste controlado.
3. Anotar el stock anterior y posterior.

Esperado:

- [ ] El balance cambia exactamente por el movimiento.
- [ ] No permite cantidades inválidas.
- [ ] El movimiento aparece en Kardex/Reportes.
- [ ] No permite modificar stock desde una cuenta Docente.

### QA-INV-04 — Unidad e historial

1. Abrir un artículo individual.
2. Abrir una unidad.

Esperado:

- [ ] Se muestran etiqueta, serie, estado y condición.
- [ ] El historial está ordenado por fecha.
- [ ] Los cambios de mantenimiento o préstamo quedan registrados.

## 13. Incidencias y mantenimiento

### QA-INC-01 — Listado de incidencias

1. Entrar como Encargado.
2. Abrir “Incidencias”.

Esperado:

- [ ] Aparece la incidencia demo de severidad alta.
- [ ] Muestra solicitud, préstamo si existe, tipo, severidad, descripción e impacto.
- [ ] Una incidencia que bloquea marca la unidad como no disponible.
- [ ] Las evidencias, cuando existen, utilizan enlaces temporales.

### QA-INC-02 — Incidencia durante retorno

Requiere un préstamo con unidad individual.

1. Durante la inspección de devolución, marcar condición dañada.
2. Elegir un tipo de novedad.
3. Elegir severidad alta.
4. Escribir una descripción.
5. Opcionalmente adjuntar JPEG, PNG o WebP menor a 10 MB.
6. Completar la inspección.

Esperado:

- [ ] La descripción es obligatoria cuando hay novedad.
- [ ] La incidencia aparece en el listado.
- [ ] La unidad no queda disponible si la novedad lo requiere.
- [ ] El archivo no es público y se abre mediante URL firmada.

### QA-MAN-01 — Mantenimiento

1. Abrir “Mantenimiento”.
2. Confirmar que existe el mantenimiento demo abierto.
3. Crear una intervención para una unidad elegible con prefijo `QA` en el motivo.
4. Cerrar la intervención indicando resolución, estado y condición final.

Esperado:

- [ ] Una unidad prestada no puede seleccionarse.
- [ ] Abrir mantenimiento cambia la disponibilidad de la unidad.
- [ ] Completar o cancelar pide confirmación.
- [ ] El estado y condición final coinciden con lo seleccionado.
- [ ] La intervención permanece en el historial.

## 14. Reportes y auditoría

### QA-REP-01 — Reportes del Encargado

Abrir cada pestaña:

- [ ] Solicitudes.
- [ ] Préstamos.
- [ ] Stock / Inventario.
- [ ] Novedades.
- [ ] Kardex.

Esperado:

- [ ] Cada pestaña termina la carga.
- [ ] Las columnas corresponden al reporte seleccionado.
- [ ] El flujo QA recién ejecutado aparece en solicitudes, préstamos y Kardex.
- [ ] No hay datos duplicados por una sola operación.

### QA-AUD-01 — Auditoría del Administrador

1. Entrar como Administrador.
2. Abrir “Auditoría”.
3. Buscar los eventos del flujo QA.

Esperado:

- [ ] El menú y la ruta solo están disponibles para Administrador.
- [ ] Registra creación/revisión/preparación/entrega/devolución según corresponda.
- [ ] Incluye fecha, actor y entidad suficiente para reconstruir el evento.
- [ ] Encargado recibe 403 si intenta abrir la URL manualmente.

## 15. Administración

### QA-ADM-01 — Usuarios y roles

1. Entrar como Administrador.
2. Abrir “Usuarios”.
3. Crear un usuario con correo `qa+fecha@example.test`.
4. Asignar Docente.
5. Cambiar a Encargado.
6. Desactivar y reactivar la cuenta.

Esperado:

- [ ] Correo y contraseña cumplen validaciones.
- [ ] Los roles guardados coinciden con la selección.
- [ ] La cuenta inactiva no puede operar.
- [ ] No se puede dejar el sistema sin un Administrador activo si existe esa regla.
- [ ] La contraseña no vuelve a mostrarse después de crear el usuario.

### QA-ADM-02 — Configuración académica

Usar prefijo `QA` y probar:

- [ ] Crear/editar/desactivar período.
- [ ] Crear/editar/desactivar materia.
- [ ] Crear/editar/desactivar laboratorio.
- [ ] Crear perfil Docente.
- [ ] Crear curso/paralelo asociado a materia, docente y período.
- [ ] Los registros inactivos no aparecen en nuevas solicitudes.
- [ ] El historial existente sigue siendo legible.

## 16. UX, responsive y accesibilidad

Ejecutar al menos en 390 × 844, 768 × 1024 y 1440 × 900.

### QA-UX-01 — Diseño responsive

- [ ] No existe desplazamiento horizontal inesperado.
- [ ] Tablas extensas tienen su propio desplazamiento.
- [ ] Botones importantes permanecen visibles y tocables.
- [ ] Modales caben en pantalla y permiten cerrar/cancelar.
- [ ] Menú móvil no tapa permanentemente el contenido.
- [ ] Tarjetas no generan grandes espacios vacíos.
- [ ] Imágenes mantienen proporción y texto alternativo.

### QA-UX-02 — Estados del sistema

En cada módulo principal:

- [ ] Existe estado de carga.
- [ ] Existe estado vacío.
- [ ] Existe mensaje de error entendible.
- [ ] Acciones deshabilitadas explican o reflejan su condición.
- [ ] Una operación exitosa actualiza la pantalla sin recarga forzada.

### QA-A11Y-01 — Teclado

1. Usar solamente `Tab`, `Shift+Tab`, `Enter`, `Space` y `Escape`.

Esperado:

- [ ] El orden del foco sigue el orden visual.
- [ ] El foco es visible.
- [ ] Botones, enlaces, campos, selectores y menú son operables.
- [ ] El foco no queda atrapado fuera de un modal.
- [ ] Al cerrar un modal, el foco vuelve a un lugar lógico.

### QA-A11Y-02 — Semántica y lectura

- [ ] Cada página tiene un encabezado principal claro.
- [ ] Campos tienen etiqueta asociada.
- [ ] Iconos sin texto tienen nombre accesible o son decorativos.
- [ ] Errores usan un anuncio perceptible (`role=alert` cuando corresponde).
- [ ] El contraste permite leer texto, estados y botones.
- [ ] El color no es el único indicador de estado.

## 17. Resiliencia y errores

### QA-ERR-01 — Backend detenido

1. Con sesión abierta, detener FastAPI.
2. Recargar un módulo que consulta datos.

Esperado:

- [ ] Muestra un error controlado.
- [ ] No queda una pantalla totalmente vacía.
- [ ] No borra la sesión sin motivo.
- [ ] Al reiniciar FastAPI se puede reintentar o recargar.

### QA-ERR-02 — Supabase detenido

1. Detener Supabase local solo después de terminar el flujo funcional.
2. Abrir login o recargar datos.

Esperado:

- [ ] Muestra un mensaje controlado.
- [ ] No expone trazas, secretos ni respuestas internas completas.

Volver a iniciar con:

```bash
cd /Users/hernandezaxel/proyectos/Gastronimia
./frontend/node_modules/.bin/supabase start
```

## 18. Regresión automatizada

Ejecutar desde la raíz con Docker activo:

```bash
npm run lint:frontend
npm run typecheck:frontend
npm run test:frontend

source backend/.venv/bin/activate
npm run lint:backend
npm run typecheck:backend
npm run test:backend

npm run test:e2e
```

Después del E2E, restaurar los datos manuales:

```bash
npm run seed:demo
```

Resultados:

| Validación | Resultado | Evidencia |
| --- | --- | --- |
| ESLint frontend | | |
| TypeScript frontend | | |
| Vitest frontend | | |
| Build frontend | | |
| Ruff backend | | |
| mypy backend | | |
| pytest backend | | |
| Cypress E2E | | |

## 19. Plantilla de defecto

```markdown
### BUG-[número] — [título breve]

- Severidad: Crítica / Alta / Media / Baja
- Estado: Nuevo / En revisión / Corregido / Verificado
- Rol:
- URL:
- Navegador y tamaño:
- Datos utilizados:

Pasos para reproducir:
1.
2.
3.

Resultado actual:

Resultado esperado:

Evidencia:

Error de consola o terminal:
```

## 20. Cierre del ciclo

Antes de aprobar:

- [ ] El flujo Docente → Encargado → préstamo → devolución → historial terminó correctamente.
- [ ] Todos los controles de permisos fueron comprobados por menú y URL directa.
- [ ] No hay errores de consola sin justificar.
- [ ] No se observaron secretos en navegador, capturas o logs.
- [ ] El inventario quedó consistente después de la devolución.
- [ ] Los eventos aparecen en reportes y auditoría según el rol.
- [ ] La interfaz fue revisada en móvil, tableta y escritorio.
- [ ] Todos los defectos críticos y altos están cerrados y verificados.

Firma QA: ____________________

Fecha: ____________________

Observaciones finales:

```text



```
