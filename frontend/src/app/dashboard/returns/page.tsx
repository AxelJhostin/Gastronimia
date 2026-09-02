"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getActiveLoans,
  getPendingReturnInspections,
  type EquipmentLoan,
  type EquipmentReturnInspectionContext,
} from "@/lib/api/client";

export default function ReturnsPage() {
  const identity = useDashboardIdentity();
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [pendingInspections, setPendingInspections] = useState<
    EquipmentReturnInspectionContext[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;

    void Promise.all([
      getActiveLoans(identity.accessToken),
      getPendingReturnInspections(identity.accessToken),
    ])
      .then(([activeLoans, inspections]) => {
        setLoans(activeLoans);
        setPendingInspections(inspections);
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible obtener los préstamos activos."
        )
      )
      .finally(() => setLoading(false));
  }, [identity, hasAccess]);

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando préstamos activos…</p>;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Gestión de Recepción
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Devolución de Equipos e Insumos
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Registro de recepciones y control de préstamos activos en pañol.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {pendingInspections.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
              Inspecciones pendientes
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Estas devoluciones ya afectaron el inventario y deben inspeccionarse antes de liberar sus unidades.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pendingInspections.map((context) => (
                <article className="rounded-xl border border-amber-200 bg-white p-4" key={context.equipment_return.id}>
                  <p className="font-mono text-xs font-semibold text-stone-500">
                    Devolución #{context.equipment_return.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {context.equipment_return.returned_by_name}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {new Date(context.equipment_return.returned_at).toLocaleString("es-EC")} · {context.units.length} unidades
                  </p>
                  <Link
                    className="mt-3 inline-block text-sm font-semibold text-amber-900 underline"
                    href={`/dashboard/returns/inspections/${context.equipment_return.id}`}
                  >
                    Continuar inspección →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar préstamos: {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cód. Préstamo</th>
                  <th className="px-4 py-3 font-semibold">Entregado a</th>
                  <th className="px-4 py-3 font-semibold">Fecha Despacho</th>
                  <th className="px-4 py-3 font-semibold">Estado / Mora</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      Cargando préstamos en curso…
                    </td>
                  </tr>
                ) : loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900 font-mono text-xs">
                        {`#${loan.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {loan.collected_by_name}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {new Date(loan.delivered_at).toLocaleString("es-EC")}
                      </td>
                      <td className="px-4 py-3.5">
                        {loan.is_overdue ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                            En plazo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/returns/${loan.id}`}
                          className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                        >
                          Registrar Recepción →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No hay préstamos pendientes por devolución.
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
