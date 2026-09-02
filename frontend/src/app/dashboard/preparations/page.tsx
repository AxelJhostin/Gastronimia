"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getRequestOperationalReport,
  type RequestOperationalReportRow,
} from "@/lib/api/client";

export default function PreparationsPage() {
  const identity = useDashboardIdentity();
  const [orders, setOrders] = useState<RequestOperationalReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;

    void getRequestOperationalReport(identity.accessToken)
      .then((data) =>
        setOrders(
          data.filter((order) =>
            ["APPROVED", "PARTIALLY_APPROVED", "PREPARING"].includes(order.status),
          ),
        ),
      )
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar las solicitudes pendientes de preparación."
        )
      )
      .finally(() => setLoading(false));
  }, [identity, hasAccess]);

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando preparaciones…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Operaciones de Pañol
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Preparación de Solicitudes
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Gestión y armado de pedidos de insumos y equipos autorizados.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Listado / Tabla */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar preparaciones: {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código / Solicitud</th>
                  <th className="px-4 py-3 font-semibold">Inicio Reserva</th>
                  <th className="px-4 py-3 font-semibold">Fin Reserva</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      Cargando solicitudes de despacho…
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {`Solicitud #${order.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {new Date(order.start_at).toLocaleString("es-EC")}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {new Date(order.end_at).toLocaleString("es-EC")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/preparations/${order.id}`}
                          className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                        >
                          {order.status === "PREPARING" ? "Continuar armado →" : "Armar paquete →"}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No hay solicitudes pendientes por preparar.
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
