# Guía de skills para construir el frontend

Esta guía es para cualquier persona que trabaje en el frontend, especialmente para mantener una dirección visual y de experiencia de usuario consistente entre las dos integrantes del proyecto.

## Objetivo

Usar las skills como apoyo de diseño, exploración y verificación. No se trata de pedirle a una herramienta que genere pantallas completas sin criterio: cada uso debe partir de los documentos funcionales, resolver una necesidad concreta y terminar en una decisión que podamos mantener en código.

La interfaz debe sentirse propia del sistema de Gastronomía: clara para operar inventario bajo presión, natural para docentes y suficientemente distintiva para no parecer un dashboard genérico generado por IA.

## Skills recomendadas

### `visualize`

Usarla antes de construir un módulo nuevo cuando haya que explorar:

- arquitectura de información;
- flujo de una tarea;
- wireframes de dashboard o formularios;
- comparación de alternativas de navegación;
- estados vacíos, errores y casos de operación;
- responsive entre escritorio, tablet y teléfono.

El resultado esperado es una dirección que podamos traducir a componentes y rutas, no una imagen aislada.

### `browser:control-in-app-browser`

Usarla después de implementar una pantalla para probarla como una persona real:

- navegar el flujo completo;
- revisar responsive;
- comprobar foco, teclado, mensajes de error y estados de carga;
- inspeccionar si la jerarquía visual sigue funcionando con datos reales;
- verificar que no se rompieron pantallas anteriores.

### `imagegen`

Usarla solo cuando el producto necesite un recurso bitmap original, por ejemplo una textura sutil, una ilustración de estado vacío o una imagen editorial. No usarla para reemplazar iconos, logos, componentes o elementos que deben ser accesibles y controlables con HTML/CSS/SVG.

Las imágenes generadas deben tener una función clara y conservar una estética coherente. El sistema no debe depender de imágenes decorativas para comunicar información operativa.

### `sites:sites-building` y `sites:sites-hosting`

No aplican automáticamente a este repositorio. Solo deben usarse si el proyecto incorpora `.openai/hosting.json` o si se decide explícitamente cambiar el flujo de hosting. El despliegue previsto actualmente es Next.js y FastAPI en Vercel.

## Flujo recomendado por módulo

```text
Revisar requisito
    ↓
Definir tarea principal y estados
    ↓
Explorar con visualize
    ↓
Elegir dirección visual y componentes
    ↓
Implementar en Next.js
    ↓
Verificar con browser
    ↓
Probar accesibilidad, responsive y estados límite
    ↓
Documentar decisiones importantes
```

## Qué debe incluir cada exploración

Antes de construir una pantalla, definir:

1. Quién la usa: administrador, encargado o docente.
2. Qué tarea debe completar.
3. Cuál es la información más importante.
4. Qué acción principal debe ser evidente.
5. Qué puede salir mal.
6. Qué ocurre cuando no hay datos.
7. Cómo funciona en teléfono y tablet.
8. Qué estado debe quedar registrado en la API.

## Prompt base para pedir apoyo de diseño

```text
Estamos diseñando el módulo [NOMBRE] del sistema de Gastronomía.

Usuario principal: [ROL]
Tarea principal: [TAREA]
Reglas funcionales relevantes: [REGLAS]
Datos que debe mostrar: [DATOS]
Estados obligatorios: carga, vacío, error, éxito y sin permiso.
Dispositivos: escritorio, tablet y teléfono.

Propón dos alternativas de flujo y una recomendación argumentada.
Prioriza claridad operativa, jerarquía visual, accesibilidad y consistencia.
Evita patrones genéricos de dashboard, exceso de tarjetas, gradientes decorativos,
texto de marketing y elementos visuales que no aporten a la tarea.
No implementes todavía: primero entrega la estructura, los estados y los criterios
para decidir.
```

## Prompt base para verificación en navegador

```text
Prueba el módulo [NOMBRE] como [ROL].

Recorre este flujo: [PASOS].
Comprueba escritorio, tablet y teléfono.
Revisa especialmente: jerarquía, legibilidad, foco de teclado, contraste,
mensajes de error, estados de carga, estado vacío, botones deshabilitados,
scroll y confirmación de acciones destructivas.

Reporta problemas con: severidad, pantalla, paso para reproducir y propuesta de mejora.
No cambies el código hasta separar problemas visuales de problemas funcionales.
```

## Principios visuales del proyecto

- La interfaz debe priorizar la operación y la trazabilidad sobre la decoración.
- Cada pantalla debe tener una acción principal reconocible.
- Las tablas y listas deben favorecer escaneo rápido y acciones contextualizadas.
- Los estados deben comunicarse con texto, iconos y color; nunca solo con color.
- La información de disponibilidad, retrasos, daños y faltantes debe tener jerarquía visible.
- Las animaciones deben explicar cambios de estado y ser discretas.
- Los componentes reutilizables deben estar en una biblioteca interna antes de duplicarse.
- Los formularios largos deben dividirse por intención y conservar el contexto.
- La versión móvil no será una reducción de la desktop: debe priorizar las tareas que ocurren físicamente en bodega o laboratorio.

## Checklist antes de cerrar un módulo

- [ ] Se revisaron los requisitos y reglas de negocio relacionados.
- [ ] Se definieron los estados de carga, vacío, error, éxito y sin permiso.
- [ ] Se probó el flujo con el rol correcto.
- [ ] Se revisó escritorio, tablet y teléfono.
- [ ] Se comprobó teclado, foco y contraste.
- [ ] La interfaz no depende de color o imágenes para comunicar información crítica.
- [ ] Los componentes nuevos pueden reutilizarse.
- [ ] Las llamadas a la API manejan errores y estados de espera.
- [ ] Se agregaron pruebas para la lógica nueva.
- [ ] Las decisiones visuales importantes quedaron documentadas en el pull request.

## Regla para trabajar entre dos personas

Si una integrante usa una skill para proponer un flujo o una dirección visual, debe compartir el resultado en el pull request o en la conversación del equipo junto con la decisión adoptada. Así evitamos que cada una construya una versión distinta del mismo sistema.
