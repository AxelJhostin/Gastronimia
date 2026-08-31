"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getLoanPending,
  recordEquipmentReturn,
  type EquipmentLoanPending,
} from "@/lib/api/client";

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const identity = useDashboardIdentity();

  const loanId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pending, setPending] = useState<EquipmentLoanPending | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [returnedBy, setReturnedBy] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;

  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !loanId) return;

    void getLoanPending(accessToken, loanId)
      .then((data) => {
        setPending(data);
        setReturnedBy(data.loan.collected_by_name);

        const initialQty: Record<string, number> = {};
        data.quantity_details.forEach((item) => {
          initialQty[item.equipment_loan_detail_id] = item.pending_quantity;
        });
        setQuantities(initialQty);
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible obtener el detalle de devolución del préstamo."
        )
      )
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken, loanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !loanId || !pending) return;

    setSubmitting(true);
    setError(null);

    try {
      const quantityDetails = pending.quantity_details.map((item) => ({
        equipment_loan_detail_id: item.equipment_loan_detail_id,
        returned_quantity: quantities[item.equipment_loan_detail_id] ?? 0,
        location_id: item.location_id,
      }));

      await recordEquipmentReturn(accessToken, loanId, {
        returned_by_name: returnedBy,
        quantity_details: quantityDetails,
        loan_unit_ids: pending.unit_ids_pending,
      });

      router.push("/dashboard/returns");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al procesar la devolución."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading" || loading) {
    return <p className="p-6 text-sm text-stone-600">Cargando datos del préstamo…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Control de Devolución
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Recepcionar Préstamo #{pending?.loan.id.slice(0, 8)}
            </h1>
          </div>
          <Link
            href="/dashboard/returns"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Cancelar
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700">
              Nombre de quien entrega el material:
            </label>
            <input
              type="text"
              required
              value={returnedBy}
              onChange={(e) => setReturnedBy(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-3">
              Cantidades a Recepcionar
            </h2>
            <table className="w-full text-left text-sm text-stone-700 border-collapse">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pendiente</th>
                  <th className="px-4 py-3 font-semibold text-right">Cantidad Devuelta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pending?.quantity_details.map((item) => (
                  <tr key={item.equipment_loan_detail_id}>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      Pendientes: {item.pending_quantity} (Prestados: {item.loaned_quantity})
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={item.pending_quantity}
                        value={quantities[item.equipment_loan_detail_id] ?? 0}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [item.equipment_loan_detail_id]: Number(e.target.value),
                          })
                        }
                        className="w-24 rounded-md border border-stone-300 px-2 py-1 text-right font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Guardando…" : "Confirmar Recepción"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
