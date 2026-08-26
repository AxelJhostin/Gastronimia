"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getOperationalReport, type OperationalReportRow } from "@/lib/api/client";

type ReportState = {
  requests: OperationalReportRow[];
  loans: OperationalReportRow[];
  stock: OperationalReportRow[];
};

export default function ReportsPage() {
  const identity = useDashboardIdentity();
  const [report, setReport] = useState<ReportState>({ requests: [], loans: [], stock: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      identity.status !== "authenticated" ||
      !identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")
    ) {
      return;
    }

    void Promise.all([
      getOperationalReport(identity.accessToken, "requests"),
      getOperationalReport(identity.accessToken, "loans"),
      getOperationalReport(identity.accessToken, "stock"),
    ])
      .then(([requests, loans, stock]) => setReport({ requests, loans, stock }))
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los reportes."),
      )
      .finally(() => setLoading(false));
  }, [identity]);

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando reportes…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  const pendingRequests = report.requests.filter((row) => row.status === "PENDING").length;
  const activeLoans = report.loans.filter((row) => row.status === "ACTIVE").length;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Auditoría y Análisis</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Reportes de Operación</h1>
            <p className="mt-1 text-sm text-stone-600">Visión consolidada de solicitudes, préstamos y stock.</p>
          </div>
          <Link href="/dashboard" className="text-xs font-semibold text-stone-600 underline hover:text-amber-800">
            ← Volver al Panel
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Error al cargar los reportes: {error}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total Solicitudes" value={loading ? "—" : report.requests.length} hint="Histórico registrado" />
          <Metric label="Pendientes" value={loading ? "—" : pendingRequests} hint="Requieren aprobación" accent />
          <Metric label="Registros de Stock" value={loading ? "—" : report.stock.length} hint="Por ítem y ubicación" />
          <Metric label="Préstamos Activos" value={loading ? "—" : activeLoans} hint="Pendientes de devolución" />
        </div>

        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900">Fuente de datos</h2>
          <p className="mt-1 text-xs text-stone-600">
            Estas métricas usan los resúmenes operativos protegidos de FastAPI. La exportación de archivos se añadirá cuando se defina el formato requerido.
          </p>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-amber-200 bg-amber-50/40" : "border-stone-200 bg-stone-50/50"}`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-amber-800" : "text-stone-500"}`}>{label}</span>
      <div className={`mt-2 text-3xl font-bold ${accent ? "text-amber-900" : "text-stone-900"}`}>{value}</div>
      <p className={`mt-1 text-xs ${accent ? "text-amber-700" : "text-stone-600"}`}>{hint}</p>
    </div>
  );
}
