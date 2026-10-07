# Cierre local de R-01: contraseña temporal

Fecha: **7 de octubre de 2026**, America/Guayaquil. Estado: **corregido y verificado en local**.

El endpoint de finalización permitía retirar la obligación de cambiar la contraseña sin demostrar que se hubiera cambiado. Ahora recibe la nueva contraseña y usa la sesión del usuario autenticado para guardarla en Supabase Auth. Solo después de una respuesta satisfactoria actualiza `must_change_password` a `false` para esa misma identidad.

## Comportamiento comprobado

- Una petición sin contraseña recibe 422 y conserva la obligación.
- Reutilizar la contraseña temporal recibe 422; el acceso operativo sigue bloqueado.
- La validación de entrada acepta entre 8 y 128 caracteres; Supabase aplica además su política de contraseña. Las respuestas de validación no reflejan la contraseña enviada.
- Fallos de autenticación, rechazo de contraseña o indisponibilidad durante el primer paso no ejecutan la actualización de la marca.
- El cambio válido renueva la sesión y guarda el token actualizado que consume la API de la aplicación.
- Al cerrar sesión, la contraseña temporal deja de permitir el ingreso y la nueva contraseña sí lo permite.
- Si falla la renovación de sesión, la interfaz limpia los tokens de acceso de la aplicación y dirige al inicio de sesión.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Backend: pytest | 109 aprobadas; 2 integraciones optativas omitidas en esta ejecución |
| Cobertura backend | 83,20 % |
| Backend: Ruff y mypy | Aprobados |
| Frontend: Vitest | 32 aprobadas en 15 archivos |
| Frontend: lint, tipos de aplicación y Cypress | Aprobados |
| Compilación de producción | Aprobada |
| Cypress completo contra servicios locales reales | **142/142 aprobadas**, 10 archivos, sin fallos, omisiones ni reintentos |

La prueba nueva crea una cuenta identificable de QA, recorre el acceso con contraseña temporal, intenta omitir el cambio y reutilizar la contraseña, completa el cambio desde la interfaz, accede al inventario con la sesión renovada y verifica ambos intentos posteriores de ingreso. La suite completa también conserva las comprobaciones de permisos de auditoría de R-02 y del ciclo de préstamos.

Evidencia automatizada: [resultado Cypress](./evidencia-r01-2026-10-07.json). Las dos integraciones optativas habían pasado en el bloque inicial; no se contabilizan como ejecutadas de nuevo en este cierre.

## Recuperación y alcance

Guardar la contraseña y retirar la obligación son dos solicitudes distintas a Auth, no una operación atómica. Si la contraseña se guarda pero la segunda solicitud falla, la API devuelve un mensaje explícito: ingresar con la nueva contraseña y, si vuelve a solicitarse el cambio, elegir otra distinta para completarlo. Este fallo parcial está cubierto por una prueba del servidor con el servicio simulado.

El cliente y el servidor deben desplegarse juntos: `POST /auth/password-change-complete` ahora requiere el cuerpo `{"password":"…"}` y el cliente ya no cambia la contraseña por su cuenta antes de llamarlo. Ver el [contrato actualizado](../frontend/contrato-backend-supabase.md). La actualización usa la operación de [contraseña del usuario autenticado de Supabase](https://supabase.com/docs/reference/javascript/auth-updateuser).

No se aplicaron migraciones ni se desplegó a un entorno remoto para este punto. La prueba utiliza una cuenta nueva de QA en la base local. La revisión manual integral del alta de usuarios y la protección del último administrador permanecen pendientes en su bloque correspondiente.

Siguiente punto del [seguimiento vigente](../roadmap/seguimiento-cierre-mvp.md): **1.3 / R-03, protección de los estados de unidades de inventario**.
