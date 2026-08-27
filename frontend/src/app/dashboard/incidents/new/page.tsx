"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export default function NewIncidentPage() {
  const router = useRouter();
  const identity = useDashboardIdentity();

  const [loanId, setLoanId] = useState("");
  const [type, setType] = useState<"DAMAGED" | "LOST" | "MISSING_INVENTORY">("DAMAGED");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const reportedByName = isAuthenticated ? identity.user.email : "";

  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          loan_id: loanId,
          type,
          severity,
          description,
          reported_by: reportedByName,
        }),
      });

      if (!res.ok) throw new Error("No fue posible registrar la incidencia.");

      router.push("/dashboard/incidents");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al procesar la incidencia."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Verificando permisos…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Novedades
            </p>
            <h1 className="mt-1 text-2xl font-bold text-stone-900">
              Reportar Novedad o Incidencia
            </h1>
          </div>
          <Link
            href="/dashboard/incidents"
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
              ID del Préstamo Asociado
            </label>
            <input
              type="text"
              required
              placeholder="Ej. uuid-del-prestamo"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
                Tipo de Novedad
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
              >
                <option value="DAMAGED">Daño / Avería de Equipo</option>
                <option value="LOST">Pérdida de Material</option>
                <option value="MISSING_INVENTORY">Insumo Faltante</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
                Nivel de Severidad
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
              >
                <option value="LOW">Baja (Leve)</option>
                <option value="MEDIUM">Media (Requiere atención)</option>
                <option value="HIGH">Alta (Equipo inoperativo)</option>
                <option value="CRITICAL">Crítica (Bloquea operaciones)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 mb-1">
              Descripción de los hechos
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detalle el estado del equipo o insumo al momento de la devolución..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Registrando…" : "Registrar Incidencia"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}