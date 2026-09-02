"use client";

import Link from "next/link";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export default function NewIncidentPage() {
  const identity = useDashboardIdentity();
  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Verificando permisos…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Flujo protegido</p>
        <h1 className="mt-2 text-2xl font-bold">Las novedades se registran al inspeccionar</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Para conservar la trazabilidad, una novedad debe quedar vinculada a la unidad,
          solicitud, préstamo e inspección que la originó. Por eso esta pantalla no admite
          crear incidencias manuales mediante un UUID.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Usa el flujo de devolución para recibir el material. La inspección de retorno y
          sus evidencias se incorporarán en el siguiente bloque funcional.
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900" href="/dashboard/returns">Ir a devoluciones</Link>
          <Link className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50" href="/dashboard/incidents">Ver novedades</Link>
        </div>
      </section>
    </main>
  );
}
