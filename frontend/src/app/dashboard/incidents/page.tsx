"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export interface IncidentItem {
  id: string;
  loan_id: string;
  reported_by: string;
  type: "DAMAGED" | "LOST" | "MISSING_INVENTORY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  created_at: string;
}

export default function IncidentsPage() {
  const identity = useDashboardIdentity();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;

  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken) return;

    // Simulación / llamada a endpoint GET /api/v1/incidents
    setLoading(true);
    fetch("/api/v1/incidents", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las incidencias.");
        return res.json();
      })
      .then((data) => setIncidents(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar novedades.");
      })
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken]);

  if (identity.status === "loading" || loading) {
    return <p className="p-6 text-sm text-stone-600">Cargando reporte de incidencias…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Control & Auditoría
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Gestión de Novedades e Incidencias
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Registro de equipos averiados, faltantes de inventario o pérdidas tras recepciones.
            </p>
          </div>
          <Link
            href="/dashboard/incidents/new"
            className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 transition-colors text-center"
          >
            + Reportar Novedad
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabla de Incidencias */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700 border-collapse">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Préstamo</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Severidad</th>
                <th className="px-4 py-3 font-semibold">Reportado por</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-stone-500 text-sm">
                    No hay novedades o incidencias registradas actualmente.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">
                      #{inc.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      #{inc.loan_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {inc.type === "DAMAGED" && "Daño / Avería"}
                      {inc.type === "LOST" && "Pérdida"}
                      {inc.type === "MISSING_INVENTORY" && "Insumo Faltante"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          inc.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : inc.severity === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{inc.reported_by}</td>
                    <td className="px-4 py-3 font-semibold text-xs">
                      {inc.status === "OPEN" && (
                        <span className="text-red-600">ABIERTA</span>
                      )}
                      {inc.status === "IN_REVIEW" && (
                        <span className="text-amber-600">EN REVISIÓN</span>
                      )}
                      {inc.status === "RESOLVED" && (
                        <span className="text-emerald-600">RESUELTA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-500 text-xs">
                      {new Date(inc.created_at).toLocaleDateString("es-EC")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}