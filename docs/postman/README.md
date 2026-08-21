# Pruebas con Postman

Importa la colección `Gastronomia.postman_collection.json` y duplica el archivo de entorno plantilla en Postman. Completa las variables únicamente en tu entorno local: no subas una variante con claves, tokens o contraseñas.

## Una sola ejecución en Collection Runner

El error mostrado anteriormente se produce si el Runner tiene **Environment: none**: Postman deja `{{api_base_url}}` sin resolver. La colección ahora muestra un mensaje claro en ese caso.

1. En Postman importa la colección y el archivo `Gastronomia.local.postman_environment.template.json`.
2. Duplica el entorno importado, completa `supabase_url`, `supabase_publishable_key`, `admin_email` y `admin_password`.
3. Verifica que `api_base_url` sea `http://127.0.0.1:8000`.
4. Inicia FastAPI en otra terminal: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`.
5. Pulsa **Run collection** y, en la esquina superior derecha, selecciona tu entorno duplicado. No uses `none`.
6. Ejecuta una iteración. La colección conserva automáticamente `access_token`, `admin_user_id` y `academic_period_id` durante el recorrido.

Antes de correrla, el usuario configurado debe existir en Supabase Auth y tener el rol `ADMIN` dentro de la aplicación. La colección comprueba login, perfil, autorización, rechazo sin token y creación académica en el orden correcto.

## Ejecución por terminal con Newman

También se puede lanzar toda la colección sin abrir Postman. Usa una copia local del environment, nunca la plantilla con secretos:

```bash
npx newman@6 run docs/postman/Gastronomia.postman_collection.json \
  -e /ruta/privada/Gastronomia.local.postman_environment.json \
  --bail
```

`--bail` detiene la ejecución en el primer fallo y devuelve un código de error útil para CI.

Orden de ejecución:

1. Inicia FastAPI en `http://127.0.0.1:8000`.
2. Ejecuta **Health / API health**.
3. Ejecuta **Auth / Login administrador**; guarda el token y UUID automáticamente.
4. Ejecuta **Auth / Mi perfil y roles**.
5. Ejecuta las solicitudes de **Administración**.

La solicitud de creación genera un período de prueba con una marca de tiempo. Elimina esos datos desde la operación administrativa correspondiente cuando esa funcionalidad esté disponible.

La publishable key se usa solo para iniciar sesión. No uses la secret key, la service role ni la contraseña de la base de datos en Postman.
