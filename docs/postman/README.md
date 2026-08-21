# Pruebas manuales con Postman

Importa la colección `Gastronomia.postman_collection.json` y duplica el archivo de entorno plantilla en Postman. Completa las variables únicamente en tu entorno local: no subas una variante con claves, tokens o contraseñas.

## Preparación

El error mostrado anteriormente se produce si Postman tiene **Environment: none**: deja `{{api_base_url}}` sin resolver. Selecciona siempre el entorno duplicado.

1. En Postman importa la colección y el archivo `Gastronomia.local.postman_environment.template.json`.
2. Duplica el entorno importado, completa `supabase_url`, `supabase_publishable_key`, `admin_email` y `admin_password`.
3. Verifica que `api_base_url` sea `http://127.0.0.1:8000`.
4. Inicia FastAPI en otra terminal: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`.
5. En la esquina superior derecha selecciona tu entorno duplicado. No uses `none`.
6. Ejecuta las rutas manualmente, una por una, siguiendo las carpetas `00` a `04`. La colección conserva los UUID creados en el entorno activo.

Antes de empezar, el usuario administrador debe existir en Supabase Auth y tener `ADMIN` dentro de la aplicación. Para probar solicitudes necesitas también un usuario docente existente en Supabase Auth; inicia sesión como docente para guardar `teacher_user_id`, luego asígnale `TEACHER`, crea su perfil y sección.

## Orden de prueba

1. `00. Autenticación`: health, login ADMIN y perfil.
2. `01. Académico`: período, materia, laboratorio, perfil docente y sección.
3. `02. Inventario`: categoría, ubicación, ítem por cantidad, stock y unidad individual.
4. `03. Solicitudes`: login docente, borrador y envío.
5. `04. Operación, mantenimiento y reportes`: prueba cada acción según el estado previo.

La colección crea datos persistentes y hay rutas alternativas (aprobar/rechazar), por lo que no se recomienda correrla completa con Runner o Newman.

## Variables operativas manuales

La API aún no expone un endpoint de detalle de solicitud con los IDs internos de ítem/reserva/préstamo. Para aprobar, preparar y devolver debes copiar desde Supabase los UUID de `equipment_request_item_id`, `equipment_reservation_detail_id` y `equipment_loan_id` si no fueron capturados por una creación anterior. Esto es una limitación actual del contrato de lectura, no de Postman.

## Newman (solo rutas sin efectos o una carpeta concreta)

```bash
npx newman@6 run docs/postman/Gastronomia.postman_collection.json \
  -e /ruta/privada/Gastronomia.local.postman_environment.json \
  --bail
```

La publishable key se usa únicamente para iniciar sesión. No uses la secret key, service role ni contraseña de base de datos en Postman.
