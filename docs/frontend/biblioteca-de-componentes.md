# Biblioteca de componentes de frontend

## Propósito

La biblioteca interna traduce el lenguaje visual de Stitch a React, TypeScript y Tailwind CSS reutilizables. No contiene llamadas a FastAPI, Supabase, datos reales ni reglas de autorización; los módulos de cada dominio deben componerla y conservar al backend como autoridad.

## Organización

| Ubicación | Responsabilidad |
| --- | --- |
| frontend/src/components/ui/ | Controles y patrones genéricos: botones, formularios, tablas, modales, toasts, estados, métricas y gráficos. |
| frontend/src/components/domain/ | Componentes ligados al vocabulario de Gastronomía: roles, solicitudes, credenciales e inventario. |
| frontend/src/components/layout/app-shell.tsx | Shell responsive con sidebar y navegación móvil. |
| frontend/src/components/catalog/component-catalog.tsx | Muestra interactiva para desarrollo. |

Importar los controles genéricos desde el alias @/components/ui. Los componentes de dominio se importan directamente desde su archivo.

## Catálogo visual

En desarrollo, iniciar el frontend y abrir /ui. El catálogo permite comprobar variantes, responsive, foco, estados, tablas, métricas y gráficos sin iniciar sesión ni llamar a la API.

Los números de demostración solo existen dentro del catálogo. Nunca deben copiarse a pantallas funcionales: estas deben mostrar una carga, un vacío o datos devueltos por FastAPI.

La ruta /ui responde como 404 en producción.

## Componentes disponibles

- Formularios: Field, Input, InputWithIcon, PasswordInput, PasswordStrength, Select, Textarea y Checkbox.
- Acciones y feedback: Button, Modal, ConfirmDialog, ToastRegion, LoadingState, EmptyState, ErrorState y PermissionDenied.
- Datos: Badge, Card, PageHeader, Table*, SearchField, FilterSelect, Pagination, MetricCard, HorizontalBarChart, DonutChart, ActivityFeed y AlertList.
- Dominio: RolePicker, RoleBadge, RequestStatusBadge, RequestTimeline, AvailabilityIndicator, CredentialCard, InventoryToolbar, InventoryItemCard y UnitStatusSummary.

## Paleta centralizada

La fuente única de colores está en frontend/src/app/globals.css. Los valores con prefijo --gastro- definen superficie, primario, acción, éxito, advertencia, información, error y gráficos. Las clases gastro-* y las clases heredadas stone, amber, emerald, orange, red y white apuntan a esa misma paleta por aliases de compatibilidad.

Para un cambio de marca, editar únicamente los valores de :root en ese archivo. No añadir valores hexadecimales a componentes; si falta un caso semántico, crear un token nuevo.

## Seguridad y permisos

- PasswordInput solo alterna visibilidad local. No persiste ni registra contraseñas.
- CredentialCard debe recibir la contraseña temporal únicamente desde la respuesta de alta y mostrarla una sola vez. No guardar en almacenamiento del navegador.
- InventoryItemCard acepta una URL de imagen real opcional. Para URLs privadas, usar la descarga autenticada correspondiente; no construir URL pública.
- El frontend puede ocultar acciones y mostrar la experiencia 403, pero FastAPI conserva la autorización final.

## Estados de ruta

src/app/forbidden.tsx representa acceso denegado 403 y src/app/not-found.tsx representa una ruta inexistente 404. Ambos reutilizan la experiencia gastronómica de estado. El huevo de Pascua de esa ilustración no modifica la navegación, datos ni permisos.

## Validación

Después de modificar la biblioteca, ejecutar desde frontend: npm run lint, npm run typecheck, npm run test y npm run build.

Cada componente nuevo debe tener estados accesibles y, cuando su comportamiento no sea puramente visual, una prueba de interacción.
