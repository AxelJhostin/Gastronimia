# Componentes de interfaz

Base visual reutilizable de Gastronomía, alineada con los tokens de Stitch. No contiene datos, endpoints ni reglas de negocio.

Importar desde `@/components/ui`. Incluye botones, controles de formulario, badges, tarjetas, encabezados, tablas, búsqueda, filtros, paginación, notificaciones, modal, estados de carga/vacío/error/sin permiso, diálogo de confirmación, métricas, gráficos de barras/distribución, actividad y alertas.

Los módulos de dominio deben componer estos elementos desde fuera de esta carpeta; no se deben añadir aquí llamadas a FastAPI ni Supabase.

Los componentes de patrón operativo están en `@/components/domain/operations`: roles, estados oficiales de solicitud, selector de roles, timeline y disponibilidad. El shell responsive está en `@/components/layout/app-shell`.

## Catálogo visual

Durante desarrollo, visitar `/ui` para revisar las variantes y los estados de los componentes. La ruta responde como 404 en producción y no debe usarse como una pantalla funcional.
