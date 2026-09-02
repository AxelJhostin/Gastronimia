"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  createInventoryCategory,
  createInventoryItem,
  createInventoryLocation,
  createInventoryMovement,
  createInventoryUnit,
  getInventoryCategories,
  getInventoryItems,
  getInventoryLocations,
  getInventoryMovements,
  getInventoryUnits,
  updateInventoryCategory,
  updateInventoryItem,
  updateInventoryLocation,
  updateInventoryUnit,
  type InventoryCategory,
  type InventoryItem,
  type InventoryLocation,
  type InventoryMovement,
  type InventoryUnit,
  type InventoryUnitCondition,
} from "@/lib/api/client";

type InventoryEditTarget =
  | { kind: "category"; record: InventoryCategory }
  | { kind: "location"; record: InventoryLocation }
  | { kind: "item"; record: InventoryItem }
  | { kind: "unit"; record: InventoryUnit };

export default function InventoryManagementPage() {
  const identity = useDashboardIdentity();
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [trackingMode, setTrackingMode] = useState<"QUANTITY" | "INDIVIDUAL">("QUANTITY");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryEditTarget | null>(null);
  const [statusTarget, setStatusTarget] = useState<InventoryEditTarget | null>(null);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const token = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!hasAccess || !token) return;
    void Promise.all([
      getInventoryCategories(token),
      getInventoryLocations(token),
      getInventoryItems(token),
      getInventoryUnits(token),
      getInventoryMovements(token),
    ])
      .then(([nextCategories, nextLocations, nextItems, nextUnits, nextMovements]) => {
        setCategories(nextCategories);
        setLocations(nextLocations);
        setItems(nextItems);
        setUnits(nextUnits);
        setMovements(nextMovements);
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar la administración de inventario.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, token]);

  const runCreate = async (resource: string, action: () => Promise<void>) => {
    setSaving(resource);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess("Operación de inventario registrada correctamente.");
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible completar la operación de inventario.",
      );
    } finally {
      setSaving(null);
    }
  };

  const saveStatus = async () => {
    if (!token || !statusTarget) return;
    const target = statusTarget;
    const nextStatus = !target.record.is_active;
    setSaving(`status:${target.record.id}`);
    setError(null);
    setSuccess(null);
    try {
      switch (target.kind) {
        case "category": {
          const record = target.record;
          const updated = await updateInventoryCategory(token, record.id, {
            name: record.name,
            description: record.description ?? undefined,
            is_active: nextStatus,
          });
          setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "location": {
          const record = target.record;
          const updated = await updateInventoryLocation(token, record.id, {
            code: record.code ?? undefined,
            name: record.name,
            description: record.description ?? undefined,
            is_active: nextStatus,
          });
          setLocations((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "item": {
          const record = target.record;
          const updated = await updateInventoryItem(token, record.id, {
            category_id: record.category_id,
            code: record.code ?? undefined,
            name: record.name,
            description: record.description ?? undefined,
            tracking_mode: record.tracking_mode,
            unit_of_measure: record.unit_of_measure,
            is_active: nextStatus,
          });
          setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "unit": {
          const record = target.record;
          const updated = await updateInventoryUnit(token, record.id, {
            inventory_item_id: record.inventory_item_id,
            location_id: record.location_id ?? undefined,
            asset_tag: record.asset_tag,
            serial_number: record.serial_number ?? undefined,
            status: record.status,
            condition: record.condition,
            notes: record.notes ?? undefined,
            is_active: nextStatus,
          });
          setUnits((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
      }
      setSuccess(`Registro ${nextStatus ? "activado" : "desactivado"} correctamente.`);
      setStatusTarget(null);
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : "No fue posible cambiar el estado del registro.");
    } finally {
      setSaving(null);
    }
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editTarget) return;
    const target = editTarget;
    const form = new FormData(event.currentTarget);
    setSaving(`edit:${target.record.id}`);
    setError(null);
    setSuccess(null);
    try {
      switch (target.kind) {
        case "category": {
          const updated = await updateInventoryCategory(token, target.record.id, {
            name: String(form.get("name")),
            description: String(form.get("description")) || undefined,
            is_active: target.record.is_active,
          });
          setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "location": {
          const updated = await updateInventoryLocation(token, target.record.id, {
            code: String(form.get("code")) || undefined,
            name: String(form.get("name")),
            description: String(form.get("description")) || undefined,
            is_active: target.record.is_active,
          });
          setLocations((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "item": {
          const updated = await updateInventoryItem(token, target.record.id, {
            category_id: String(form.get("category_id")),
            code: String(form.get("code")) || undefined,
            name: String(form.get("name")),
            description: String(form.get("description")) || undefined,
            tracking_mode: String(form.get("tracking_mode")) as InventoryItem["tracking_mode"],
            unit_of_measure: String(form.get("unit_of_measure")),
            is_active: target.record.is_active,
          });
          setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
        case "unit": {
          const updated = await updateInventoryUnit(token, target.record.id, {
            inventory_item_id: String(form.get("inventory_item_id")),
            location_id: String(form.get("location_id")) || undefined,
            asset_tag: String(form.get("asset_tag")),
            serial_number: String(form.get("serial_number")) || undefined,
            status: String(form.get("status")) as InventoryUnit["status"],
            condition: String(form.get("condition")) as InventoryUnitCondition,
            notes: String(form.get("notes")) || undefined,
            is_active: target.record.is_active,
          });
          setUnits((current) => current.map((item) => item.id === updated.id ? updated : item));
          break;
        }
      }
      setSuccess("Registro de inventario actualizado correctamente.");
      setEditTarget(null);
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : "No fue posible actualizar el registro de inventario.");
    } finally {
      setSaving(null);
    }
  };

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando inventario…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  const individualItems = items.filter((item) => item.tracking_mode === "INDIVIDUAL" && item.is_active);
  const quantityItems = items.filter((item) => item.tracking_mode === "QUANTITY" && item.is_active);
  const activeCategories = categories.filter((category) => category.is_active);
  const activeLocations = locations.filter((location) => location.is_active);
  const itemById = Object.fromEntries(items.map((item) => [item.id, item]));

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-7xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Catálogo y existencias</p><h1 className="mt-1 text-3xl font-bold">Gestionar inventario</h1><p className="mt-1 text-sm text-stone-600">Configura relaciones mediante listas y registra stock de forma trazable.</p></div><Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard/inventory">Volver al inventario</Link></div>
        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        {success ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{success}</div> : null}
        {loading ? <p className="mt-6 text-sm text-stone-500">Cargando configuración…</p> : <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ManageCard title="Categorías" count={categories.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("category", async () => { const created = await createInventoryCategory(token!, { name: String(form.get("name")), description: String(form.get("description")) || undefined, is_active: true }); setCategories((current) => [...current, created]); formElement.reset(); }); }}><Field label="Nombre" name="name" required /><Field label="Descripción" name="description" /><Submit disabled={saving === "category"} label="Crear categoría" /></form>
            <ManagedList items={categories.map((category) => ({ id: category.id, label: category.name, isActive: category.is_active, onEdit: () => setEditTarget({ kind: "category", record: category }), onToggle: () => setStatusTarget({ kind: "category", record: category }) }))} />
          </ManageCard>

          <ManageCard title="Ubicaciones" count={locations.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("location", async () => { const created = await createInventoryLocation(token!, { code: String(form.get("code")) || undefined, name: String(form.get("name")), description: String(form.get("description")) || undefined, is_active: true }); setLocations((current) => [...current, created]); formElement.reset(); }); }}><Field label="Código" name="code" /><Field label="Nombre" name="name" required /><Field label="Descripción" name="description" /><Submit disabled={saving === "location"} label="Crear ubicación" /></form>
            <ManagedList items={locations.map((location) => ({ id: location.id, label: `${location.code ?? "Sin código"} · ${location.name}`, isActive: location.is_active, onEdit: () => setEditTarget({ kind: "location", record: location }), onToggle: () => setStatusTarget({ kind: "location", record: location }) }))} />
          </ManageCard>

          <ManageCard title="Artículos" count={items.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("item", async () => { const created = await createInventoryItem(token!, { category_id: String(form.get("category_id")), code: String(form.get("code")) || undefined, name: String(form.get("name")), description: String(form.get("description")) || undefined, tracking_mode: trackingMode, unit_of_measure: String(form.get("unit_of_measure")), is_active: true }); setItems((current) => [...current, created]); formElement.reset(); setTrackingMode("QUANTITY"); }); }}>
              <Select label="Categoría" name="category_id" options={activeCategories.map((category) => ({ value: category.id, label: category.name }))} /><Field label="Código" name="code" /><Field label="Nombre" name="name" required /><Field label="Descripción" name="description" /><label className="text-xs font-semibold text-stone-600">Control<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name="tracking_mode" onChange={(event) => setTrackingMode(event.target.value as typeof trackingMode)} value={trackingMode}><option value="QUANTITY">Por cantidad</option><option value="INDIVIDUAL">Por unidad identificada</option></select></label><Field label="Unidad de medida" name="unit_of_measure" required /><Submit disabled={saving === "item" || !activeCategories.length} label="Crear artículo" />
            </form>
            <ManagedList items={items.map((item) => ({ id: item.id, label: `${item.name} · ${item.tracking_mode === "QUANTITY" ? "cantidad" : "individual"}`, isActive: item.is_active, onEdit: () => setEditTarget({ kind: "item", record: item }), onToggle: () => setStatusTarget({ kind: "item", record: item }) }))} />
          </ManageCard>

          <ManageCard title="Unidades individuales" count={units.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("unit", async () => { const created = await createInventoryUnit(token!, { inventory_item_id: String(form.get("inventory_item_id")), location_id: String(form.get("location_id")) || undefined, asset_tag: String(form.get("asset_tag")), serial_number: String(form.get("serial_number")) || undefined, status: "AVAILABLE", condition: String(form.get("condition")) as "NEW" | "GOOD" | "FAIR", notes: String(form.get("notes")) || undefined, is_active: true }); setUnits((current) => [...current, created]); formElement.reset(); }); }}>
              <Select label="Artículo individual" name="inventory_item_id" options={individualItems.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Ubicación" name="location_id" options={activeLocations.map((location) => ({ value: location.id, label: location.name }))} optional /><Field label="Etiqueta patrimonial" name="asset_tag" required /><Field label="Serie" name="serial_number" /><Select label="Condición inicial" name="condition" options={[{ value: "NEW", label: "Nuevo" }, { value: "GOOD", label: "Bueno" }, { value: "FAIR", label: "Regular" }]} /><Field label="Notas" name="notes" /><Submit disabled={saving === "unit" || !individualItems.length} label="Crear unidad" />
            </form>
            <ManagedList items={units.map((unit) => ({ id: unit.id, label: `${unit.asset_tag} · ${itemById[unit.inventory_item_id]?.name ?? "Artículo"} · ${unit.status}`, isActive: unit.is_active, onEdit: () => setEditTarget({ kind: "unit", record: unit }), onToggle: () => setStatusTarget({ kind: "unit", record: unit }) }))} />
          </ManageCard>

          <div className="xl:col-span-2"><ManageCard title="Entradas y ajustes de stock" count={movements.length}>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("movement", async () => { const created = await createInventoryMovement(token!, { inventory_item_id: String(form.get("inventory_item_id")), location_id: String(form.get("location_id")), movement_type: String(form.get("movement_type")) as InventoryMovement["movement_type"], quantity: Number(form.get("quantity")), notes: String(form.get("notes")) || undefined }); setMovements((current) => [created, ...current]); formElement.reset(); }); }}>
              <Select label="Artículo por cantidad" name="inventory_item_id" options={quantityItems.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Ubicación" name="location_id" options={activeLocations.map((location) => ({ value: location.id, label: location.name }))} /><Select label="Movimiento" name="movement_type" options={[{ value: "INITIAL_STOCK", label: "Stock inicial" }, { value: "ADJUSTMENT_IN", label: "Ajuste de entrada" }, { value: "ADJUSTMENT_OUT", label: "Ajuste de salida" }]} /><Field label="Cantidad" name="quantity" required type="number" /><Field label="Notas" name="notes" /><Submit disabled={saving === "movement" || !quantityItems.length || !activeLocations.length} label="Registrar movimiento" />
            </form>
            <SmallList values={movements.slice(0, 12).map((movement) => `${itemById[movement.inventory_item_id]?.name ?? "Artículo"} · ${movement.movement_type} ${movement.quantity} · saldo ${movement.balance_after}`)} />
          </ManageCard></div>
        </div>}
        {editTarget ? <InventoryEditModal categories={categories} isSaving={saving === `edit:${editTarget.record.id}`} items={items} locations={locations} onClose={() => setEditTarget(null)} onSubmit={saveEdit} target={editTarget} /> : null}
        <ConfirmModal confirmLabel={statusTarget?.record.is_active ? "Desactivar" : "Activar"} description={statusTarget?.record.is_active ? "El registro dejará de estar disponible para nuevas operaciones, pero su historial se conservará." : "El registro volverá a estar disponible para nuevas operaciones."} isOpen={statusTarget !== null} isSubmitting={saving === `status:${statusTarget?.record.id}`} onClose={() => setStatusTarget(null)} onConfirm={() => void saveStatus()} title={statusTarget?.record.is_active ? "Confirmar desactivación" : "Confirmar activación"} tone={statusTarget?.record.is_active ? "danger" : "positive"} />
      </section>
    </main>
  );
}

function ManageCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="rounded-2xl border border-stone-200 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold">{count}</span></div><div className="mt-4">{children}</div></section>; }
function ManagedList({ items }: { items: Array<{ id: string; label: string; isActive: boolean; onEdit: () => void; onToggle: () => void }> }) { return <ul className="mt-5 max-h-44 divide-y overflow-y-auto rounded-xl bg-stone-50 px-3">{items.map((item) => <li className="flex items-center justify-between gap-3 py-2 text-xs" key={item.id}><span className={item.isActive ? "" : "text-stone-400 line-through"}>{item.label}</span><span className="flex shrink-0 gap-2"><button className="font-semibold text-amber-800 underline" onClick={item.onEdit} type="button">Editar</button><button className={`font-semibold underline ${item.isActive ? "text-red-700" : "text-emerald-700"}`} onClick={item.onToggle} type="button">{item.isActive ? "Desactivar" : "Activar"}</button></span></li>)}{!items.length ? <li className="py-3 text-xs text-stone-500">Sin registros.</li> : null}</ul>; }
function SmallList({ values }: { values: string[] }) { return <ul className="mt-5 max-h-36 divide-y overflow-y-auto rounded-xl bg-stone-50 px-3">{values.map((value, index) => <li className="py-2 text-xs" key={`${value}-${index}`}>{value}</li>)}{!values.length ? <li className="py-3 text-xs text-stone-500">Sin registros.</li> : null}</ul>; }
function Field({ label, name, required = false, type = "text", defaultValue }: { label: string; name: string; required?: boolean; type?: string; defaultValue?: string }) { return <label className="text-xs font-semibold text-stone-600">{label}<input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" defaultValue={defaultValue} min={type === "number" ? "0.001" : undefined} name={name} required={required} step={type === "number" ? "0.001" : undefined} type={type} /></label>; }
function Select({ label, name, options, optional = false, defaultValue }: { label: string; name: string; options: Array<{ value: string; label: string }>; optional?: boolean; defaultValue?: string }) { return <label className="text-xs font-semibold text-stone-600">{label}<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" defaultValue={defaultValue} name={name} required={!optional}><option value="">{optional ? "Sin ubicación" : "Seleccionar…"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Submit({ label, disabled }: { label: string; disabled: boolean }) { return <button className="self-end rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={disabled} type="submit">{disabled ? "Guardando…" : label}</button>; }

function InventoryEditModal({ target, categories, locations, items, isSaving, onClose, onSubmit }: { target: InventoryEditTarget; categories: InventoryCategory[]; locations: InventoryLocation[]; items: InventoryItem[]; isSaving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
      <section aria-labelledby="inventory-edit-title" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" role="dialog">
        <h2 className="text-xl font-bold" id="inventory-edit-title">Editar registro de inventario</h2>
        <form className="mt-5 grid max-h-[75vh] gap-4 overflow-y-auto sm:grid-cols-2" key={`${target.kind}:${target.record.id}`} onSubmit={onSubmit}>
          {target.kind === "category" ? <><Field defaultValue={target.record.name} label="Nombre" name="name" required /><Field defaultValue={target.record.description ?? ""} label="Descripción" name="description" /></> : null}
          {target.kind === "location" ? <><Field defaultValue={target.record.code ?? ""} label="Código" name="code" /><Field defaultValue={target.record.name} label="Nombre" name="name" required /><Field defaultValue={target.record.description ?? ""} label="Descripción" name="description" /></> : null}
          {target.kind === "item" ? <><Select defaultValue={target.record.category_id} label="Categoría" name="category_id" options={categories.map((category) => ({ value: category.id, label: category.name }))} /><Field defaultValue={target.record.code ?? ""} label="Código" name="code" /><Field defaultValue={target.record.name} label="Nombre" name="name" required /><Field defaultValue={target.record.description ?? ""} label="Descripción" name="description" /><Select defaultValue={target.record.tracking_mode} label="Control" name="tracking_mode" options={[{ value: "QUANTITY", label: "Por cantidad" }, { value: "INDIVIDUAL", label: "Por unidad identificada" }]} /><Field defaultValue={target.record.unit_of_measure} label="Unidad de medida" name="unit_of_measure" required /></> : null}
          {target.kind === "unit" ? <><Select defaultValue={target.record.inventory_item_id} label="Artículo individual" name="inventory_item_id" options={items.filter((item) => item.tracking_mode === "INDIVIDUAL").map((item) => ({ value: item.id, label: item.name }))} /><Select defaultValue={target.record.location_id ?? ""} label="Ubicación" name="location_id" optional options={locations.map((location) => ({ value: location.id, label: location.name }))} /><Field defaultValue={target.record.asset_tag} label="Etiqueta patrimonial" name="asset_tag" required /><Field defaultValue={target.record.serial_number ?? ""} label="Serie" name="serial_number" /><Select defaultValue={target.record.status} label="Estado" name="status" options={[{ value: "AVAILABLE", label: "Disponible" }, { value: "LOANED", label: "Prestado" }, { value: "MAINTENANCE", label: "Mantenimiento" }, { value: "DISABLED", label: "Fuera de servicio" }]} /><Select defaultValue={target.record.condition} label="Condición" name="condition" options={[{ value: "NEW", label: "Nuevo" }, { value: "GOOD", label: "Bueno" }, { value: "FAIR", label: "Regular" }, { value: "DAMAGED", label: "Dañado" }]} /><Field defaultValue={target.record.notes ?? ""} label="Notas" name="notes" /></> : null}
          <div className="flex justify-end gap-3 sm:col-span-2"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600" disabled={isSaving} onClick={onClose} type="button">Cancelar</button><button className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={isSaving} type="submit">{isSaving ? "Guardando…" : "Guardar cambios"}</button></div>
        </form>
      </section>
    </div>
  );
}
