# Pruebas reales de integración

Estas pruebas verifican el recorrido real Supabase Auth → JWT → FastAPI → roles. No crean, modifican ni borran datos; se ejecutan únicamente cuando se habilitan explícitamente.

Requisitos:

- FastAPI levantado localmente en el puerto 8000.
- `backend/.env` configurado para el proyecto Supabase enlazado.
- Un usuario real de Supabase Auth con rol `ADMIN` de la aplicación.

Ejecutar desde `backend/`:

```bash
RUN_LIVE_TESTS=1 \
TEST_API_BASE_URL=http://127.0.0.1:8000 \
TEST_ADMIN_EMAIL=admin@example.com \
TEST_ADMIN_PASSWORD='contraseña-local' \
python -m pytest tests/integration -m integration
```

No se guardan esos valores en el repositorio. Estas pruebas validan salud, login, JWT, `/auth/me`, autorización administrativa y rechazo sin token.
