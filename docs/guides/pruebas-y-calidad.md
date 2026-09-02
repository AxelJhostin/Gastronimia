# Pruebas y calidad

## Pirámide de pruebas

1. **Unitarias:** validaciones, servicios y transiciones de estado.
2. **API:** endpoints FastAPI y sus respuestas de error/autorización.
3. **Integración:** RPC de Supabase en una base local o de pruebas aislada.
4. **E2E:** flujos críticos con navegador: solicitar, aprobar, entregar y devolver.

Las pruebas unitarias iniciales verifican que cada aplicación puede arrancar. A medida que se agreguen módulos, cada regla de negocio de los documentos funcionales debe contar con una prueba automatizada.

## Comandos

```bash
# Frontend
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build

# Backend (con entorno virtual activado)
cd backend
python -m ruff check app tests
python -m mypy app
python -m pytest

# E2E completo desde la raíz (requiere Docker y backend/.venv)
cd ../
npm run test:e2e
```

## Reglas de calidad

- TypeScript mantiene `strict: true`.
- No se permiten secretos en commits.
- Los endpoints son versionados y usan modelos Pydantic de entrada/salida.
- Los cambios de estado y las cantidades se validan del lado del servidor.
- Una migración debe tener reversibilidad razonable y cubrir sus políticas RLS.
- CI ejecutará análisis estático, pruebas y build antes de integrar cambios.
- Los componentes reutilizables con interacción (por ejemplo, visibilidad de contraseña, modales, paginación o estados) deben contar con pruebas de interfaz accesibles.
- Cypress utiliza Supabase, FastAPI y Next.js reales en localhost. Los specs son
  independientes, preparan datos con identificadores únicos y no aceptan URLs
  remotas para operaciones privilegiadas.
- Los selectores E2E deben priorizar roles, etiquetas accesibles y atributos
  `data-cy` estables cuando el texto visible no sea parte del comportamiento.
- En fallos de CI se conservan screenshots, videos y el log temporal de FastAPI.
- CI ejecuta también el recorrido de integración de FastAPI contra Supabase local
  antes de iniciar los specs E2E.
