"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getInventoryUnitHistory, type InventoryUnitHistory } from "@/lib/api/client";

export default function InventoryUnitHistoryPage() {
  const params = useParams();
  const identity = useDashboardIdentity();
  const unitId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [history, setHistory] = useState<InventoryUnitHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated" || !unitId) return;
    void getInventoryUnitHistory(identity.accessToken, unitId)
      .then(setHistory)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar la hoja de vida.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, identity, unitId]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando hoja de vida…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900"><section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between border-b border-stone-100 pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Trazabilidad de unidad</p><h1 className="mt-1 text-3xl font-bold">Hoja de vida</h1><p className="mt-1 text-sm text-stone-600">Cambios de estado, condición, ubicación y activación.</p></div><Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard/inventory">Volver</Link></div>
      {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
      <ol className="mt-6 space-y-3">{loading ? <li className="text-sm text-stone-500">Cargando eventos…</li> : history.map((event) => <li className="grid gap-3 rounded-xl border border-stone-200 p-4 sm:grid-cols-[170px_1fr]" key={event.id}><time className="text-xs font-semibold text-stone-500">{new Date(event.recorded_at).toLocaleString("es-EC")}</time><div><p className="font-semibold">{event.event_type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-stone-600">Estado: {event.previous_status ?? "—"} → {event.current_status} · Condición: {event.previous_condition ?? "—"} → {event.current_condition}</p></div></li>)}{!loading && !history.length ? <li className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">No hay eventos registrados para esta unidad.</li> : null}</ol>
    </section></main>
  );
}
