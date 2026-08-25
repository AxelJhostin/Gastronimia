import { Badge, type BadgeTone } from "@/components/ui";
import { cn } from "@/lib/cn";

export type RoleCode = "ADMIN" | "MANAGER" | "TEACHER";
export type RequestStatus = "DRAFT" | "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "PREPARING" | "PREPARED" | "DELIVERED" | "CLOSED";

const roles: Record<RoleCode, string> = { ADMIN: "Administrador", MANAGER: "Encargado", TEACHER: "Docente" };
const requestStatus: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  PENDING: { label: "Pendiente", tone: "warning" },
  APPROVED: { label: "Aprobada", tone: "success" },
  PARTIALLY_APPROVED: { label: "Aprobada parcialmente", tone: "warning" },
  REJECTED: { label: "Rechazada", tone: "danger" },
  PREPARING: { label: "En preparación", tone: "info" },
  PREPARED: { label: "Preparada", tone: "success" },
  DELIVERED: { label: "Entregada", tone: "info" },
  CLOSED: { label: "Cerrada", tone: "neutral" },
};

export function RoleBadge({ role }: { role: RoleCode }) {
  return <Badge tone="role">{roles[role]}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config = requestStatus[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export function RolePicker({ selectedRoles, onChange }: { selectedRoles: RoleCode[]; onChange: (roles: RoleCode[]) => void }) {
  const icons: Record<RoleCode, string> = { ADMIN: "◈", MANAGER: "▣", TEACHER: "◆" };
  return <fieldset><legend className="text-sm font-semibold text-gastro-primary">Rol del usuario</legend><p className="mt-1 text-sm text-gastro-muted">Puedes asignar uno o más roles.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{(Object.keys(roles) as RoleCode[]).map((role) => { const selected = selectedRoles.includes(role); return <label className={cn("flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border-2 p-4 text-sm font-semibold transition-colors", selected ? "border-gastro-action bg-orange-50 text-gastro-primary" : "border-gastro-outline-variant bg-white text-gastro-muted hover:bg-gastro-surface-low")} key={role}><span aria-hidden="true" className="text-xl text-gastro-muted">{icons[role]}</span><span className="flex-1">{roles[role]}</span><input checked={selected} className="size-5 rounded border-gastro-outline text-gastro-action focus:ring-gastro-action" onChange={() => onChange(selected ? selectedRoles.filter((current) => current !== role) : [...selectedRoles, role])} type="checkbox" /></label>; })}</div></fieldset>;
}

export function RequestTimeline({ currentStatus }: { currentStatus: RequestStatus }) {
  const sequence = Object.keys(requestStatus) as RequestStatus[];
  const currentIndex = sequence.indexOf(currentStatus);
  return <ol className="space-y-0">{sequence.map((status, index) => { const current = status === currentStatus; const complete = index < currentIndex; return <li className="relative flex gap-3 pb-5 last:pb-0" key={status}><span aria-hidden="true" className={cn("z-10 grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold", complete || current ? "border-gastro-action bg-gastro-action text-white" : "border-gastro-outline-variant bg-white text-gastro-muted")}>{complete ? "✓" : index + 1}</span>{index < sequence.length - 1 ? <span aria-hidden="true" className={cn("absolute left-3 top-6 h-[calc(100%-1rem)] w-px", complete ? "bg-gastro-action" : "bg-gastro-outline-variant")} /> : null}<div className="pt-0.5"><p className={cn("text-sm font-semibold", current ? "text-gastro-action" : "text-gastro-primary")}>{requestStatus[status].label}</p>{current ? <p className="mt-0.5 text-xs text-gastro-muted">Estado actual</p> : null}</div></li>; })}</ol>;
}

export function AvailabilityIndicator({ available, label, total }: { available: number; label: string; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (available / total) * 100)) : 0;
  return <div><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-gastro-primary">{label}</span><span className="font-mono text-gastro-muted">{available} de {total}</span></div><div aria-label={`${label}: ${available} de ${total} disponibles`} aria-valuemax={total} aria-valuemin={0} aria-valuenow={available} className="mt-2 h-2 overflow-hidden rounded-full bg-gastro-surface-high" role="progressbar"><div className="h-full rounded-full bg-gastro-action" style={{ width: `${percentage}%` }} /></div></div>;
}
