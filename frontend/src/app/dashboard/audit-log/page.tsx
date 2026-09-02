"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getOperationalAuditLogs, type OperationalAuditLog } from "@/lib/api/client";

export default function AuditLogPage() {
  const identity = useDashboardIdentity();
  const [logs, setLogs] = useState<OperationalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;
    void getOperationalAuditLogs(identity.accessToken)
      .then(setLogs)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar la auditoría.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, identity]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando auditoría…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Trazabilidad</p><h1 className="mt-1 text-3xl font-bold">Registro de auditoría</h1><p className="mt-1 text-sm text-stone-600">Últimas operaciones registradas por el sistema.</p></div><Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard">Volver al panel</Link></div>
        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200"><table className="w-full text-left text-sm"><thead className="border-b bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Entidad</th><th className="px-4 py-3">Responsable</th></tr></thead><tbody className="divide-y">{loading ? <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>Cargando registros…</td></tr> : logs.map((log) => <tr key={log.id}><td className="px-4 py-3">{new Date(log.recorded_at).toLocaleString("es-EC")}</td><td className="px-4 py-3 font-semibold">{log.action.replaceAll("_", " ")}</td><td className="px-4 py-3">{log.entity_table}</td><td className="px-4 py-3 font-mono text-xs">{log.performed_by_user_id ? `…${log.performed_by_user_id.slice(-8)}` : "Sistema"}</td></tr>)}{!loading && !logs.length ? <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>No hay eventos de auditoría.</td></tr> : null}</tbody></table></div>
      </section>
    </main>
  );
}
