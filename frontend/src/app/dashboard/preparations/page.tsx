"use client";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export default function PreparationsPage() {
  const identity = useDashboardIdentity();

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Verificando permisos…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="p-6 text-stone-900">
      <section className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Operación de pañol</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Preparación y despacho</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          El flujo de preparación ya existe en FastAPI, pero requiere registrar los ítems reservados y sus ubicaciones antes de completarlo. Esta interfaz se mantiene desactivada hasta incorporar esos datos; no actualiza estados directamente desde Supabase.
        </p>
      </section>
    </main>
  );
}
