# Entorno, colaboración y despliegue

## Archivos locales

Cada integrante debe copiar las plantillas, sin subir los archivos reales:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Después debe sustituir todos los valores de ejemplo. `frontend/.env.local` puede contener exclusivamente valores públicos. `backend/.env` incluye secretos y no se comparte por chat ni se versiona.

## Supabase

1. Crear un proyecto compartido de Supabase.
2. Obtener URL, publishable key y service-role key desde **Connect**.
3. Configurar las dos primeras en el frontend y las tres en el backend.
4. Aplicar las migraciones SQL que se crearán en `supabase/migrations/`.
5. Activar RLS y definir políticas por rol antes de exponer módulos funcionales.
6. Crear un bucket privado para evidencias cuando se implemente ese módulo.

## Vercel

Se recomiendan dos proyectos de Vercel conectados al mismo repositorio:

| Proyecto | Root Directory | Build / runtime |
| --- | --- | --- |
| `gastronomia-web` | `frontend` | Next.js detectado automáticamente. |
| `gastronomia-api` | `backend` | Python/FastAPI, entrada `api/index.py`. |

Configurar las variables de cada servicio en Vercel, nunca en el código. En el frontend, `NEXT_PUBLIC_API_BASE_URL` debe apuntar a la URL pública de `gastronomia-api`. En el backend, `BACKEND_CORS_ORIGINS` debe incluir la URL exacta del frontend desplegado.

> Las funciones serverless de Vercel son adecuadas para la API HTTP. Las transacciones críticas deben ejecutarse en PostgreSQL/RPC para que no dependan de la vida de una función.

## Trabajo entre dos personas

- Usar una rama por cambio: `feat/inventario`, `feat/solicitudes`, `fix/...`.
- No mezclar cambios funcionales con refactorizaciones extensas en un mismo pull request.
- Ejecutar las validaciones indicadas en el README antes de abrir un PR.
- Revisar mutuamente las migraciones, RLS y cambios que afecten autorizaciones.
