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
3. Configurar URL y publishable key en el frontend. En el backend configurar
   además `SUPABASE_JWKS_URL` y la service-role key.
4. Enlazar el proyecto y revisar las migraciones antes de aplicar cualquier
   cambio. Para no guardar la contraseña de PostgreSQL en el historial del shell:

```bash
read -s "SUPABASE_DB_PASSWORD?Contraseña de la base Cloud: "
echo
export SUPABASE_DB_PASSWORD

supabase link --project-ref <ref>
supabase migration list --linked
supabase db push --linked --dry-run --skip-vault
supabase db lint --linked --level warning
supabase db advisors --linked --type security --level info

unset SUPABASE_DB_PASSWORD
```

5. Revisar el resultado del `dry-run` y solo entonces ejecutar
   `supabase db push --linked`. El bucket privado `evidence`, RLS y las políticas
   por rol ya están versionados en las migraciones.
6. Configurar en **Authentication > URL Configuration** la URL pública del
   frontend como Site URL y como redirect permitido. Para un sistema de cuentas
   institucionales, deshabilitar el registro público y habilitar la protección
   contra contraseñas filtradas antes de invitar usuarios externos a QA.

`db push` despliega el esquema, pero no copia los usuarios de Auth ni los datos
del Supabase local. Las tres cuentas de demostración deben crearse también en el
proyecto Cloud y recibir sus roles/perfiles allí. No reutilizar la service-role
key en el navegador ni compartirla con las personas que realizan pruebas.

## Vercel

Se recomiendan dos proyectos de Vercel conectados al mismo repositorio:

| Proyecto | Root Directory | Build / runtime |
| --- | --- | --- |
| `gastronomia-web` | `frontend` | Next.js detectado automáticamente. |
| `gastronomia-api` | `backend` | Python/FastAPI, entrada `api/index.py`. |

Configurar las variables de cada servicio en Vercel, nunca en el código. En el frontend, `NEXT_PUBLIC_API_BASE_URL` debe apuntar a la URL pública de `gastronomia-api`. En el backend, `BACKEND_CORS_ORIGINS` debe incluir la URL exacta del frontend desplegado.

Antes de entregar el enlace a otra persona, comprobar desde un equipo externo:

- portada, login y `GET /api/v1/health` por HTTPS;
- inicio de sesión con cada rol creado en Cloud;
- CORS desde la URL pública del frontend;
- acceso y descarga firmada del bucket privado `evidence`;
- un recorrido mínimo Docente → Encargado → devolución.

> Las funciones serverless de Vercel son adecuadas para la API HTTP. Las transacciones críticas deben ejecutarse en PostgreSQL/RPC para que no dependan de la vida de una función.

## Trabajo entre dos personas

- Actualmente se trabaja directamente sobre `main` por decisión del equipo; cada bloque terminado se valida, confirma y sube en un commit específico.
- No mezclar cambios funcionales con refactorizaciones extensas en un mismo pull request.
- Ejecutar las validaciones indicadas en el README antes de abrir un PR.
- Revisar mutuamente las migraciones, RLS y cambios que afecten autorizaciones.
