"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  getPendingReturnInspection,
  recordReturnInspection,
  registerIncidentEvidence,
  type EquipmentInspection,
  type EquipmentReturnInspectionContext,
  type IncidentSeverity,
  type IncidentType,
  type InventoryUnitCondition,
} from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

type UnitInspectionState = {
  condition: InventoryUnitCondition;
  isComplete: boolean;
  incidentType: IncidentType | "";
  severity: IncidentSeverity;
  description: string;
  files: File[];
};

const INCIDENT_OPTIONS: Array<{ value: IncidentType; label: string }> = [
  { value: "DAMAGE", label: "Daño" },
  { value: "MISSING", label: "Faltante" },
  { value: "BREAKAGE", label: "Rotura" },
  { value: "DIRTINESS", label: "Suciedad" },
  { value: "INCOMPLETE", label: "Incompleto" },
  { value: "WEAR", label: "Desgaste" },
  { value: "FAILURE", label: "Falla" },
];

const ACCEPTED_EVIDENCE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;

function initialUnitState(context: EquipmentReturnInspectionContext) {
  return Object.fromEntries(
    context.units.map((unit) => [
      unit.inventory_unit_id,
      {
        condition: unit.condition,
        isComplete: true,
        incidentType: "",
        severity: "LOW",
        description: "",
        files: [],
      } satisfies UnitInspectionState,
    ]),
  );
}

export default function PendingReturnInspectionPage() {
  const params = useParams<{ id: string }>();
  const identity = useDashboardIdentity();
  const returnId = params.id;
  const [context, setContext] = useState<EquipmentReturnInspectionContext | null>(null);
  const [units, setUnits] = useState<Record<string, UnitInspectionState>>({});
  const [notes, setNotes] = useState("");
  const [inspection, setInspection] = useState<EquipmentInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !returnId) return;
    void getPendingReturnInspection(accessToken, returnId)
      .then((data) => {
        setContext(data);
        setUnits(initialUnitState(data));
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible recuperar la devolución pendiente.",
        ),
      )
      .finally(() => setLoading(false));
  }, [accessToken, hasAccess, returnId]);

  const updateUnit = (unitId: string, patch: Partial<UnitInspectionState>) => {
    setUnits((current) => ({
      ...current,
      [unitId]: { ...current[unitId], ...patch },
    }));
  };

  const uploadEvidences = async (result: EquipmentInspection) => {
    if (!accessToken || identity.status !== "authenticated") return;
    const supabase = createClient();
    for (const incident of result.incidents) {
      const files = units[incident.inventory_unit_id]?.files ?? [];
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${identity.user.id}/${crypto.randomUUID()}.${extension}`;
        const storage = supabase.storage.from("evidence");
        const { error: uploadError } = await storage
          .upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        try {
          await registerIncidentEvidence(accessToken, incident.id, storagePath);
        } catch (registrationError) {
          await storage.remove([storagePath]);
          throw registrationError;
        }
      }
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!accessToken || !context || inspection) return;

    const states = context.units.map((unit) => units[unit.inventory_unit_id]);
    if (
      states.some(
        (state) =>
          (state.condition === "DAMAGED" || !state.isComplete || state.incidentType) &&
          (!state.incidentType || !state.description.trim()),
      )
    ) {
      setError("Describe la novedad de cada unidad dañada, incompleta o marcada con incidencia.");
      return;
    }
    const invalidFile = states
      .flatMap((state) => state.files)
      .find(
        (file) =>
          !ACCEPTED_EVIDENCE_TYPES.has(file.type) || file.size > MAX_EVIDENCE_SIZE,
      );
    if (invalidFile) {
      setError("Las evidencias deben ser JPEG, PNG o WebP de máximo 10 MB.");
      return;
    }
    if (event) {
      setError(null);
      setConfirmationOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setWarning(null);
    try {
      const result = await recordReturnInspection(accessToken, context.equipment_return.id, {
        notes: notes.trim() || undefined,
        items: context.units.map((unit) => {
          const state = units[unit.inventory_unit_id];
          return {
            inventory_unit_id: unit.inventory_unit_id,
            observed_condition: state.condition,
            is_complete: state.isComplete,
            incidents: state.incidentType
              ? [
                  {
                    incident_type: state.incidentType,
                    severity: state.severity,
                    description: state.description.trim(),
                  },
                ]
              : [],
          };
        }),
      });
      setInspection(result);
      setConfirmationOpen(false);
      try {
        await uploadEvidences(result);
      } catch (uploadError: unknown) {
        setWarning(
          uploadError instanceof Error
            ? `La inspección quedó registrada, pero una evidencia no se pudo adjuntar: ${uploadError.message}`
            : "La inspección quedó registrada, pero una evidencia no se pudo adjuntar.",
        );
      }
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible completar la inspección pendiente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading" || loading) {
    return <p className="p-6 text-sm text-stone-600">Recuperando devolución…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;
  if (!context) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "La devolución no existe o ya fue inspeccionada."}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="border-b border-stone-100 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Recuperación operativa
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Completar inspección #{context.equipment_return.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            La devolución de {context.equipment_return.returned_by_name} ya fue registrada. Falta inspeccionar las unidades para definir su disponibilidad.
          </p>
          <Link className="mt-3 inline-block text-xs font-semibold text-stone-600 underline" href="/dashboard/returns">
            ← Volver a devoluciones
          </Link>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        {warning ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">{warning}</div> : null}

        {inspection ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-bold text-emerald-950">Inspección completada</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Se registraron {inspection.incidents.length} novedades y las unidades quedaron actualizadas.
            </p>
            <Link className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline" href="/dashboard/returns">
              Volver a devoluciones
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {context.units.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                Esta devolución contiene únicamente recursos por cantidad. Confirma la inspección para cerrar el paso pendiente.
              </div>
            ) : (
              context.units.map((unit) => {
                const state = units[unit.inventory_unit_id];
                if (!state) return null;
                return (
                  <article className="rounded-xl border border-stone-200 p-4" key={unit.inventory_unit_id}>
                    <h2 className="font-semibold">{unit.asset_tag}{unit.serial_number ? ` · S/N ${unit.serial_number}` : ""}</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-stone-600">Condición observada<select aria-label={`Condición observada ${unit.asset_tag}`} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={state.condition} onChange={(event) => updateUnit(unit.inventory_unit_id, { condition: event.target.value as InventoryUnitCondition })}><option value="NEW">Nuevo</option><option value="GOOD">Bueno</option><option value="FAIR">Regular</option><option value="DAMAGED">Dañado</option></select></label>
                      <label className="flex items-center gap-2 self-end rounded-lg bg-stone-50 px-3 py-2 text-sm"><input checked={state.isComplete} onChange={(event) => updateUnit(unit.inventory_unit_id, { isComplete: event.target.checked })} type="checkbox" />Unidad completa</label>
                      <label className="text-xs font-semibold text-stone-600">Novedad<select aria-label={`Novedad ${unit.asset_tag}`} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={state.incidentType} onChange={(event) => updateUnit(unit.inventory_unit_id, { incidentType: event.target.value as IncidentType | "" })}><option value="">Sin novedad</option>{INCIDENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                      <label className="text-xs font-semibold text-stone-600">Severidad<select aria-label={`Severidad ${unit.asset_tag}`} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" disabled={!state.incidentType} value={state.severity} onChange={(event) => updateUnit(unit.inventory_unit_id, { severity: event.target.value as IncidentSeverity })}><option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label>
                      {state.incidentType ? <><label className="text-xs font-semibold text-stone-600 sm:col-span-2">Descripción<textarea aria-label={`Descripción ${unit.asset_tag}`} className="mt-1 min-h-20 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" maxLength={2000} onChange={(event) => updateUnit(unit.inventory_unit_id, { description: event.target.value })} value={state.description} /></label><label className="text-xs font-semibold text-stone-600 sm:col-span-2">Evidencias opcionales · JPEG, PNG o WebP, máximo 10 MB<input accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" multiple onChange={(event) => updateUnit(unit.inventory_unit_id, { files: Array.from(event.target.files ?? []) })} type="file" /></label></> : null}
                    </div>
                  </article>
                );
              })
            )}
            <label className="block text-sm font-semibold text-stone-700">Notas de inspección<textarea className="mt-1 min-h-20 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" maxLength={2000} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
            <div className="flex justify-end border-t border-stone-100 pt-5"><button className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={submitting} type="submit">{submitting ? "Registrando inspección…" : "Completar inspección"}</button></div>
          </form>
        )}
      </section>
      <ConfirmModal
        confirmLabel="Completar inspección"
        description="La inspección actualizará la condición y disponibilidad de todas las unidades devueltas."
        isOpen={confirmationOpen}
        isSubmitting={submitting}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={() => void handleSubmit()}
        title="Confirmar inspección de devolución"
        tone="warning"
      />
    </main>
  );
}
