# Sistema de Gestión de Inventario, Préstamos y Trazabilidad para Gastronomía
## Documento 1 — Contexto, especificación funcional y alcance

## 1. Propósito del documento

Este documento define el contexto, problema, objetivos, actores, reglas de negocio, alcance funcional y límites del proyecto de software para la gestión de utensilios, equipos y demás bienes utilizados en las prácticas académicas de Gastronomía.

Su propósito es funcionar como referencia oficial para evitar crecimiento descontrolado del alcance durante diseño, desarrollo y pruebas.

---

## 2. Contexto

Actualmente, el área de Gastronomía de la universidad administra utensilios, equipos y otros bienes utilizados durante las prácticas académicas mediante registros principalmente manuales.

El encargado entrega artículos a docentes o a estudiantes autorizados por ellos, pero el uso de registros físicos dificulta mantener información completa y consistente sobre:

- qué artículo fue solicitado;
- qué cantidad fue entregada;
- qué unidad física concreta fue prestada;
- qué docente es responsable de la práctica;
- quién retiró físicamente los bienes;
- quién realizó la entrega;
- cuándo fueron entregados;
- cuándo deben ser devueltos;
- quién realizó la devolución;
- quién recibió la devolución;
- en qué estado fueron entregados;
- en qué estado regresaron;
- si existieron daños, faltantes u otras novedades;
- si existen equipos en mantenimiento;
- qué recursos están realmente disponibles para una fecha y horario determinados.

El sistema propuesto digitalizará este proceso y proporcionará trazabilidad completa.

---

## 3. Problema

El registro manual presenta riesgos de:

- omisión de información;
- registros incompletos;
- pérdida o deterioro de documentos;
- dificultad para consultar préstamos anteriores;
- dificultad para identificar responsables;
- inconsistencias entre inventario físico y registros;
- desconocimiento de disponibilidad real;
- ausencia de historial por equipo;
- dificultad para documentar daños o faltantes;
- falta de indicadores para mantenimiento y reposición;
- riesgo de reservas incompatibles o préstamos simultáneos.

---

## 4. Pregunta del problema

¿Cómo mejorar el control, disponibilidad y trazabilidad de los utensilios, equipos y demás recursos utilizados en las prácticas académicas de Gastronomía mediante un sistema digital que permita gestionar inventario, reservas, solicitudes, préstamos, devoluciones, novedades y mantenimiento?

---

## 5. Solución propuesta

Se desarrollará una aplicación web responsive y multiplataforma para gestionar el ciclo completo:

```text
Solicitud
   ↓
Validación de disponibilidad
   ↓
Revisión del encargado
   ↓
Aprobación / aprobación parcial / rechazo
   ↓
Reserva
   ↓
Preparación
   ↓
Entrega
   ↓
Préstamo activo
   ↓
Devolución
   ↓
Inspección
   ↓
Novedad, si corresponde
   ↓
Cierre
   ↓
Historial / Kardex / Auditoría
```

La aplicación se utilizará desde:

- computadoras;
- tablets;
- teléfonos;
- navegadores modernos.

Se recomienda implementarla como aplicación web responsive, con posibilidad de evolución hacia PWA.

---

# 6. Objetivo general

Desarrollar un sistema web multiplataforma que permita gestionar y controlar el inventario, solicitudes, reservas, préstamos, devoluciones, novedades, mantenimiento y trazabilidad de los recursos utilizados en las prácticas académicas de Gastronomía.

---

# 7. Objetivos específicos

1. Digitalizar el inventario del área de Gastronomía.
2. Diferenciar artículos administrados por cantidad y artículos individualizados.
3. Permitir a los docentes crear solicitudes para prácticas académicas.
4. Calcular disponibilidad considerando fecha, horario, reservas, préstamos y mantenimiento.
5. Permitir al encargado aprobar, aprobar parcialmente o rechazar solicitudes.
6. Gestionar preparación, entrega y devolución.
7. Identificar mediante QR las solicitudes aprobadas.
8. Registrar al docente responsable del préstamo.
9. Registrar a la persona que retira físicamente los artículos.
10. Registrar a la persona que devuelve los artículos.
11. Mantener evidencia opcional del estado de los equipos.
12. Registrar daños, faltantes, roturas, desgaste y otras novedades.
13. Gestionar mantenimiento básico.
14. Mantener hoja de vida e historial de equipos individualizados.
15. Generar movimientos de inventario y auditoría.
16. Proporcionar dashboards y reportes operativos básicos.

---

# 8. Roles

El sistema tendrá tres roles principales.

## 8.1 Administrador

Responsable de configuración y supervisión.

Puede:

- gestionar usuarios;
- asignar roles;
- administrar información académica;
- gestionar categorías y ubicaciones;
- consultar inventario;
- consultar reportes;
- consultar auditoría;
- administrar configuraciones generales.

---

## 8.2 Encargado

Usuario operativo principal.

Puede:

- gestionar inventario;
- registrar artículos;
- registrar unidades individualizadas;
- consultar disponibilidad;
- revisar solicitudes;
- aprobar, aprobar parcialmente o rechazar;
- preparar artículos;
- registrar entregas;
- registrar quién retira;
- registrar devoluciones;
- registrar quién devuelve;
- inspeccionar artículos;
- registrar fotografías opcionales;
- registrar novedades;
- administrar mantenimiento;
- consultar historial y préstamos activos.

---

## 8.3 Docente

Es el responsable académico formal de la solicitud.

Puede:

- consultar catálogo;
- consultar disponibilidad;
- crear solicitudes;
- seleccionar asignatura, curso, laboratorio, fecha y horario;
- consultar estados;
- consultar historial de sus solicitudes;
- visualizar préstamos asociados;
- visualizar novedades relacionadas;
- presentar el QR correspondiente.

### Regla importante

El docente es el responsable formal aunque otra persona retire los bienes.

---

# 9. Persona que retira y persona que devuelve

La responsabilidad académica y la operación física no son necesariamente la misma cosa.

Se diferenciarán:

1. **Docente responsable**
2. **Persona que retira**
3. **Encargado que entrega**
4. **Persona que devuelve**
5. **Encargado que recibe**

La persona que retira puede ser:

- el docente responsable;
- otro docente autorizado;
- un estudiante enviado por el docente.

La persona que devuelve puede ser distinta a la que retiró.

Ejemplo:

```text
Docente responsable: María López
Retiró: Juan Pérez (estudiante)
Entregó: Carlos Mendoza (encargado)
Devolvió: Ana García (estudiante)
Recibió: Carlos Mendoza (encargado)
```

Los estudiantes no tendrán necesariamente cuentas propias en el MVP.

Cuando un estudiante retire o devuelva se almacenará:

- nombre completo;
- tipo de persona;
- código/matrícula o identificación opcional;
- observación opcional.

---

# 10. Modelo de inventario

Existirán dos tipos de control.

## 10.1 Por cantidad

Para artículos donde no interesa identificar cada unidad.

Ejemplos:

- platos;
- vasos;
- cucharas;
- tenedores;
- bowls;
- recipientes.

Ejemplo:

```text
Plato blanco
Total físico: 120
Reservado: 20
Prestado: 30
Disponible para horario consultado: 70
```

No se crean 120 registros.

---

## 10.2 Individualizado

Para equipos que requieren seguimiento individual.

Ejemplos:

- batidoras;
- licuadoras;
- procesadores;
- balanzas;
- equipos especializados.

Ejemplo:

```text
Batidora KitchenAid
BAT-001
BAT-002
BAT-003
```

Cada unidad mantiene estado, ubicación, historial, novedades y mantenimiento.

---

# 11. Estado físico y disponibilidad

No deben confundirse.

Una unidad puede tener:

```text
Estado físico: GOOD
Disponibilidad: LOANED
```

Condiciones físicas iniciales:

- EXCELLENT
- GOOD
- REGULAR
- DAMAGED

Estados de disponibilidad:

- AVAILABLE
- RESERVED
- LOANED
- INSPECTION
- MAINTENANCE
- UNAVAILABLE
- DECOMMISSIONED

---

# 12. Disponibilidad temporal

La disponibilidad no debe almacenarse como una cifra fija.

Debe calcularse considerando:

- existencia física;
- reservas activas;
- préstamos activos;
- mantenimiento;
- bajas;
- intervalo solicitado.

Ejemplo:

```text
Existencia física: 15 sartenes
Mantenimiento: 3
Reservados para 10:00-12:00: 5
Prestados durante ese horario: 2

Disponibles: 5
```

La disponibilidad deberá verificarse nuevamente en el servidor al momento de aprobar.

---

# 13. Flujo funcional principal

```text
DOCENTE
   |
   +--> Consulta disponibilidad
   |
   +--> Crea solicitud
             |
             v
        PENDIENTE
             |
             v
         ENCARGADO
             |
     +-------+-------+
     |       |       |
     v       v       v
 APROBAR  PARCIAL  RECHAZAR
     |       |
     +---+---+
         |
         v
      RESERVA
         |
         v
    PREPARACIÓN
         |
         v
  ARTÍCULOS LISTOS
         |
         v
       ENTREGA
         |
         +--> Registrar quién retira
         |
         v
    PRÉSTAMO ACTIVO
         |
         v
     DEVOLUCIÓN
         |
         +--> Registrar quién devuelve
         |
         v
     INSPECCIÓN
         |
     +---+---+
     |       |
     v       v
 CORRECTO  NOVEDAD
     |       |
     |       +--> mantenimiento si corresponde
     |
     +---+---+
         |
         v
       CIERRE
         |
         v
 INVENTARIO + HISTORIAL + AUDITORÍA
```

---

# 14. Estados de solicitud

- DRAFT
- PENDING
- APPROVED
- PARTIALLY_APPROVED
- REJECTED
- PREPARING
- PREPARED
- DELIVERED
- COMPLETED
- CANCELLED

Transiciones principales:

```text
DRAFT -> PENDING
PENDING -> APPROVED
PENDING -> PARTIALLY_APPROVED
PENDING -> REJECTED

APPROVED -> PREPARING
PARTIALLY_APPROVED -> PREPARING

PREPARING -> PREPARED
PREPARED -> DELIVERED
DELIVERED -> COMPLETED
```

Una solicitud puede cancelarse únicamente según las reglas definidas para su estado.

---

# 15. Flujo de QR

El QR se genera para identificar la solicitud.

No debe almacenar información sensible directamente.

Debe contener preferentemente:

- identificador público;
- token seguro;
- referencia verificable.

Flujo:

```text
Docente obtiene QR
      ↓
Encargado escanea QR
      ↓
Sistema valida
      ↓
Abre solicitud
      ↓
Comprueba estado
      ↓
Permite preparación, entrega o consulta
```

---

# 16. Fotografías

Las fotografías serán opcionales por defecto.

Podrán vincularse a:

- inspección previa;
- devolución;
- novedad;
- mantenimiento.

No será obligatorio fotografiar todos los objetos.

Las evidencias deberán almacenarse en almacenamiento privado.

---

# 17. Novedades

Tipos:

- MISSING
- DAMAGE
- BREAKAGE
- DIRTY
- INCOMPLETE
- WEAR
- MALFUNCTION
- OTHER

Severidad:

- LOW
- MEDIUM
- HIGH

Estados:

- OPEN
- UNDER_REVIEW
- IN_MAINTENANCE
- RESOLVED
- CLOSED

Una novedad alta podrá dejar una unidad no disponible.

---

# 18. Mantenimiento

Tipos:

- PREVENTIVE
- CORRECTIVE
- INSPECTION

Estados:

- SCHEDULED
- IN_PROGRESS
- COMPLETED
- CANCELLED

Una unidad en mantenimiento no puede prestarse.

---

# 19. Kardex y trazabilidad

Todos los cambios significativos deberán producir movimientos.

Tipos:

- INITIAL_STOCK
- ENTRY
- LOAN_OUT
- RETURN_IN
- ADJUSTMENT
- LOSS
- DECOMMISSION
- REACTIVATION

Debe ser posible reconstruir el historial del inventario.

---

# 20. Auditoría

Se auditarán al menos:

- cambios de inventario;
- ajustes;
- aprobaciones;
- rechazos;
- entregas;
- devoluciones;
- novedades;
- mantenimiento;
- cambios de estado;
- cambios de permisos.

La auditoría debe indicar:

- usuario;
- acción;
- entidad;
- fecha/hora;
- estado anterior;
- estado posterior.

---

# 21. Módulos del sistema

1. Autenticación y seguridad
2. Usuarios y roles
3. Configuración académica
4. Inventario
5. Disponibilidad y reservas
6. Solicitudes
7. Aprobaciones
8. Preparación
9. QR y entregas
10. Préstamos
11. Devoluciones
12. Inspecciones y evidencias
13. Novedades
14. Mantenimiento
15. Kardex e historial
16. Notificaciones internas
17. Dashboard y reportes
18. Auditoría

---

# 22. Reglas de negocio principales

**RN-01.** Toda solicitud debe estar asociada a un docente.

**RN-02.** Toda solicitud debe especificar fecha e intervalo horario.

**RN-03.** No podrán aprobarse cantidades superiores a la disponibilidad.

**RN-04.** La disponibilidad se validará nuevamente al aprobar.

**RN-05.** Un equipo individual no podrá estar en dos préstamos simultáneos.

**RN-06.** Los artículos en mantenimiento no podrán prestarse.

**RN-07.** Los artículos dados de baja no podrán reservarse.

**RN-08.** Una solicitud debe aprobarse antes de prepararse.

**RN-09.** Una solicitud debe estar preparada antes de entregarse.

**RN-10.** Toda entrega debe registrar quién entrega.

**RN-11.** Toda entrega debe registrar quién retira.

**RN-12.** El docente responsable debe conservarse aunque retire un estudiante.

**RN-13.** Toda devolución debe relacionarse con un préstamo.

**RN-14.** Toda devolución debe registrar quién devuelve.

**RN-15.** Toda devolución debe registrar quién recibe.

**RN-16.** Se permitirán devoluciones parciales.

**RN-17.** Una devolución parcial no cierra automáticamente el préstamo.

**RN-18.** Los faltantes requieren una novedad.

**RN-19.** Las fotografías son opcionales.

**RN-20.** Las cantidades no pueden quedar negativas.

**RN-21.** Cancelar una reserva debe liberar los recursos.

**RN-22.** El historial no debe eliminarse físicamente en operaciones normales.

**RN-23.** Los cambios de estado deben seguir transiciones válidas.

**RN-24.** El cierre debe indicar si existieron novedades.

**RN-25.** Las operaciones críticas deberán ejecutarse transaccionalmente.

---

# 23. Requisitos funcionales principales

- RF-01: autenticación.
- RF-02: autorización por rol.
- RF-03: gestión de usuarios.
- RF-04: gestión académica.
- RF-05: gestión de categorías.
- RF-06: gestión de ubicaciones.
- RF-07: gestión de artículos por cantidad.
- RF-08: gestión de artículos individualizados.
- RF-09: consulta de disponibilidad.
- RF-10: creación de solicitudes.
- RF-11: aprobación completa.
- RF-12: aprobación parcial.
- RF-13: rechazo con motivo.
- RF-14: reservas.
- RF-15: preparación.
- RF-16: selección de unidades.
- RF-17: generación de QR.
- RF-18: lectura de QR.
- RF-19: entrega.
- RF-20: registro de persona que retira.
- RF-21: creación de préstamo.
- RF-22: devolución completa.
- RF-23: devolución parcial.
- RF-24: registro de persona que devuelve.
- RF-25: inspecciones.
- RF-26: fotografías opcionales.
- RF-27: novedades.
- RF-28: mantenimiento.
- RF-29: hoja de vida.
- RF-30: movimientos de inventario.
- RF-31: dashboard.
- RF-32: reportes.
- RF-33: auditoría.

---

# 24. Requisitos no funcionales

- Responsive.
- Multiplataforma web.
- Seguridad mediante autenticación y autorización.
- RLS si se utiliza Supabase.
- Transacciones para operaciones críticas.
- Interfaz usable desde teléfono.
- Compatibilidad con navegadores modernos.
- Protección de fotografías.
- Arquitectura modular.
- Historial persistente.
- Escalabilidad razonable.
- Auditoría.
- Prevención de concurrencia.
- Respaldo de base de datos.

---

# 25. Tecnología propuesta

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend y datos
- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- RPC/functions para transacciones críticas

## Archivos
- Supabase Storage privado

## Posible evolución
- PWA

---

# 26. Alcance definitivo del MVP

## Dentro del alcance

- tres roles;
- usuarios;
- docentes;
- configuración académica básica;
- inventario;
- categorías;
- ubicaciones;
- inventario por cantidad;
- inventario individual;
- disponibilidad temporal;
- solicitudes;
- aprobación total/parcial;
- rechazo;
- reserva;
- preparación;
- QR;
- entrega;
- registro de persona que retira;
- préstamos;
- devoluciones;
- devoluciones parciales;
- registro de persona que devuelve;
- inspecciones;
- fotografías opcionales;
- novedades;
- mantenimiento básico;
- Kardex;
- hoja de vida;
- dashboard básico;
- reportes básicos;
- auditoría.

## Fuera del alcance

- compras;
- proveedores;
- contratación pública;
- contabilidad;
- depreciación financiera;
- facturación;
- multas y pagos;
- aplicación Android nativa;
- aplicación iOS nativa;
- inteligencia artificial;
- reconocimiento automático de daños;
- RFID;
- IoT;
- estudiantes con cuenta propia;
- firma electrónica avanzada;
- integración obligatoria con sistemas académicos;
- gestión de recetas;
- gestión de ingredientes consumibles como sistema de compras;
- reservas generales de aulas;
- chat interno;
- módulo de recursos humanos.

---

# 27. Criterio para aceptar nuevas funcionalidades

Toda funcionalidad nueva deberá responder afirmativamente:

> ¿Es necesaria para controlar inventario, solicitud, reserva, préstamo, devolución, novedad, mantenimiento o trazabilidad?

Si la respuesta es no, queda fuera del MVP.

---

# 28. Criterios de éxito

El sistema debe poder responder:

- ¿Qué tenemos?
- ¿Cuánto tenemos?
- ¿Qué está disponible?
- ¿Qué estará disponible en determinada fecha?
- ¿Quién solicitó?
- ¿Qué docente es responsable?
- ¿Quién retiró?
- ¿Quién entregó?
- ¿Qué artículos salieron?
- ¿Qué unidades específicas salieron?
- ¿Cuándo deben regresar?
- ¿Quién devolvió?
- ¿Quién recibió?
- ¿Qué cantidad regresó?
- ¿Qué quedó pendiente?
- ¿En qué estado salió?
- ¿En qué estado regresó?
- ¿Hubo novedades?
- ¿Hay evidencias?
- ¿Qué equipo está en mantenimiento?
- ¿Cuál es el historial de una unidad?
- ¿Quién realizó cada operación?

Si estas preguntas pueden responderse de manera estructurada y trazable, el núcleo del proyecto está correctamente resuelto.
