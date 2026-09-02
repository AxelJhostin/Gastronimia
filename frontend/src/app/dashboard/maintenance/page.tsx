"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  closeEquipmentMaintenance,
  getEquipmentMaintenances,
  getInventoryItems,
  getInventoryUnits,
  registerMaintenanceEvidence,
  startEquipmentMaintenance,
  type EquipmentMaintenance,
  type InventoryItem,
  type InventoryUnit,
  type InventoryUnitCondition,
} from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export default function MaintenancePage() {
  const identity = useDashboardIdentity();
  const [maintenances, setMaintenances] = useState<EquipmentMaintenance[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [finalStatus, setFinalStatus] = useState<"AVAILABLE" | "MAINTENANCE" | "DISABLED">("AVAILABLE");
  const [finalCondition, setFinalCondition] = useState<InventoryUnitCondition>("GOOD");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const token = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!hasAccess || !token) return;
    void Promise.all([
      getEquipmentMaintenances(token),
      getInventoryUnits(token),
      getInventoryItems(token),
    ])
      .then(([nextMaintenances, nextUnits, nextItems]) => {
        setMaintenances(nextMaintenances);
        setUnits(nextUnits);
        setItems(nextItems);
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error ? loadError.message : "No fue posible cargar mantenimiento.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, token]);

  const handleStart = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || identity.status !== "authenticated") return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("evidence");
    if (
      file instanceof File &&
      file.size > 0 &&
      (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) ||
        file.size > 10 * 1024 * 1024)
    ) {
      setError("La evidencia debe ser JPEG, PNG o WebP de máximo 10 MB.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await startEquipmentMaintenance(token, {
        inventory_unit_id: String(form.get("inventory_unit_id")),
        maintenance_type: String(form.get("maintenance_type")) as EquipmentMaintenance["maintenance_type"],
        reason: String(form.get("reason")),
        description: String(form.get("description")) || undefined,
      });
      setMaintenances((current) => [created, ...current]);
      setUnits((current) =>
        current.map((unit) =>
          unit.id === created.inventory_unit_id ? { ...unit, status: "MAINTENANCE" } : unit,
        ),
      );

      if (file instanceof File && file.size > 0) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${identity.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await createClient().storage
          .from("evidence")
          .upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        await registerMaintenanceEvidence(token, created.id, storagePath);
      }
      formElement.reset();
      setSuccess("Mantenimiento iniciado; la unidad quedó fuera de disponibilidad.");
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible iniciar el mantenimiento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (action: "complete" | "cancel") => {
    if (!token || !selectedMaintenanceId) return;
    if (finalStatus === "AVAILABLE" && finalCondition === "DAMAGED") {
      setError("Una unidad dañada no puede volver a estar disponible.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await closeEquipmentMaintenance(token, selectedMaintenanceId, action, {
        resolution: resolution.trim() || undefined,
        final_status: finalStatus,
        final_condition: finalCondition,
      });
      setMaintenances((current) =>
        current.map((maintenance) =>
          maintenance.id === updated.id ? updated : maintenance,
        ),
      );
      setUnits((current) =>
        current.map((unit) =>
          unit.id === updated.inventory_unit_id
            ? { ...unit, status: finalStatus, condition: finalCondition }
            : unit,
        ),
      );
      setSelectedMaintenanceId(null);
      setResolution("");
      setSuccess(action === "complete" ? "Mantenimiento completado." : "Mantenimiento cancelado.");
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error ? actionError.message : "No fue posible cerrar mantenimiento.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando mantenimiento…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
  const unitById = Object.fromEntries(units.map((unit) => [unit.id, unit]));
  const eligibleUnits = units.filter((unit) => unit.is_active && unit.status !== "LOANED" && !maintenances.some((maintenance) => maintenance.inventory_unit_id === unit.id && maintenance.status === "OPEN"));

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900"><section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Cuidado de equipos</p><h1 className="mt-1 text-3xl font-bold">Mantenimiento</h1><p className="mt-1 text-sm text-stone-600">Abre, documenta y cierra intervenciones sobre unidades individuales.</p></div><Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard">Volver al panel</Link></div>
      {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}{success ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{success}</div> : null}
      {loading ? <p className="mt-6 text-sm text-stone-500">Cargando intervenciones…</p> : <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section><h2 className="text-lg font-bold">Iniciar mantenimiento</h2><form className="mt-4 space-y-3 rounded-xl bg-stone-50 p-4" onSubmit={handleStart}><Select label="Unidad" name="inventory_unit_id" options={eligibleUnits.map((unit) => ({ value: unit.id, label: `${unit.asset_tag} · ${itemById[unit.inventory_item_id]?.name ?? "Equipo"}` }))} /><Select label="Tipo" name="maintenance_type" options={[{ value: "PREVENTIVE", label: "Preventivo" }, { value: "CORRECTIVE", label: "Correctivo" }, { value: "INSPECTION", label: "Inspección" }]} /><Field label="Motivo" name="reason" required /><Field label="Descripción" name="description" /><label className="block text-xs font-semibold text-stone-600">Evidencia opcional<input accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" name="evidence" type="file" /></label><button className="w-full rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={saving || !eligibleUnits.length} type="submit">{saving ? "Guardando…" : "Iniciar mantenimiento"}</button></form></section>
        <section><h2 className="text-lg font-bold">Historial de intervenciones</h2><div className="mt-4 space-y-3">{maintenances.map((maintenance) => { const unit = unitById[maintenance.inventory_unit_id]; return <article className="rounded-xl border border-stone-200 p-4" key={maintenance.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{unit?.asset_tag ?? "Unidad"} · {maintenance.maintenance_type}</p><p className="text-xs text-stone-500">{maintenance.reason} · {new Date(maintenance.started_at).toLocaleString("es-EC")}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${maintenance.status === "OPEN" ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{maintenance.status}</span></div>{maintenance.status === "OPEN" ? selectedMaintenanceId === maintenance.id ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><FieldControlled label="Resolución" value={resolution} onChange={setResolution} /><SelectControlled label="Estado final" value={finalStatus} onChange={(value) => setFinalStatus(value as typeof finalStatus)} options={[{ value: "AVAILABLE", label: "Disponible" }, { value: "MAINTENANCE", label: "Sigue en mantenimiento" }, { value: "DISABLED", label: "Dada de baja" }]} /><SelectControlled label="Condición final" value={finalCondition} onChange={(value) => setFinalCondition(value as InventoryUnitCondition)} options={[{ value: "NEW", label: "Nuevo" }, { value: "GOOD", label: "Bueno" }, { value: "FAIR", label: "Regular" }, { value: "DAMAGED", label: "Dañado" }]} /><div className="flex items-end gap-2"><button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => void handleClose("complete")} type="button">Completar</button><button className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold" onClick={() => void handleClose("cancel")} type="button">Cancelar intervención</button></div></div> : <button className="mt-3 text-xs font-semibold text-amber-800 underline" onClick={() => setSelectedMaintenanceId(maintenance.id)} type="button">Cerrar intervención</button> : maintenance.resolution ? <p className="mt-3 text-sm text-stone-600">{maintenance.resolution}</p> : null}</article>; })}{!maintenances.length ? <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">No hay mantenimientos registrados.</p> : null}</div></section>
      </div>}
    </section></main>
  );
}

function Field({ label, name, required = false }: { label: string; name: string; required?: boolean }) { return <label className="block text-xs font-semibold text-stone-600">{label}<textarea className="mt-1 min-h-16 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name={name} required={required} /></label>; }
function Select({ label, name, options }: { label: string; name: string; options: Array<{ value: string; label: string }> }) { return <label className="block text-xs font-semibold text-stone-600">{label}<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name={name} required><option value="">Seleccionar…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function FieldControlled({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-semibold text-stone-600">{label}<textarea className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
function SelectControlled({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <label className="text-xs font-semibold text-stone-600">{label}<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
