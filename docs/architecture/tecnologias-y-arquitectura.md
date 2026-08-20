# Tecnologías y arquitectura

## Decisión tecnológica

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS | Interfaz responsive, SSR y experiencia de usuario. |
| API | FastAPI, Pydantic | Reglas de negocio, operaciones transaccionales y API OpenAPI. |
| Datos | Supabase PostgreSQL | Datos relacionales, Auth, Storage y políticas RLS. |
| Despliegue | Vercel | Dos proyectos: frontend y backend serverless. |
| Calidad | ESLint, TypeScript, Vitest, Ruff, mypy, pytest, GitHub Actions | Prevención automática de errores y regresiones. |

El build de producción usa Webpack de forma explícita. Next.js 16 selecciona Turbopack por defecto, pero Webpack evita incompatibilidades de compilación en entornos locales restringidos y sigue siendo compatible con Vercel.

FastAPI se mantiene como backend porque las reglas de disponibilidad, reservas, préstamos, devoluciones y auditoría son complejas y transaccionales. Separarlo permite probarlas y evolucionarlas sin acoplarlas a las pantallas.

## Límites de responsabilidad

```text
Navegador
  ├─ Next.js: interfaz y sesión de Supabase Auth
  └─ FastAPI: token del usuario y reglas de negocio
       └─ Supabase: PostgreSQL, Auth y Storage privado
```

- El frontend solo utiliza `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y la URL pública.
- `SUPABASE_SERVICE_ROLE_KEY` solo puede existir en FastAPI y en la configuración segura del proveedor.
- Las mutaciones de inventario, reservas, entrega y devolución se implementarán como endpoints FastAPI que invocan transacciones/RPC en PostgreSQL.
- Toda tabla expuesta en `public` tendrá RLS y privilegios mínimos. La API no sustituye estas defensas.

## Estructura de código

```text
frontend/src/
  app/                 rutas y layouts de Next.js
  lib/api/             cliente HTTP para FastAPI
  lib/supabase/        cliente de Supabase Auth
  test/                configuración de pruebas frontend

backend/app/
  api/v1/endpoints/    rutas HTTP versionadas
  core/                configuración y componentes transversales
  (futuro) domains/    reglas por dominio: inventory, requests, loans...
  (futuro) services/   casos de uso y transacciones
  (futuro) repositories/ acceso a datos
```

La API empieza con `/api/v1` para permitir una evolución compatible. La primera ruta, `/api/v1/health`, confirma que la infraestructura funciona.
