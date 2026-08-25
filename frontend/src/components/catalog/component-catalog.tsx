"use client";

import { useState } from "react";

import {
  AppShell,
  type NavigationItem,
} from "@/components/layout/app-shell";
import {
  AvailabilityIndicator,
  RequestStatusBadge,
  RequestTimeline,
  RoleBadge,
  RolePicker,
  type RoleCode,
} from "@/components/domain/operations";
import {
  Badge,
  Button,
  ConfirmDialog,
  DonutChart,
  EmptyState,
  ErrorState,
  Field,
  FilterSelect,
  Input,
  ActivityFeed,
  AlertList,
  LoadingState,
  HorizontalBarChart,
  MetricCard,
  Modal,
  PageHeader,
  Pagination,
  PermissionDenied,
  SearchField,
  Select,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Textarea,
  ToastRegion,
  Trend,
  type ToastMessage,
} from "@/components/ui";

const navigation: NavigationItem[] = [
  { href: "/ui", label: "Catálogo UI", icon: "◫" },
  { href: "/ui/formularios", label: "Formularios", icon: "⌨" },
  { href: "/ui/datos", label: "Datos y estados", icon: "▤" },
];

function DemoSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-gastro-outline-variant bg-white p-5 shadow-gastro-sm sm:p-6">
      <h2 className="text-xl font-semibold text-gastro-primary">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-gastro-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ComponentCatalog() {
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>(["TEACHER"]);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(tone: ToastMessage["tone"]) {
    const labels = {
      error: "No fue posible guardar los cambios.",
      info: "La información se actualiza mediante API.",
      success: "Cambios guardados correctamente.",
    } as const;
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, title: labels[tone ?? "info"], tone }]);
  }

  return (
    <AppShell
      identity={<Badge tone="role">Desarrollo</Badge>}
      navigation={navigation}
    >
      <div className="space-y-8">
        <PageHeader
          eyebrow="Solo desarrollo"
          title="Catálogo de componentes"
          description="Referencia interna para construir las pantallas de Gastronomía con piezas visuales consistentes. Esta ruta no se publica en producción."
        />

        <DemoSection description="Acciones con jerarquía clara, estados de carga y retroalimentación de foco." title="Botones">
          <div className="flex flex-wrap gap-3">
            <Button>Acción principal</Button>
            <Button variant="secondary">Secundaria</Button>
            <Button variant="ghost">Acción discreta</Button>
            <Button variant="danger">Acción crítica</Button>
            <Button isLoading>Guardando</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
        </DemoSection>

        <DemoSection description="Usar Field con cada control para mantener etiqueta, ayuda y errores consistentes." title="Formularios">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field htmlFor="catalog-email" label="Correo institucional" required>
              <Input id="catalog-email" placeholder="usuario@institucion.edu" type="email" />
            </Field>
            <Field description="Mínimo ocho caracteres." error="Las contraseñas no coinciden." htmlFor="catalog-password" label="Contraseña">
              <Input id="catalog-password" type="password" />
            </Field>
            <Field htmlFor="catalog-select" label="Ubicación">
              <Select defaultValue="">
                <option disabled value="">Selecciona una ubicación</option>
                <option>Laboratorio principal</option>
                <option>Bodega</option>
              </Select>
            </Field>
            <Field htmlFor="catalog-notes" label="Notas">
              <Textarea id="catalog-notes" placeholder="Escribe una observación operativa." />
            </Field>
          </div>
        </DemoSection>

        <DemoSection description="Las etiquetas se alimentarán únicamente con estados que devuelve el backend." title="Badges y estados oficiales">
          <div className="flex flex-wrap gap-2">
            <RoleBadge role="ADMIN" />
            <RoleBadge role="MANAGER" />
            <RoleBadge role="TEACHER" />
            <RequestStatusBadge status="DRAFT" />
            <RequestStatusBadge status="PENDING" />
            <RequestStatusBadge status="APPROVED" />
            <RequestStatusBadge status="REJECTED" />
            <RequestStatusBadge status="PREPARED" />
            <RequestStatusBadge status="DELIVERED" />
          </div>
        </DemoSection>

        <DemoSection description="Los siguientes valores son ficticios y existen únicamente para comprobar cómo se comportan los componentes con cifras, alertas y escalas visuales." title="Métricas y gráficos de demostración">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Equipos registrados" trend={<Trend direction="up" label="+8 esta semana" />} value="1.240" />
            <MetricCard label="Disponibles" trend={<Trend direction="neutral" label="Sin cambios" />} value="890" />
            <MetricCard label="Solicitudes activas" tone="warning" trend={<Trend direction="up" label="+3 hoy" />} value="15" />
            <MetricCard label="Incidencias abiertas" tone="danger" trend={<Trend direction="down" label="Requiere atención" />} value="3" />
          </div>
          <div className="mt-8 grid gap-8 xl:grid-cols-2">
            <div><h3 className="text-base font-semibold text-gastro-primary">Disponibilidad por categoría</h3><div className="mt-4"><HorizontalBarChart data={[{ label: "Cuchillería", value: 85, detail: "85% disponible" }, { label: "Electrodomésticos", value: 60, detail: "60% disponible" }, { label: "Cristalería", value: 92, detail: "92% disponible" }]} label="Disponibilidad por categoría" valueFormatter={(value) => `${value}%`} /></div></div>
            <div><h3 className="text-base font-semibold text-gastro-primary">Distribución de equipos</h3><div className="mt-4"><DonutChart label="Distribución de equipos por estado" segments={[{ label: "Disponible", value: 890, color: "#ea580c" }, { label: "Prestado o reservado", value: 292, color: "#d1c3c3" }, { label: "Mantenimiento", value: 58, color: "#ba1a1a" }]} /></div></div>
          </div>
        </DemoSection>

        <div className="grid gap-8 xl:grid-cols-2">
          <DemoSection description="La misma pieza sirve para altas de usuario y edición de roles." title="Selector de roles">
            <RolePicker onChange={setSelectedRoles} selectedRoles={selectedRoles} />
          </DemoSection>
          <DemoSection description="Representa el ciclo autorizado de una solicitud; no permite cambiarlo desde la interfaz." title="Timeline de solicitud">
            <RequestTimeline currentStatus="PREPARING" />
          </DemoSection>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <DemoSection title="Actividad reciente">
            <ActivityFeed items={[{ title: "Cuchillo de chef devuelto", detail: "Por Juan Pérez · hace 10 min", tone: "warning" }, { title: "Nueva reserva registrada", detail: "Laboratorio 3 · hace 1 h" }, { title: "Mantenimiento completado", detail: "Horno industrial · hace 3 h" }]} />
          </DemoSection>
          <DemoSection title="Alertas operativas">
            <AlertList alerts={[{ title: "5 solicitudes por revisar", description: "Requieren una decisión del personal de laboratorio.", action: <Button size="sm" variant="secondary">Revisar</Button> }, { title: "2 devoluciones atrasadas", description: "Revisar el estado de los préstamos activos.", tone: "danger", action: <Button size="sm" variant="danger">Ver alertas</Button> }]} />
          </DemoSection>
        </div>

        <DemoSection description="Búsqueda, filtros, tabla y paginación para módulos que consulten FastAPI." title="Datos">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <SearchField placeholder="Buscar por nombre o código" />
            <FilterSelect aria-label="Filtrar por estado" defaultValue="all">
              <option value="all">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="maintenance">Mantenimiento</option>
            </FilterSelect>
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <tr><th className="px-5 py-3">Elemento</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Ubicación</th></tr>
              </TableHead>
              <tbody>
                <TableRow><TableCell>Ejemplo de registro</TableCell><TableCell><RequestStatusBadge status="PENDING" /></TableCell><TableCell>Laboratorio</TableCell></TableRow>
              </tbody>
            </Table>
          </TableContainer>
          <div className="mt-4"><Pagination currentPage={page} onPageChange={setPage} totalPages={3} /></div>
        </DemoSection>

        <div className="grid gap-8 xl:grid-cols-2">
          <DemoSection title="Disponibilidad">
            <div className="space-y-5">
              <AvailabilityIndicator available={34} label="Cuchillería" total={40} />
              <AvailabilityIndicator available={12} label="Electrodomésticos" total={20} />
            </div>
          </DemoSection>
          <DemoSection title="Estados de contenido">
            <div className="grid gap-4">
              <LoadingState />
              <EmptyState description="Usa este estado cuando una consulta exitosa no devuelve registros." title="No hay registros aún" />
              <ErrorState description="El componente recibe una acción de reintento desde el módulo que llama a la API." title="No se pudo cargar la información" />
            </div>
          </DemoSection>
        </div>

        <DemoSection description="Estos elementos se activan desde el módulo que gestiona la acción; no hacen llamadas por sí mismos." title="Feedback e interacción">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsModalOpen(true)} variant="secondary">Abrir modal</Button>
            <Button onClick={() => setIsConfirmOpen(true)} variant="danger">Abrir confirmación</Button>
            <Button onClick={() => addToast("success")} variant="secondary">Éxito</Button>
            <Button onClick={() => addToast("error")} variant="secondary">Error</Button>
          </div>
        </DemoSection>

        <DemoSection title="Acceso denegado">
          <PermissionDenied />
        </DemoSection>
      </div>

      <Modal description="Ejemplo de contenido reutilizable que un módulo puede colocar dentro del diálogo." isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Modal de ejemplo">
        <div className="flex justify-end"><Button onClick={() => setIsModalOpen(false)}>Entendido</Button></div>
      </Modal>
      <ConfirmDialog description="Esta demostración no ejecuta ninguna acción." isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={() => setIsConfirmOpen(false)} title="¿Confirmar acción?" />
      <ToastRegion messages={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </AppShell>
  );
}
