"use client";

import { AlertTriangle, CheckCircle2, Clock3, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { Badge, Card, EmptyState, ErrorState, LoadingState, MetricCard, PageHeader } from "@/components/ui";
import { getOwnLoans, getOwnRequests, type EquipmentLoan, type EquipmentRequest } from "@/lib/api/client";

export default function TeacherLoansPage() {
  const identity = useDashboardIdentity();
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = identity.status === "authenticated" && identity.user.roles.includes("TEACHER");
  const accessToken = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!isTeacher || !accessToken) return;
    let active = true;
    void Promise.all([getOwnLoans(accessToken), getOwnRequests(accessToken)])
      .then(([nextLoans, nextRequests]) => {
        if (!active) return;
        setLoans(nextLoans);
        setRequests(nextRequests);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tus préstamos.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, isTeacher]);

  const requestById = useMemo(() => Object.fromEntries(requests.map((request) => [request.id, request])), [requests]);
  const activeLoans = loans.filter((loan) => loan.status !== "CLOSED");
  const closedLoans = loans.filter((loan) => loan.status === "CLOSED");
  const overdueLoans = activeLoans.filter((loan) => loan.is_overdue);

  if (identity.status === "loading") return <LoadingState label="Cargando tus préstamos…" />;
  if (identity.status === "unavailable") return <ErrorState description={identity.message} title="No pudimos cargar tu sesión" />;
  if (!isTeacher) return <GastronomyStatusPage kind="forbidden" />;

  return <div className="space-y-7">
    <PageHeader description="Consulta los recursos que fueron entregados bajo tu responsabilidad y confirma cuáles siguen pendientes de devolución." eyebrow="Trazabilidad docente" title="Mis préstamos" />
    {loading ? <LoadingState label="Consultando el historial de préstamos…" /> : null}
    {error ? <ErrorState description={error} title="No pudimos cargar tus préstamos" /> : null}
    {!loading && !error ? <>
      <section aria-label="Resumen de préstamos" className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={<Clock3 className="size-5" />} label="Activos" tone={activeLoans.length ? "warning" : "neutral"} value={activeLoans.length} />
        <MetricCard icon={<AlertTriangle className="size-5" />} label="Atrasados" tone={overdueLoans.length ? "danger" : "neutral"} value={overdueLoans.length} />
        <MetricCard icon={<CheckCircle2 className="size-5" />} label="Devueltos" value={closedLoans.length} />
      </section>
      {loans.length ? <section aria-labelledby="loan-history-title">
        <div className="mb-4"><h2 className="text-xl font-semibold" id="loan-history-title">Historial completo</h2><p className="mt-1 text-sm text-gastro-muted">Los préstamos cerrados permanecen visibles como respaldo de la práctica.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">{loans.map((loan) => {
          const request = requestById[loan.equipment_request_id];
          return <Card key={loan.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-gastro-muted">PRÉSTAMO #{loan.id.slice(0, 8)}</p><h3 className="mt-2 text-lg font-semibold">{request?.purpose || "Práctica académica"}</h3></div><LoanBadge loan={loan} /></div>
            <dl className="mt-5 grid gap-4 border-t border-gastro-outline-variant pt-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gastro-muted">Retirado por</dt><dd className="mt-1 font-medium">{loan.collected_by_name}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gastro-muted">Entregado</dt><dd className="mt-1 font-medium">{formatDate(loan.delivered_at)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gastro-muted">Solicitud</dt><dd className="mt-1 font-mono text-xs">#{loan.equipment_request_id.slice(0, 8)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-gastro-muted">Cierre</dt><dd className="mt-1 font-medium">{loan.closed_at ? formatDate(loan.closed_at) : "Pendiente"}</dd></div>
            </dl>
          </Card>;
        })}</div>
      </section> : <EmptyState action={<Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gastro-action px-4 text-sm font-semibold text-white hover:bg-gastro-action-hover" href="/dashboard/requests/new"><History className="size-4" /> Crear una solicitud</Link>} description="Cuando el personal entregue recursos para una práctica, el préstamo aparecerá aquí y conservará su historial después de la devolución." title="Todavía no tienes préstamos" />}
    </> : null}
  </div>;
}

function LoanBadge({ loan }: { loan: EquipmentLoan }) {
  if (loan.is_overdue) return <Badge tone="danger">Atrasado</Badge>;
  if (loan.status === "CLOSED") return <Badge>Devuelto</Badge>;
  if (loan.status === "PARTIALLY_RETURNED") return <Badge tone="warning">Devolución parcial</Badge>;
  return <Badge tone="success">Activo</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
