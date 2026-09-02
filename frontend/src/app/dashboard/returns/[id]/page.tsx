"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  getLoanPending,
  recordEquipmentReturn,
  recordReturnInspection,
  registerIncidentEvidence,
  type EquipmentInspection,
  type EquipmentLoanPending,
  type EquipmentReturn,
  type IncidentSeverity,
  type IncidentType,
  type InventoryUnitCondition,
} from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

type UnitReturnState = {
  selected: boolean;
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

function initialUnitState(pending: EquipmentLoanPending) {
  return Object.fromEntries(
    pending.pending_units.map((unit) => [
      unit.equipment_loan_unit_id,
      {
        selected: true,
        condition: unit.condition,
        isComplete: true,
        incidentType: "",
        severity: "LOW",
        description: "",
        files: [],
      } satisfies UnitReturnState,
    ]),
  );
}

export default function ReturnDetailPage() {
  const params = useParams();
  const identity = useDashboardIdentity();
  const loanId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pending, setPending] = useState<EquipmentLoanPending | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [registeredReturn, setRegisteredReturn] = useState<EquipmentReturn | null>(null);
  const [inspection, setInspection] = useState<EquipmentInspection | null>(null);
  const [returnedBy, setReturnedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<Record<string, UnitReturnState>>({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !loanId) return;

    void getLoanPending(accessToken, loanId)
      .then((data) => {
        setPending(data);
        setReturnedBy(data.loan.collected_by_name);
        setQuantities(
          Object.fromEntries(
            data.quantity_details.map((item) => [
              item.equipment_loan_detail_id,
              Number(item.pending_quantity),
            ]),
          ),
        );
        setUnits(initialUnitState(data));
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible obtener el detalle de devolución del préstamo.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken, loanId]);

  const updateUnit = (loanUnitId: string, patch: Partial<UnitReturnState>) => {
    setUnits((current) => ({
      ...current,
      [loanUnitId]: { ...current[loanUnitId], ...patch },
    }));
  };

  const uploadEvidences = async (result: EquipmentInspection) => {
    if (!accessToken || identity.status !== "authenticated") return;
    const supabase = createClient();

    for (const incident of result.incidents) {
      const unit = pending?.pending_units.find(
        (candidate) => candidate.inventory_unit_id === incident.inventory_unit_id,
      );
      if (!unit) continue;
      const files = units[unit.equipment_loan_unit_id]?.files ?? [];

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
    if (!accessToken || !loanId || !pending || inspection) return;
    if (!returnedBy.trim()) {
      setError("Indica quién devuelve los recursos.");
      return;
    }

    const quantityDetails = pending.quantity_details
      .map((item) => ({
        equipment_loan_detail_id: item.equipment_loan_detail_id,
        returned_quantity: quantities[item.equipment_loan_detail_id] ?? 0,
        location_id: item.location_id,
      }))
      .filter((item) => item.returned_quantity > 0);
    const selectedUnits = pending.pending_units.filter(
      (unit) => units[unit.equipment_loan_unit_id]?.selected,
    );
    const invalidQuantity = pending.quantity_details.some((item) => {
      const amount = quantities[item.equipment_loan_detail_id] ?? 0;
      return !Number.isFinite(amount) || amount < 0 || amount > Number(item.pending_quantity);
    });
    if (invalidQuantity) {
      setError("Las cantidades deben estar entre cero y el saldo pendiente.");
      return;
    }
    if (quantityDetails.length === 0 && selectedUnits.length === 0) {
      setError("Selecciona al menos una cantidad o una unidad para devolver.");
      return;
    }
    if (
      selectedUnits.some((unit) => {
        const state = units[unit.equipment_loan_unit_id];
        return (
          (state.condition === "DAMAGED" || !state.isComplete || state.incidentType) &&
          (!state.incidentType || !state.description.trim())
        );
      })
    ) {
      setError("Describe la novedad de cada unidad dañada, incompleta o marcada con incidencia.");
      return;
    }
    const invalidFile = selectedUnits
      .flatMap((unit) => units[unit.equipment_loan_unit_id].files)
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
      const equipmentReturn =
        registeredReturn ??
        (await recordEquipmentReturn(accessToken, loanId, {
          returned_by_name: returnedBy.trim(),
          quantity_details: quantityDetails,
          loan_unit_ids: selectedUnits.map((unit) => unit.equipment_loan_unit_id),
        }));
      setRegisteredReturn(equipmentReturn);

      const result = await recordReturnInspection(accessToken, equipmentReturn.id, {
        notes: notes.trim() || undefined,
        items: selectedUnits.map((unit) => {
          const state = units[unit.equipment_loan_unit_id];
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
            ? `La devolución e inspección quedaron registradas, pero una evidencia no se pudo adjuntar: ${uploadError.message}`
            : "La devolución e inspección quedaron registradas, pero una evidencia no se pudo adjuntar.",
        );
      }
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible completar la devolución y su inspección.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading" || loading) {
    return <p className="p-6 text-sm text-stone-600">Cargando datos del préstamo…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;
  if (error && !pending) {
    return <main className="p-6"><div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></main>;
  }
  if (!pending) return null;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Control de devolución</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Recepcionar préstamo #{pending.loan.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-stone-600">Admite recepción parcial y revisa cada unidad antes de liberarla.</p>
          </div>
          <Link className="text-xs font-semibold text-stone-600 underline hover:text-amber-800" href="/dashboard/returns">Volver a devoluciones</Link>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        {warning ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">{warning}</div> : null}

        {inspection ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Recepción completada</p>
            <h2 className="mt-1 text-xl font-bold text-emerald-950">Devolución e inspección registradas</h2>
            <p className="mt-2 text-sm text-emerald-800">Se registraron {inspection.incidents.length} novedades. Las unidades con riesgo permanecen fuera de disponibilidad.</p>
            <Link className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline" href="/dashboard/returns">Volver a préstamos activos</Link>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-stone-700">Nombre de quien devuelve
              <input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" required value={returnedBy} onChange={(event) => setReturnedBy(event.target.value)} />
            </label>

            {pending.quantity_details.length > 0 ? <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">Cantidades a recibir</h2>
              <div className="mt-3 space-y-3">
                {pending.quantity_details.map((item) => <label className="grid gap-3 rounded-xl border border-stone-200 p-4 sm:grid-cols-[1fr_160px] sm:items-center" key={item.equipment_loan_detail_id}>
                  <span><span className="block font-semibold">{item.inventory_item_name}</span><span className="text-xs text-stone-500">Pendiente: {item.pending_quantity} {item.unit_of_measure} · prestado: {item.loaned_quantity}</span></span>
                  <span className="text-xs font-semibold text-stone-600">Cantidad devuelta
                    <input aria-label="Cantidad devuelta" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-right text-sm" max={item.pending_quantity} min="0" onChange={(event) => setQuantities((current) => ({ ...current, [item.equipment_loan_detail_id]: Number(event.target.value) }))} step="0.001" type="number" value={quantities[item.equipment_loan_detail_id] ?? 0} />
                  </span>
                </label>)}
              </div>
            </section> : null}

            {pending.pending_units.length > 0 ? <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">Unidades e inspección de retorno</h2>
              <div className="mt-3 space-y-4">
                {pending.pending_units.map((unit) => {
                  const state = units[unit.equipment_loan_unit_id];
                  if (!state) return null;
                  return <article className="rounded-xl border border-stone-200 p-4" key={unit.equipment_loan_unit_id}>
                    <label className="flex items-center gap-3 font-semibold"><input checked={state.selected} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { selected: event.target.checked })} type="checkbox" />{unit.asset_tag}{unit.serial_number ? ` · S/N ${unit.serial_number}` : ""}</label>
                    {state.selected ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-stone-600">Condición observada<select className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={state.condition} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { condition: event.target.value as InventoryUnitCondition })}><option value="NEW">Nuevo</option><option value="GOOD">Bueno</option><option value="FAIR">Regular</option><option value="DAMAGED">Dañado</option></select></label>
                      <label className="flex items-center gap-2 self-end rounded-lg bg-stone-50 px-3 py-2 text-sm"><input checked={state.isComplete} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { isComplete: event.target.checked })} type="checkbox" />Unidad completa</label>
                      <label className="text-xs font-semibold text-stone-600">Novedad<select className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" value={state.incidentType} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { incidentType: event.target.value as IncidentType | "" })}><option value="">Sin novedad</option>{INCIDENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                      <label className="text-xs font-semibold text-stone-600">Severidad<select className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" disabled={!state.incidentType} value={state.severity} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { severity: event.target.value as IncidentSeverity })}><option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label>
                      {state.incidentType ? <><label className="text-xs font-semibold text-stone-600 sm:col-span-2">Descripción<textarea className="mt-1 min-h-20 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" maxLength={2000} onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { description: event.target.value })} value={state.description} /></label><label className="text-xs font-semibold text-stone-600 sm:col-span-2">Evidencias opcionales · JPEG, PNG o WebP, máximo 10 MB<input accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" multiple onChange={(event) => updateUnit(unit.equipment_loan_unit_id, { files: Array.from(event.target.files ?? []) })} type="file" /></label></> : null}
                    </div> : null}
                  </article>;
                })}
              </div>
            </section> : null}

            <label className="block text-sm font-semibold text-stone-700">Notas de recepción e inspección<textarea className="mt-1 min-h-20 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" maxLength={2000} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
            <div className="flex justify-end border-t border-stone-100 pt-6"><button className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={submitting} type="submit">{submitting ? (registeredReturn ? "Inspeccionando…" : "Registrando devolución…") : registeredReturn ? "Reintentar inspección" : "Registrar devolución e inspección"}</button></div>
          </form>
        )}
      </section>
      <ConfirmModal
        confirmLabel="Registrar devolución"
        description="Las cantidades volverán al stock y las unidades quedarán fuera de disponibilidad hasta completar su inspección. Esta operación no se puede deshacer desde la interfaz."
        isOpen={confirmationOpen}
        isSubmitting={submitting}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={() => void handleSubmit()}
        title="Confirmar recepción de recursos"
        tone="warning"
      />
    </main>
  );
}
