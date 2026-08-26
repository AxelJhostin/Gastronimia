"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import {
  getOwnRequests,
  getPendingRequests,
  type EquipmentRequest,
} from "@/lib/api/client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export default function RequestsPage() {
  const identity = useDashboardIdentity();
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identity.status !== "authenticated") return;

    const loadRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = identity.user.roles.includes("TEACHER")
          ? await getOwnRequests(identity.accessToken)
          : await getPendingRequests(identity.accessToken);
        setRequests(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las solicitudes.");
      } finally {
        setLoading(false);
      }
    };

    void loadRequests();
  }, [identity]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando solicitudes…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;

  const isTeacherView = identity.user.roles.includes("TEACHER");

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Operación
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Gestión de Solicitudes y Reservas
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {isTeacherView
                ? "Consulta el estado de tus solicitudes para las actividades docentes."
                : "Revisa las solicitudes pendientes de aprobación y reserva."}
            </p>
          </div>

          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
          >
            ＋ Nueva Solicitud
          </Link>
        </div>

        {/* Listado de Solicitudes */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar las solicitudes: {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código / Asunto</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Fecha Requerida</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">Cargando solicitudes…</td></tr>
                ) : requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {req.purpose || `Solicitud #${req.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {isTeacherView ? "Mi solicitud" : `Docente ${req.teacher_id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {formatDate(req.start_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            req.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : req.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : req.status === "REJECTED"
                              ? "bg-red-50 text-red-700 ring-red-600/20"
                              : "bg-stone-100 text-stone-700 ring-stone-500/20"
                          }`}
                        >
                          {req.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/dashboard/requests/${req.id}`} className="text-xs font-semibold text-amber-800 underline hover:text-amber-900">Ver detalle →</Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No tienes borradores ni solicitudes registradas actualmente.
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
