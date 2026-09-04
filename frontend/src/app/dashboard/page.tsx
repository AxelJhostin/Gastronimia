"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardCheck, FilePlus2, PackageCheck, RotateCcw, Users, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { RequestStatusBadge, RoleBadge } from "@/components/domain/operations";
import { AlertList, Card, EmptyState, ErrorState, LoadingState, MetricCard, PageHeader } from "@/components/ui";
import {
  getActiveLoans,
  getEquipmentMaintenances,
  getIncidentReport,
  getInventoryStock,
  getManagedUsers,
  getOwnLoans,
  getOwnRequests,
  getPendingRequests,
  getPendingReturnInspections,
  type EquipmentMaintenance,
  type EquipmentRequest,
  type IncidentOperationalReportRow,
  type InventoryStock,
  type EquipmentLoan,
  type ManagedUser,
  type RoleCode,
} from "@/lib/api/client";

type OperationsOverview = {
  incidents: IncidentOperationalReportRow[];
  inventory: InventoryStock[];
  loans: Awaited<ReturnType<typeof getActiveLoans>>;
  maintenances: EquipmentMaintenance[];
  pendingInspections: Awaited<ReturnType<typeof getPendingReturnInspections>>;
  pendingRequests: EquipmentRequest[];
  users: ManagedUser[];
};

const emptyOperations: OperationsOverview = {
  incidents: [], inventory: [], loans: [], maintenances: [], pendingInspections: [], pendingRequests: [], users: [],
};

export default function DashboardPage() {
  const identity = useDashboardIdentity();
  const [operations, setOperations] = useState<OperationsOverview>(emptyOperations);
  const [ownRequests, setOwnRequests] = useState<EquipmentRequest[]>([]);
  const [ownLoans, setOwnLoans] = useState<EquipmentLoan[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = identity.status === "authenticated" ? identity.accessToken : null;
  const roles = useMemo(() => isAuthenticated ? identity.user.roles : [], [identity, isAuthenticated]);
  const isTeacher = roles.includes("TEACHER");
  const isOperator = roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const isAdmin = roles.includes("ADMIN");

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let active = true;

    async function loadOverview() {
      try {
        const [teacherRequests, teacherLoans] = isTeacher
          ? await Promise.all([getOwnRequests(token), getOwnLoans(token)])
          : [[], []];
        let nextOperations = emptyOperations;
        if (isOperator) {
          const [pendingRequests, inventory, loans, pendingInspections, maintenances, incidents, users] = await Promise.all([
            getPendingRequests(token),
            getInventoryStock(token),
            getActiveLoans(token),
            getPendingReturnInspections(token),
            getEquipmentMaintenances(token),
            getIncidentReport(token),
            isAdmin ? getManagedUsers(token) : Promise.resolve([]),
          ]);
          nextOperations = { incidents, inventory, loans, maintenances, pendingInspections, pendingRequests, users };
        }
        if (active) {
          setOwnRequests(teacherRequests);
          setOwnLoans(teacherLoans);
          setOperations(nextOperations);
          setLoadState("ready");
        }
      } catch {
        if (active) setLoadState("error");
      }
    }

    void loadOverview();
    return () => { active = false; };
  }, [accessToken, isAdmin, isOperator, isTeacher, reloadKey]);

  if (identity.status === "loading") return <LoadingState label="Cargando tu panel…" />;
  if (identity.status === "unavailable") return <ErrorState description={identity.message} title="No pudimos cargar tu sesión" />;

  const displayName = getDisplayName(identity.user.email);
  const primaryAction = isTeacher && !isOperator
    ? { href: "/dashboard/requests/new", label: "Nueva solicitud", icon: <FilePlus2 className="size-4" /> }
    : isAdmin
      ? { href: "/dashboard/users/new", label: "Crear usuario", icon: <Users className="size-4" /> }
      : { href: "/dashboard/requests", label: "Revisar solicitudes", icon: <ClipboardCheck className="size-4" /> };

  return (
    <div className="space-y-8">
      <PageHeader actions={<ActionLink href={primaryAction.href} icon={primaryAction.icon}>{primaryAction.label}</ActionLink>} description={dashboardDescription(roles)} eyebrow="Panel de trabajo" title={`Hola, ${displayName}`} />
      <div aria-label="Roles activos" className="flex flex-wrap gap-2">{roles.filter(isSupportedRole).map((role) => <RoleBadge key={role} role={role} />)}</div>
      {loadState === "loading" ? <LoadingState label="Consultando la operación…" /> : null}
      {loadState === "error" ? <ErrorState action={<button className="text-sm font-semibold underline" onClick={() => { setLoadState("loading"); setReloadKey((key) => key + 1); }} type="button">Intentar nuevamente</button>} description="Verifica que FastAPI y Supabase estén activos. Tu sesión sigue abierta." title="No pudimos actualizar el resumen" /> : null}
      {loadState === "ready" && isOperator ? <OperationsDashboard data={operations} isAdmin={isAdmin} /> : null}
      {loadState === "ready" && isTeacher ? <TeacherDashboard loans={ownLoans} requests={ownRequests} showMetrics={!isOperator} /> : null}
    </div>
  );
}

function OperationsDashboard({ data, isAdmin }: { data: OperationsOverview; isAdmin: boolean }) {
  const openMaintenances = data.maintenances.filter((item) => item.status === "OPEN");
  const criticalIncidents = data.incidents.filter((item) => item.severity === "HIGH" || item.severity === "CRITICAL");
  const activeUsers = data.users.filter((user) => user.is_active);
  const inventoryReferences = new Set(data.inventory.map((row) => row.inventory_item_id)).size;
  const alerts = [
    data.pendingRequests.length ? { title: `${data.pendingRequests.length} ${plural(data.pendingRequests.length, "solicitud pendiente", "solicitudes pendientes")}`, description: "Necesitan revisión antes de reservar inventario.", action: <TextLink href="/dashboard/requests">Revisar</TextLink> } : null,
    data.pendingInspections.length ? { title: `${data.pendingInspections.length} ${plural(data.pendingInspections.length, "devolución por inspeccionar", "devoluciones por inspeccionar")}`, description: "Confirma condición, faltantes e incidencias de retorno.", action: <TextLink href="/dashboard/returns">Inspeccionar</TextLink> } : null,
    criticalIncidents.length ? { title: `${criticalIncidents.length} ${plural(criticalIncidents.length, "incidencia prioritaria", "incidencias prioritarias")}`, description: "Casos de severidad alta o crítica que requieren seguimiento.", tone: "danger" as const, action: <TextLink href="/dashboard/incidents">Atender</TextLink> } : null,
    openMaintenances.length ? { title: `${openMaintenances.length} ${plural(openMaintenances.length, "mantenimiento abierto", "mantenimientos abiertos")}`, description: "Equipos no disponibles hasta completar o cancelar la intervención.", action: <TextLink href="/dashboard/maintenance">Gestionar</TextLink> } : null,
  ].filter((alert): alert is NonNullable<typeof alert> => alert !== null);

  return (
    <>
      <section aria-labelledby="operation-summary-title">
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold" id="operation-summary-title">Resumen de hoy</h2><p className="mt-1 text-sm text-gastro-muted">Lo que necesita atención en la operación.</p></div><TextLink href="/dashboard/reports">Ver reportes</TextLink></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<ClipboardCheck className="size-5" />} label="Solicitudes por revisar" tone={data.pendingRequests.length ? "warning" : "neutral"} value={data.pendingRequests.length} />
          <MetricCard icon={<PackageCheck className="size-5" />} label="Referencias con stock" value={inventoryReferences} />
          <MetricCard icon={<RotateCcw className="size-5" />} label="Préstamos activos" tone={data.loans.some((loan) => loan.is_overdue) ? "danger" : "neutral"} value={data.loans.length} />
          <MetricCard icon={<AlertTriangle className="size-5" />} label="Incidencias prioritarias" tone={criticalIncidents.length ? "danger" : "neutral"} value={criticalIncidents.length} />
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Card>
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Cola operativa</h2><p className="mt-1 text-sm text-gastro-muted">Prioridades ordenadas para continuar el flujo.</p></div><span className="rounded-full bg-gastro-surface-low px-3 py-1 text-xs font-semibold text-gastro-muted">{alerts.length} alertas</span></div>
          <div className="mt-5">{alerts.length ? <AlertList alerts={alerts} /> : <EmptyState className="min-h-52" description="No hay solicitudes, devoluciones, incidencias críticas ni mantenimientos esperando acción." title="La operación está al día" />}</div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Accesos rápidos</h2><p className="mt-1 text-sm text-gastro-muted">Continúa con las tareas más frecuentes.</p>
          <nav aria-label="Accesos rápidos" className="mt-5 divide-y divide-gastro-outline-variant">
            <QuickLink href="/dashboard/inventory" icon={<PackageCheck className="size-5" />} label="Consultar inventario" />
            <QuickLink href="/dashboard/returns" icon={<RotateCcw className="size-5" />} label="Registrar devolución" />
            <QuickLink href="/dashboard/maintenance" icon={<Wrench className="size-5" />} label="Gestionar mantenimiento" />
            {isAdmin ? <QuickLink href="/dashboard/users" icon={<Users className="size-5" />} label={`${activeUsers.length} usuarios activos`} /> : null}
          </nav>
        </Card>
      </div>
    </>
  );
}

function TeacherDashboard({ loans, requests, showMetrics }: { loans: EquipmentLoan[]; requests: EquipmentRequest[]; showMetrics: boolean }) {
  const pending = requests.filter((request) => request.status === "PENDING").length;
  const drafts = requests.filter((request) => request.status === "DRAFT").length;
  const active = requests.filter((request) => !["CLOSED", "REJECTED"].includes(request.status)).length;
  const recent = [...requests].sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 5);
  const recentLoans = loans.slice(0, 3);
  const activeLoans = loans.filter((loan) => loan.status !== "CLOSED").length;

  return <section aria-labelledby="teacher-work-title" className="space-y-6">
    {showMetrics ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Solicitudes activas" value={active} /><MetricCard label="Pendientes de revisión" tone={pending ? "warning" : "neutral"} value={pending} /><MetricCard label="Préstamos activos" tone={loans.some((loan) => loan.is_overdue) ? "danger" : "neutral"} value={activeLoans} /><MetricCard label="Préstamos históricos" value={loans.length} trend={drafts ? <span className="text-sm text-gastro-muted">{drafts} borrador pendiente</span> : undefined} /></div> : null}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold" id="teacher-work-title">Mis solicitudes recientes</h2><p className="mt-1 text-sm text-gastro-muted">Seguimiento de reservas para tus prácticas.</p></div><TextLink href="/dashboard/requests">Ver todas</TextLink></div>
        {recent.length ? <ul className="mt-5 divide-y divide-gastro-outline-variant">{recent.map((request) => <li className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={request.id}><div><p className="font-semibold">{request.purpose || "Práctica académica"}</p><p className="mt-1 text-sm text-gastro-muted">{formatDateRange(request.start_at, request.end_at)}</p></div><div className="flex items-center gap-3"><RequestStatusBadge status={request.status} /><TextLink href={`/dashboard/requests/${request.id}`}>Detalle</TextLink></div></li>)}</ul> : <EmptyState className="mt-5 min-h-52" action={<ActionLink href="/dashboard/requests/new" icon={<FilePlus2 className="size-4" />}>Crear mi primera solicitud</ActionLink>} description="Cuando prepares una práctica, crea la solicitud y podrás seguir su aprobación aquí." title="Aún no tienes solicitudes" />}
      </Card>
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Mis préstamos</h2><p className="mt-1 text-sm text-gastro-muted">Recursos entregados bajo tu responsabilidad.</p></div><TextLink href="/dashboard/loans">Historial</TextLink></div>
          {recentLoans.length ? <ul className="mt-5 divide-y divide-gastro-outline-variant">{recentLoans.map((loan) => <li className="py-3 first:pt-0" key={loan.id}><div className="flex items-center justify-between gap-3"><p className="font-mono text-xs font-semibold text-gastro-muted">#{loan.id.slice(0, 8)}</p><LoanStatus loan={loan} /></div><p className="mt-2 text-sm font-medium">Retiró: {loan.collected_by_name}</p><p className="mt-1 text-xs text-gastro-muted">{formatDate(loan.delivered_at)}</p></li>)}</ul> : <p className="mt-5 rounded-xl bg-gastro-surface-low p-4 text-sm text-gastro-muted">Todavía no tienes préstamos asociados.</p>}
        </Card>
        <section className="self-start rounded-2xl border border-gastro-primary p-5 text-white shadow-gastro-sm" style={{ backgroundColor: "var(--gastro-primary)" }}><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Próximo paso</p><h2 className="mt-3 text-2xl font-semibold">Prepara tu práctica con anticipación</h2><p className="mt-3 text-sm leading-6 text-white/70">Indica laboratorio, horario y cantidades. El equipo de bodega revisará la disponibilidad antes de reservar.</p><Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-gastro-action px-4 text-sm font-semibold text-white hover:bg-gastro-action-hover" href="/dashboard/requests/new">Nueva solicitud <ArrowRight className="size-4" /></Link></section>
      </div>
    </div>
  </section>;
}

function LoanStatus({ loan }: { loan: EquipmentLoan }) { const closed = loan.status === "CLOSED"; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${loan.is_overdue ? "bg-gastro-error-container text-gastro-error-strong" : closed ? "bg-gastro-surface-high text-gastro-muted" : "bg-gastro-success-container text-gastro-success"}`}>{loan.is_overdue ? "Atrasado" : closed ? "Devuelto" : loan.status === "PARTIALLY_RETURNED" ? "Devolución parcial" : "Activo"}</span>; }

function ActionLink({ children, href, icon }: { children: React.ReactNode; href: string; icon?: React.ReactNode }) { return <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gastro-action px-4 text-sm font-semibold text-white transition-colors hover:bg-gastro-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gastro-action focus-visible:ring-offset-2" href={href}>{icon}{children}</Link>; }
function TextLink({ children, href }: { children: React.ReactNode; href: string }) { return <Link className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-gastro-action underline-offset-4 hover:underline" href={href}>{children}<ArrowRight className="size-4" /></Link>; }
function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) { return <Link className="flex min-h-14 items-center gap-3 py-3 text-sm font-semibold hover:text-gastro-action" href={href}><span aria-hidden="true" className="text-gastro-action">{icon}</span><span>{label}</span><ArrowRight className="ml-auto size-4 text-gastro-muted" /></Link>; }
function dashboardDescription(roles: RoleCode[]) { if (roles.includes("ADMIN")) return "Supervisa usuarios, operación e inventario desde un único punto de control."; if (roles.includes("MANAGER")) return "Prioriza solicitudes, entregas, devoluciones e incidencias del laboratorio."; return "Organiza los recursos que necesitarás y sigue el estado de tus solicitudes."; }
function getDisplayName(email: string | null) { if (!email) return "bienvenido"; return email.split("@")[0].split(/[._-]/).map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join(" "); }
function formatDateRange(start: string, end: string) { const formatter = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function plural(count: number, singular: string, pluralForm: string) { return count === 1 ? singular : pluralForm; }
function isSupportedRole(role: RoleCode): role is "ADMIN" | "MANAGER" | "TEACHER" { return role === "ADMIN" || role === "MANAGER" || role === "TEACHER"; }
