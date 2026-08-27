"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export interface IncidentItem {
  id: string;
  loan_id: string;
  reported_by: string;
  type: "DAMAGED" | "LOST" | "MISSING_INVENTORY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  created_at: string;
}

type ErrorState = {
  token: string;
  message: string;
} | null;

export default function IncidentsPage() {
  const identity = useDashboardIdentity();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const isAuthenticated = identity.status === "authenticated";

  const accessToken = isAuthenticated
    ? identity.accessToken
    : null;

  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some(
      (role) => role === "ADMIN" || role === "MANAGER"
    );

  /*
   * El estado de carga se calcula a partir de si ya se
   * completó la consulta correspondiente al token actual.
   *
   * De esta manera evitamos llamar setLoading(true)
   * directamente dentro de useEffect.
   */
  const loading =
    accessToken !== null &&
    loadedToken !== accessToken;

  useEffect(() => {
    if (!hasAccess || !accessToken) {
      return;
    }

    let active = true;

    void fetch("/api/v1/incidents", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "No se pudieron cargar las incidencias."
          );
        }

        return res.json() as Promise<IncidentItem[]>;
      })
      .then((data) => {
        if (!active) {
          return;
        }

        setIncidents(data);
        setErrorState(null);
        setLoadedToken(accessToken);
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }

        setErrorState({
          token: accessToken,
          message:
            err instanceof Error
              ? err.message
              : "Error al cargar novedades.",
        });

        setLoadedToken(accessToken);
      });

    return () => {
      active = false;
    };
  }, [hasAccess, accessToken]);

  /*
   * Solo mostramos el error asociado al token actual.
   */
  const error =
    errorState?.token === accessToken
      ? errorState.message
      : null;

  if (identity.status === "loading") {
    return (
      <p className="p-6 text-sm text-stone-600">
        Cargando reporte de incidencias…
      </p>
    );
  }

  if (identity.status === "unavailable") {
    return (
      <p className="p-6 text-sm text-red-700">
        {identity.message}
      </p>
    );
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Control & Auditoría
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Gestión de Novedades e Incidencias
            </h1>

            <p className="mt-1 text-sm text-stone-600">
              Registro de equipos averiados, faltantes de inventario o pérdidas tras recepciones.
            </p>
          </div>

          <Link
            href="/dashboard/incidents/new"
            className="rounded-lg bg-amber-800 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-900"
          >
            + Reportar Novedad
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabla de Incidencias */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  Código
                </th>

                <th className="px-4 py-3 font-semibold">
                  Préstamo
                </th>

                <th className="px-4 py-3 font-semibold">
                  Tipo
                </th>

                <th className="px-4 py-3 font-semibold">
                  Severidad
                </th>

                <th className="px-4 py-3 font-semibold">
                  Reportado por
                </th>

                <th className="px-4 py-3 font-semibold">
                  Estado
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Fecha
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-stone-500"
                  >
                    Cargando novedades e incidencias…
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-stone-500"
                  >
                    No hay novedades o incidencias registradas actualmente.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">
                      #{inc.id.slice(0, 8)}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      #{inc.loan_id.slice(0, 8)}
                    </td>

                    <td className="px-4 py-3 font-medium text-stone-900">
                      {inc.type === "DAMAGED" &&
                        "Daño / Avería"}

                      {inc.type === "LOST" &&
                        "Pérdida"}

                      {inc.type === "MISSING_INVENTORY" &&
                        "Insumo Faltante"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          inc.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : inc.severity === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : inc.severity === "MEDIUM"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-stone-700">
                      {inc.reported_by}
                    </td>

                    <td className="px-4 py-3 text-xs font-semibold">
                      {inc.status === "OPEN" && (
                        <span className="text-red-600">
                          ABIERTA
                        </span>
                      )}

                      {inc.status === "IN_REVIEW" && (
                        <span className="text-amber-600">
                          EN REVISIÓN
                        </span>
                      )}

                      {inc.status === "RESOLVED" && (
                        <span className="text-emerald-600">
                          RESUELTA
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-stone-500">
                      {new Date(
                        inc.created_at
                      ).toLocaleDateString("es-EC")}
                    </td>
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