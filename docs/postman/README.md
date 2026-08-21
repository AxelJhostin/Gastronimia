# Pruebas con Postman

Importa la colección `Gastronomia.postman_collection.json` y duplica el archivo de entorno plantilla en Postman. Completa las variables únicamente en tu entorno local: no subas una variante con claves, tokens o contraseñas.

Orden de ejecución:

1. Inicia FastAPI en `http://127.0.0.1:8000`.
2. Ejecuta **Health / API health**.
3. Ejecuta **Auth / Login administrador**; guarda el token y UUID automáticamente.
4. Ejecuta **Auth / Mi perfil y roles**.
5. Ejecuta las solicitudes de **Administración**.

La solicitud de creación genera un período de prueba con una marca de tiempo. Elimina esos datos desde la operación administrativa correspondiente cuando esa funcionalidad esté disponible.

La publishable key se usa solo para iniciar sesión. No uses la secret key, la service role ni la contraseña de la base de datos en Postman.
