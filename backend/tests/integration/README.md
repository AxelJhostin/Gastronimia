# Pruebas reales de integración

Estas pruebas verifican el recorrido real Supabase Auth → JWT → FastAPI → roles. No crean, modifican ni borran datos; se ejecutan únicamente cuando se habilitan explícitamente.

Requisitos:

- FastAPI levantado localmente en el puerto 8000.
- Un proyecto Supabase de pruebas, separado de producción, o Supabase local.
- `backend/.env` configurado para ese entorno aislado.
- Un usuario real de Supabase Auth con rol `ADMIN` de la aplicación.
- Para Supabase local, Docker debe estar instalado y en ejecución.

Preparación desde `backend/`:

```bash
cp .env.integration.example .env.integration
# Completa TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD con la cuenta ADMIN de pruebas.
```

Ejecutar desde `backend/`:

```bash
set -a
source .env
source .env.integration
set +a
python -m pytest tests/integration -m integration --no-cov
```

No se guardan esos valores en el repositorio. Estas pruebas validan salud, login, JWT, `/auth/me`, autorización administrativa y rechazo sin token.

La cobertura se mide al ejecutar la suite unitaria completa. Estas pruebas consumen
una API ya levantada, por lo que se ejecutan sin cobertura para no alterar ese
umbral.
