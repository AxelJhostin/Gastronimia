"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  getIncidentEvidences,
  getIncidentReport,
  type IncidentOperationalReportRow,
  type IncidentSeverity,
  type IncidentType,
} from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

const INCIDENT_LABELS: Record<IncidentType, string> = {
  BREAKAGE: "Rotura",
  DAMAGE: "Daño",
  DIRTINESS: "Suciedad",
  FAILURE: "Falla",
  INCOMPLETE: "Incompleto",
  MISSING: "Faltante",
  WEAR: "Desgaste",
};

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  LOW: "bg-stone-100 text-stone-700",
  MEDIUM: "bg-amber-100 text-amber-800",
};

type ErrorState = { message: string; token: string } | null;

export default function IncidentsPage() {
  const identity = useDashboardIdentity();
  const [incidents, setIncidents] = useState<IncidentOperationalReportRow[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<ErrorState>(null);
  const [evidences, setEvidences] = useState<
    Record<string, Array<{ path: string; signedUrl: string }>>
  >({});
  const [loadingEvidenceId, setLoadingEvidenceId] = useState<string | null>(null);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const loading = accessToken !== null && loadedToken !== accessToken;
  const error = errorState?.token === accessToken ? errorState.message : null;

  useEffect(() => {
    if (!hasAccess || !accessToken) return;

    let active = true;
    void getIncidentReport(accessToken)
      .then((rows) => {
        if (!active) return;
        setIncidents(rows);
        setErrorState(null);
        setLoadedToken(accessToken);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setErrorState({
          message:
            loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar las incidencias.",
          token: accessToken,
        });
        setLoadedToken(accessToken);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasAccess]);

  const loadEvidences = async (incidentId: string) => {
    if (!accessToken) return;
    if (evidences[incidentId]) {
      setEvidences((current) => {
        const next = { ...current };
        delete next[incidentId];
        return next;
      });
      return;
    }
    setLoadingEvidenceId(incidentId);
    setErrorState(null);
    try {
      const records = await getIncidentEvidences(accessToken, incidentId);
      const { data, error: signingError } = await createClient().storage
        .from("evidence")
        .createSignedUrls(records.map((record) => record.storage_path), 300);
      if (signingError) throw new Error(signingError.message);
      setEvidences((current) => ({
        ...current,
        [incidentId]: data
          .filter(
            (item): item is typeof item & { path: string; signedUrl: string } =>
              Boolean(item.path && item.signedUrl),
          )
          .map((item) => ({ path: item.path, signedUrl: item.signedUrl })),
      }));
    } catch (evidenceError: unknown) {
      setErrorState({
        message:
          evidenceError instanceof Error
            ? evidenceError.message
            : "No fue posible abrir las evidencias.",
        token: accessToken,
      });
    } finally {
      setLoadingEvidenceId(null);
    }
  };

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando incidencias…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Control y auditoría
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Novedades registradas
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">
              Las novedades se generan durante una inspección de salida o devolución;
              no se crean como registros aislados.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-lg bg-amber-800 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-amber-900" href="/dashboard/returns">
              Ir a devoluciones
            </Link>
            <Link className="rounded-lg border border-stone-300 px-4 py-2 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50" href="/dashboard">
              Volver al panel
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Solicitud / préstamo</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Severidad</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
                <th className="px-4 py-3 font-semibold">Impacto</th>
                <th className="px-4 py-3 text-right font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={7}>Cargando novedades e incidencias…</td></tr>
              ) : incidents.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-stone-500" colSpan={7}>No hay novedades registradas por inspecciones.</td></tr>
              ) : (
                incidents.map((incident) => (
                  <tr className="align-top hover:bg-stone-50" key={incident.id}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">#{incident.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      <span className="block">Solicitud #{incident.equipment_request_id.slice(0, 8)}</span>
                      <span className="block">
                        {incident.equipment_loan_id ? `Préstamo #${incident.equipment_loan_id.slice(0, 8)}` : "Sin préstamo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{INCIDENT_LABELS[incident.incident_type]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="text-stone-800">{incident.description}</p>
                      <p className="mt-1 text-xs text-stone-500">{incident.evidence_count} evidencia{incident.evidence_count === 1 ? "" : "s"}</p>
                      {incident.evidence_count > 0 ? (
                        <button className="mt-2 text-xs font-semibold text-amber-800 underline" disabled={loadingEvidenceId === incident.id} onClick={() => void loadEvidences(incident.id)} type="button">
                          {loadingEvidenceId === incident.id ? "Generando enlaces…" : evidences[incident.id] ? "Ocultar evidencias" : "Ver evidencias"}
                        </button>
                      ) : null}
                      {evidences[incident.id] ? (
                        <ul className="mt-2 space-y-1 rounded-lg bg-stone-100 p-2">
                          {evidences[incident.id].map((evidence, index) => (
                            <li key={evidence.path}>
                              <a className="text-xs font-semibold text-amber-900 underline" href={evidence.signedUrl} rel="noreferrer" target="_blank">
                                Abrir evidencia {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {incident.requires_unavailable ? <span className="text-red-700">Unidad no disponible</span> : <span className="text-emerald-700">Sin bloqueo automático</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-stone-500">{new Date(incident.created_at).toLocaleString("es-EC")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
