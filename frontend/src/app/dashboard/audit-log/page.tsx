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
    identity.user.roles.includes("ADMIN");

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
        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Entidad y cambios</th><th className="px-4 py-3">Responsable</th></tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>Cargando registros…</td></tr> : logs.map((log) => (
                <tr data-audit-id={log.id} key={log.id}>
                  <td className="px-4 py-3 align-top">{new Date(log.recorded_at).toLocaleString("es-EC")}</td>
                  <td className="px-4 py-3 align-top font-semibold">{log.action === "UNIT_CHANGE" ? "Edición de unidad" : log.action.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 align-top">
                    {log.entity_table === "inventory_units" ? `Unidad ${String(log.current_data?.asset_tag ?? log.entity_id)}` : log.entity_table}
                    {log.action === "UNIT_CHANGE" ? <UnitChanges log={log} /> : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span>{log.actor?.full_name ?? (log.performed_by_user_id ? "Usuario registrado" : "No registrado")}</span>
                    {log.performed_by_user_id ? <span className="mt-1 block font-mono text-xs text-stone-500" title={log.performed_by_user_id}>…{log.performed_by_user_id.slice(-8)}</span> : null}
                  </td>
                </tr>
              ))}
              {!loading && !logs.length ? <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={4}>No hay eventos de auditoría.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const unitFields: Record<string, string> = {
  asset_tag: "Etiqueta patrimonial", serial_number: "Número de serie", status: "Estado",
  condition: "Condición", location_id: "Ubicación (identificador)", is_active: "Activo", notes: "Notas",
};

function auditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  const labels: Record<string, string> = { AVAILABLE: "Disponible", LOANED: "Prestado", MAINTENANCE: "Mantenimiento", DISABLED: "Fuera de servicio", NEW: "Nuevo", GOOD: "Bueno", FAIR: "Regular", DAMAGED: "Dañado" };
  return labels[String(value)] ?? String(value);
}

function UnitChanges({ log }: { log: OperationalAuditLog }) {
  const changes = Object.entries(unitFields).filter(([key]) => log.previous_data?.[key] !== log.current_data?.[key]);
  if (!changes.length) return null;
  return <details className="mt-2 min-w-56 text-xs"><summary className="cursor-pointer font-semibold text-amber-800">Ver cambios</summary><dl className="mt-2 space-y-2">{changes.map(([key, label]) => <div key={key}><dt className="font-semibold">{label}</dt><dd className="break-words">Antes: {auditValue(log.previous_data?.[key])}<br />Después: {auditValue(log.current_data?.[key])}</dd></div>)}</dl></details>;
}
