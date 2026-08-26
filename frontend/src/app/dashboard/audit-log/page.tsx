"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getOperationalAuditLogs, type OperationalAuditLog } from "@/lib/api/client";

export default function AuditLogPage() {
  const identity = useDashboardIdentity();
  const [logs, setLogs] = useState<OperationalAuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (identity.status === "authenticated" && identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) void getOperationalAuditLogs(identity.accessToken).then(setLogs).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la auditoría.")); }, [identity]);
  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando auditoría…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) return <GastronomyStatusPage kind="forbidden" />;
  return <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900"><section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"><div className="flex justify-between border-b pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Seguridad y Control</p><h1 className="mt-2 text-3xl font-bold">Historial de Auditoría</h1></div><Link href="/dashboard" className="text-xs font-semibold text-stone-600 underline">← Volver</Link></div>{error ? <p className="mt-6 text-sm text-red-700">{error}</p> : <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="p-3">Fecha</th><th className="p-3">Acción</th><th className="p-3">Entidad</th><th className="p-3">Registro</th></tr></thead><tbody className="divide-y">{logs.map((log) => <tr key={log.id}><td className="p-3">{new Date(log.recorded_at).toLocaleString("es-EC")}</td><td className="p-3">{log.action}</td><td className="p-3">{log.entity_table}</td><td className="p-3 font-mono text-xs">{log.entity_id.slice(0, 8)}</td></tr>)}{!logs.length ? <tr><td className="p-6 text-center text-stone-500" colSpan={4}>No hay eventos registrados.</td></tr> : null}</tbody></table></div>}</section></main>;
}
