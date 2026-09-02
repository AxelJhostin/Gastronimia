"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import {
  approveEquipmentRequest,
  getEquipmentRequestDetail,
  rejectEquipmentRequest,
  type EquipmentRequestDetail,
} from "@/lib/api/client";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const identity = useDashboardIdentity();
  const [detail, setDetail] = useState<EquipmentRequestDetail | null>(null);
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, string>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const isStaff =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const accessToken = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!accessToken) return;

    void getEquipmentRequestDetail(accessToken, id)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setApprovedQuantities(
          Object.fromEntries(
            nextDetail.items.map((item) => [item.id, String(item.requested_quantity)]),
          ),
        );
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar la solicitud.",
        ),
      );
  }, [accessToken, id]);

  const submitApproval = async () => {
    if (!accessToken || !detail) return;

    const items = detail.items.map((item) => ({
      equipment_request_item_id: item.id,
      approved_quantity: Number(approvedQuantities[item.id]),
    }));
    if (items.some((item) => !Number.isFinite(item.approved_quantity) || item.approved_quantity < 0)) {
      setError("Las cantidades aprobadas deben ser números iguales o mayores que cero.");
      return;
    }

    setReviewing(true);
    setError(null);
    try {
      const request = await approveEquipmentRequest(accessToken, id, items);
      setDetail({ ...detail, request });
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "No fue posible aprobar la solicitud.",
      );
    } finally {
      setReviewing(false);
    }
  };

  const submitRejection = async () => {
    if (!accessToken || !detail || !rejectionReason.trim()) {
      setError("Indica el motivo del rechazo.");
      return;
    }

    setReviewing(true);
    setError(null);
    try {
      const request = await rejectEquipmentRequest(accessToken, id, rejectionReason.trim());
      setDetail({ ...detail, request });
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "No fue posible rechazar la solicitud.",
      );
    } finally {
      setReviewing(false);
    }
  };

  if (identity.status === "loading" || (!detail && !error)) {
    return <p className="p-6 text-sm text-stone-600">Cargando solicitud…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (error && !detail) {
    return <p className="p-6 text-sm text-red-700">{error}</p>;
  }
  if (!detail) {
    return <p className="p-6 text-sm text-red-700">Solicitud no encontrada.</p>;
  }

  const canReview = isStaff && detail.request.status === "PENDING";

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Detalle de solicitud</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {detail.request.purpose || "Solicitud #" + detail.request.id.slice(0, 8)}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Estado: <strong>{detail.request.status}</strong> · Inicio: {new Date(detail.request.start_at).toLocaleString("es-EC")}
            </p>
          </div>
          <Link className="text-xs font-semibold text-stone-600 underline hover:text-amber-800" href="/dashboard/requests">
            ← Volver
          </Link>
        </div>

        {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div> : null}

        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Ítem</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3 text-right">Solicitado</th>
                {canReview ? <th className="px-4 py-3 text-right">Aprobar</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {detail.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.inventory_item_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.inventory_item_code ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{item.requested_quantity} {item.unit_of_measure}</td>
                  {canReview ? (
                    <td className="px-4 py-3 text-right">
                      <label className="sr-only" htmlFor={"approved-" + item.id}>Cantidad aprobada para {item.inventory_item_name}</label>
                      <input
                        className="w-24 rounded-md border border-stone-300 px-2 py-1 text-right"
                        id={"approved-" + item.id}
                        max={item.requested_quantity}
                        min="0"
                        onChange={(event) => setApprovedQuantities({ ...approvedQuantities, [item.id]: event.target.value })}
                        step="0.001"
                        type="number"
                        value={approvedQuantities[item.id] ?? ""}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canReview ? (
          <div className="mt-6 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <h2 className="font-semibold text-amber-950">Revisar solicitud</h2>
              <p className="mt-1 text-sm text-amber-900">Puedes aprobar una cantidad total o parcial de cada artículo.</p>
            </div>
            <label className="block text-sm font-medium text-stone-800">
              Motivo de rechazo, si corresponde
              <textarea
                className="mt-1 w-full rounded-md border border-stone-300 bg-white p-2"
                maxLength={1000}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={2}
                value={rejectionReason}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={reviewing}
                onClick={submitRejection}
                type="button"
              >
                Rechazar
              </button>
              <button
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                disabled={reviewing}
                onClick={submitApproval}
                type="button"
              >
                {reviewing ? "Guardando…" : "Aprobar solicitud"}
              </button>
            </div>
          </div>
        ) : null}

        {isStaff && ["APPROVED", "PARTIALLY_APPROVED", "PREPARING"].includes(detail.request.status) ? (
          <div className="mt-6 flex justify-end">
            <Link className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800" href={`/dashboard/preparations/${detail.request.id}`}>
              {detail.request.status === "PREPARING" ? "Continuar preparación" : "Iniciar preparación"}
            </Link>
          </div>
        ) : null}

        {isStaff && detail.request.status === "PREPARED" ? (
          <div className="mt-6 flex justify-end">
            <Link className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" href={`/dashboard/deliveries/${detail.request.id}`}>
              Inspeccionar y entregar
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
