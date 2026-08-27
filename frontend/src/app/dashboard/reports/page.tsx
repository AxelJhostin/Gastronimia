"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getOperationalReport,
  type OperationalReportRow,
} from "@/lib/api/client";

type ReportType = "requests" | "loans" | "incidents" | "stock";

export default function ReportsPage() {
  const identity = useDashboardIdentity();
  const [reportType, setReportType] = useState<ReportType>("requests");
  const [data, setData] = useState<OperationalReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;

    setLoading(true);
    setError(null);

    void getOperationalReport(identity.accessToken, reportType)
      .then(setData)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Error al consultar el reporte."
        )
      )
      .finally(() => setLoading(false));
  }, [identity, hasAccess, reportType]);

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando informes…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Analítica del Pañol
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Reportes Operativos
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Selector de reporte */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { id: "requests", label: "Solicitudes" },
              { id: "loans", label: "Préstamos" },
              { id: "stock", label: "Stock / Inventario" },
              { id: "incidents", label: "Novedades" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                reportType === tab.id
                  ? "bg-amber-800 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabla dinámicas de reporte */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700 border-collapse">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Generando datos del informe…
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3.5 text-stone-600 font-mono text-xs">
                          {String(row[col] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      No hay datos disponibles para este reporte.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}