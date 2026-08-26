"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getActiveLoans, getLoanPending, recordEquipmentReturn, type EquipmentLoan } from "@/lib/api/client";

export default function ReturnsPage() {
  const identity = useDashboardIdentity();
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (identity.status !== "authenticated" || !identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) return;
    void getActiveLoans(identity.accessToken)
      .then(setLoans)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los préstamos."))
      .finally(() => setLoading(false));
  }, [identity]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando préstamos…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) return <GastronomyStatusPage kind="forbidden" />;

  async function registerFullReturn(loan: EquipmentLoan) {
    if (identity.status !== "authenticated") return;
    const returnedByName = window.prompt("Nombre de quien entrega los equipos:");
    if (!returnedByName?.trim()) return;
    setProcessingLoanId(loan.id);
    setError(null);
    try {
      const pending = await getLoanPending(identity.accessToken, loan.id);
      await recordEquipmentReturn(identity.accessToken, loan.id, {
        returned_by_name: returnedByName.trim(),
        quantity_details: pending.quantity_details.map((detail) => ({
          equipment_loan_detail_id: detail.equipment_loan_detail_id,
          returned_quantity: detail.pending_quantity,
          location_id: detail.location_id,
        })),
        loan_unit_ids: pending.unit_ids_pending,
      });
      setLoans((current) => current.filter((currentLoan) => currentLoan.id !== loan.id));
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "No fue posible registrar la devolución.");
    } finally {
      setProcessingLoanId(null);
    }
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Recepción post-clase
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Devoluciones y Retorno de Pañol
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Préstamos activos pendientes de devolución, con trazabilidad desde la API.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Tabla de Devoluciones */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar los préstamos activos: {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Solicitud / Clase</th>
                  <th className="px-4 py-3 font-semibold">Docente Responsable</th>
                  <th className="px-4 py-3 font-semibold">Fecha Recepción</th>
                  <th className="px-4 py-3 font-semibold">Estado de Recepción</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">Cargando préstamos…</td></tr>
                ) : loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {`Préstamo #${loan.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {loan.collected_by_name}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {new Date(loan.delivered_at).toLocaleDateString("es-EC")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            loan.is_overdue
                              ? "bg-red-50 text-red-700 ring-red-600/20"
                              : "bg-amber-50 text-amber-700 ring-amber-600/20"
                          }`}
                        >
                          {loan.is_overdue ? "Vencido" : "Pendiente de devolución"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button disabled={processingLoanId === loan.id} onClick={() => void registerFullReturn(loan)} className="text-xs font-semibold text-amber-800 underline disabled:opacity-50">{processingLoanId === loan.id ? "Registrando…" : "Registrar devolución"}</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No hay registros de devoluciones recientes.
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
