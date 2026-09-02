"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getRequestOperationalReport,
  type RequestOperationalReportRow,
} from "@/lib/api/client";

export default function DeliveriesPage() {
  const identity = useDashboardIdentity();
  const [requests, setRequests] = useState<RequestOperationalReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;

    void getRequestOperationalReport(identity.accessToken)
      .then((rows) => setRequests(rows.filter((row) => row.status === "PREPARED")))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar las solicitudes listas para entrega.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, identity]);

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando entregas…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Operación de pañol
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Entregas preparadas</h1>
            <p className="mt-1 text-sm text-stone-600">
              Inspecciona, genera el token temporal y registra quién retira los recursos.
            </p>
          </div>
          <Link className="text-xs font-semibold text-stone-600 underline hover:text-amber-800" href="/dashboard">
            Volver al panel
          </Link>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}

        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Solicitud</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Reserva</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>Cargando solicitudes preparadas…</td></tr>
              ) : requests.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>No hay solicitudes preparadas pendientes de entrega.</td></tr>
              ) : (
                requests.map((request) => (
                  <tr className="hover:bg-stone-50" key={request.id}>
                    <td className="px-4 py-3 font-mono text-xs">#{request.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className="block">{new Date(request.start_at).toLocaleString("es-EC")}</span>
                      <span className="block text-xs text-stone-500">hasta {new Date(request.end_at).toLocaleString("es-EC")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Lista para entregar</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link className="text-xs font-semibold text-amber-800 underline hover:text-amber-900" href={`/dashboard/deliveries/${request.id}`}>
                        Inspeccionar y entregar
                      </Link>
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
