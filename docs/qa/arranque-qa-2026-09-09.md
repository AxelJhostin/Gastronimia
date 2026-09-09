# Arranque de QA — actualizado el 9 de septiembre de 2026

Esta es la hoja de trabajo para retomar el proyecto. La regresión automatizada actual está **aprobada: 137/137 comprobaciones Cypress pasan**. Los cinco defectos detectados el 8 de septiembre quedaron corregidos y verificados; no hay fallos automatizados conocidos pendientes de corregir. El entorno Cloud también quedó preparado para una prueba exploratoria manual entre los tres roles.

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

## Credenciales de QA

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `axel@gmail.com` | `axelaxel` |
| Encargado | `encargado@gastronomia.test` | `Prueba-Encargado-2026!` |
| Docente | `docente@gastronomia.test` | `Prueba-Docente-2026!` |

En local, estas cuentas se crean/actualizan mediante `npm run seed:demo`. El 9 de
septiembre de 2026 también se provisionaron temporalmente en Cloud para QA
exploratorio. Son credenciales compartidas de prueba: no reutilizarlas para una
cuenta personal, no publicarlas fuera del equipo y eliminarlas o rotarlas antes
de producción.

## Estado de la base local después de la limpieza

El 9 de septiembre de 2026 se eliminó el residuo de la ejecución QA local:

- `auth.users`: 3 cuentas;
- `public.users`: 3 perfiles activos;
- `public.user_roles`: 3 asignaciones, una por cuenta;
- tablas funcionales: vacías;
- bucket privado `evidence`: conservado, con 0 objetos.

Se verificó el login y `GET /api/v1/auth/me` para Administrador, Encargado y
Docente. No ejecutar `npm run seed:demo`, `npm run test:qa` ni `npm run test:e2e`
si se necesita conservar esta base vacía: los dos primeros agregan datos y el
último restablece por completo la base local.

La cuenta Docente conserva su usuario y rol, pero no tiene todavía ficha
académica, período, asignatura, sección, laboratorio ni inventario. Es el estado
esperado de una base limpia; esos datos deben configurarse desde Administración
antes de recorrer el flujo docente.

## Preparación de Supabase Cloud para QA exploratorio

El despliegue público responde correctamente en la portada y en el endpoint de
salud, el login se comunica con Auth y CORS acepta el origen del frontend. La
conexión de solo lectura al proyecto Cloud también quedó verificada:

- las 36 migraciones locales están aplicadas en Cloud;
- el `dry-run` posterior confirma que la base remota está actualizada;
- el lint remoto no presenta errores;
- las 39 tablas públicas tienen RLS;
- las 7 vistas públicas usan `security_invoker`;
- el asesor de rendimiento no presenta hallazgos;
- las tres cuentas QA tienen perfil activo y exactamente un rol: `ADMIN`,
  `MANAGER` o `TEACHER`, según corresponde;
- los tres inicios de sesión pasan contra Supabase Auth y el backend desplegado.

Auth Cloud tiene ahora 8 usuarios y 8 perfiles; dos altas quedaron registradas
en `user_provisioning_records`. El conjunto Cloud contiene 5 períodos, 2
asignaturas, 2 laboratorios, 2 docentes, 8 ítems de inventario y el paralelo
activo `QA-EXP-01` (período iniciado el 1 de septiembre de 2026, asignado a
`docente@gastronomia.test`). No contiene solicitudes, préstamos, devoluciones ni
archivos, de modo que la exploración empieza limpia.

Se verificó con la sesión real de Docente que el formulario de solicitud recibe
1 paralelo, 2 laboratorios y 8 artículos activos. Por tanto, el recorrido
Docente → Encargado ya está habilitado en Cloud.

Los dos avisos informativos por tablas sin políticas corresponden a
`equipment_delivery_qr_tokens` y `user_provisioning_records`: ambas están
reservadas a `service_role` y no tienen permisos para `anon` o `authenticated`.
Queda una advertencia de seguridad no bloqueante para QA: antes de producción se
debe habilitar en Auth la protección contra contraseñas filtradas y rotar o
eliminar estas cuentas compartidas.

Cambios aplicados en Cloud durante esta preparación: tres migraciones versionadas,
las dos cuentas QA faltantes, su perfil/rol, una ficha académica de Docente y el
paralelo `QA-EXP-01`. No se cargaron seeds ni movimientos operativos.

## Guía para la prueba exploratoria en Cloud

Usar únicamente la URL pública: [Gastronomía QA](https://pucesmgastronomia.vercel.app/).
No se requiere abrir Docker, terminales ni ejecutar Cypress. Esta guía usa las
credenciales de QA de la tabla anterior y deja los registros de prueba en Cloud.

1. **Administrador:** iniciar sesión, abrir **Académico** y comprobar que el
   perfil `QA-DOC-2026` y el paralelo activo `QA-EXP-01` existen. No editar ni
   desactivar estos datos; son la precondición del flujo.
2. **Docente:** iniciar sesión, ir a **Solicitudes** y crear una solicitud. Debe
   aparecer el paralelo `QA-EXP-01`, dos laboratorios y ocho artículos. Elegir
   al menos un artículo, usar un horario con fin posterior al inicio, consultar
   disponibilidad y enviar. En el propósito escribir un identificador único,
   por ejemplo `QA-EXP-<iniciales>-<fecha>`, y anotar el enlace o identificador
   de la solicitud creada.
3. **Encargado:** cerrar sesión e iniciar como Encargado. En **Solicitudes** debe
   aparecer la solicitud pendiente. Abrirla, aprobar las cantidades (total o
   parcial) y confirmar. Continuar por **Preparación**, registrar cantidades
   válidas y completar la preparación; después entrar en **Entregas**, hacer la
   inspección de salida y registrar la entrega. La solicitud debe avanzar por
   `PENDING` → `APPROVED`/`PARTIALLY_APPROVED` → `PREPARED` → préstamo activo.
4. **Docente:** volver a iniciar sesión y comprobar la solicitud y el préstamo
   en **Mis préstamos**. Esto confirma que el historial pertenece al Docente y
   no al Encargado.
5. **Encargado:** desde **Devoluciones**, abrir el préstamo, inspeccionar los
   artículos y registrar una devolución total o parcial. Comprobar el cambio de
   estado y el stock; si fue parcial, completar después la devolución restante.
6. **Administrador:** comprobar en **Auditoría** que se registraron los eventos
   del recorrido. Probar además que Docente y Encargado no puedan acceder a esa
   sección.

Registrar para cada observación: rol, URL, hora, resultado esperado, resultado
real, identificador `QA-EXP-*` y una captura. Si aparece un defecto, no borrar
la solicitud ni los registros relacionados; reportarlos con ese identificador
para conservar la evidencia.

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
