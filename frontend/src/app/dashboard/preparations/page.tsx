"use client";

import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getOperationalReport, startEquipmentPreparation, type OperationalReportRow } from "@/lib/api/client";

type PreparationRequest = OperationalReportRow & { id: string; status: string; start_at: string };

export default function PreparationsPage() {
  const identity = useDashboardIdentity();
  const [requests, setRequests] = useState<PreparationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    if (identity.status !== "authenticated") return;
    try {
      const rows = await getOperationalReport(identity.accessToken, "requests");
      setRequests(rows.filter((row): row is PreparationRequest => typeof row.id === "string" && typeof row.status === "string" && ["APPROVED", "PARTIALLY_APPROVED", "PREPARING", "PREPARED"].includes(row.status)));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las preparaciones."); }
  }

  useEffect(() => {
    if (identity.status !== "authenticated") return;
    void getOperationalReport(identity.accessToken, "requests")
      .then((rows) => setRequests(rows.filter((row): row is PreparationRequest => typeof row.id === "string" && typeof row.status === "string" && ["APPROVED", "PARTIALLY_APPROVED", "PREPARING", "PREPARED"].includes(row.status))))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las preparaciones."));
  }, [identity]);
  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando preparación…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER")) return <GastronomyStatusPage kind="forbidden" />;

  async function start(requestId: string) {
    if (identity.status !== "authenticated") return;
    setWorkingId(requestId); setError(null);
    try { await startEquipmentPreparation(identity.accessToken, requestId); await load(); }
    catch (startError) { setError(startError instanceof Error ? startError.message : "No fue posible iniciar la preparación."); }
    finally { setWorkingId(null); }
  }

  return <main className="p-6 text-stone-900"><section className="mx-auto max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Operación de pañol</p><h1 className="mt-2 text-3xl font-bold">Preparación y despacho</h1><p className="mt-2 text-sm text-stone-600">Solicitudes aprobadas y su estado de preparación.</p>{error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}<div className="mt-6 grid gap-4 md:grid-cols-3">{["APPROVED", "PREPARING", "PREPARED"].map((status) => <section key={status} className="rounded-xl border bg-stone-50 p-4"><h2 className="font-semibold">{status === "APPROVED" ? "Por preparar" : status === "PREPARING" ? "En preparación" : "Preparadas"}</h2><div className="mt-3 space-y-3">{requests.filter((request) => request.status === status || (status === "APPROVED" && request.status === "PARTIALLY_APPROVED")).map((request) => <article key={request.id} className="rounded-lg border bg-white p-3 text-sm"><p className="font-medium">Solicitud #{request.id.slice(0, 8)}</p><p className="mt-1 text-xs text-stone-600">{new Date(request.start_at).toLocaleString("es-EC")}</p>{status === "APPROVED" ? <button disabled={workingId === request.id} onClick={() => void start(request.id)} className="mt-3 text-xs font-semibold text-amber-800 underline disabled:opacity-50">{workingId === request.id ? "Iniciando…" : "Iniciar preparación"}</button> : null}</article>)}</div></section>)}</div><p className="mt-6 text-xs text-stone-500">El registro de cantidades y unidades reservadas permanece validado por el flujo operativo de FastAPI.</p></section></main>;
}
