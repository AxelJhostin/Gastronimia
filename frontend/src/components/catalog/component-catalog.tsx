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
  EmptyState,
  ErrorState,
  Field,
  FilterSelect,
  Input,
  LoadingState,
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

        <div className="grid gap-8 xl:grid-cols-2">
          <DemoSection description="La misma pieza sirve para altas de usuario y edición de roles." title="Selector de roles">
            <RolePicker onChange={setSelectedRoles} selectedRoles={selectedRoles} />
          </DemoSection>
          <DemoSection description="Representa el ciclo autorizado de una solicitud; no permite cambiarlo desde la interfaz." title="Timeline de solicitud">
            <RequestTimeline currentStatus="PREPARING" />
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
