"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getEquipmentRequestDetail,
  startEquipmentPreparation,
  type EquipmentRequestDetail,
} from "@/lib/api/client";

export default function PreparationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const identity = useDashboardIdentity();

  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<EquipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;

  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !requestId) return;

    void getEquipmentRequestDetail(accessToken, requestId)
      .then(setDetail)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible obtener el detalle de la solicitud."
        )
      )
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken, requestId]);

  const handleStartPreparation = async () => {
    if (!accessToken || !requestId) return;

    setSubmitting(true);
    setError(null);

    try {
      await startEquipmentPreparation(accessToken, requestId);
      router.push("/dashboard/preparations");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al iniciar la preparación."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading" || loading) {
    return <p className="p-6 text-sm text-stone-600">Cargando detalles del pedido…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  if (error && !detail) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Despacho de Pañol
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Solicitud #{detail?.request.id.slice(0, 8)}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Revisa los insumos solicitados y confirma el inicio del armado del paquete.
            </p>
          </div>
          <Link
            href="/dashboard/preparations"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver a la lista
          </Link>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Información general */}
        {detail && (
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <span className="block font-semibold text-stone-500">Estado:</span>
              <span className="font-medium text-stone-900">{detail.request.status}</span>
            </div>
            <div>
              <span className="block font-semibold text-stone-500">Propósito:</span>
              <span className="font-medium text-stone-900">
                {detail.request.purpose ?? "Sin especificar"}
              </span>
            </div>
            <div>
              <span className="block font-semibold text-stone-500">Inicio Reserva:</span>
              <span className="font-medium text-stone-900">
                {new Date(detail.request.start_at).toLocaleString("es-EC")}
              </span>
            </div>
            <div>
              <span className="block font-semibold text-stone-500">Fin Reserva:</span>
              <span className="font-medium text-stone-900">
                {new Date(detail.request.end_at).toLocaleString("es-EC")}
              </span>
            </div>
          </div>
        )}

        {/* Tabla de ítems requeridos */}
        <div className="mt-6 overflow-x-auto">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">
            Ítems a preparar
          </h2>
          <table className="w-full text-left text-sm text-stone-700 border-collapse">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Ítem</th>
                <th className="px-4 py-3 font-semibold text-right">Cantidad Solicitada</th>
                <th className="px-4 py-3 font-semibold">Unidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {detail?.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {item.inventory_item_code ?? "S/C"}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {item.inventory_item_name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-right text-stone-900">
                    {item.requested_quantity}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.unit_of_measure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón de acción */}
        <div className="mt-8 flex justify-end border-t border-stone-100 pt-6">
          <button
            type="button"
            onClick={handleStartPreparation}
            disabled={submitting}
            className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Iniciando…" : "Iniciar Preparación de Pedido"}
          </button>
        </div>
      </section>
    </main>
  );
}