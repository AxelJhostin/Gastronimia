"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
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
  type InventoryCategory,
  type InventoryItem,
  type InventoryLocation,
  type InventoryMovement,
  type InventoryUnit,
} from "@/lib/api/client";

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

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando inventario…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  const individualItems = items.filter((item) => item.tracking_mode === "INDIVIDUAL" && item.is_active);
  const quantityItems = items.filter((item) => item.tracking_mode === "QUANTITY" && item.is_active);
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
            <SmallList values={categories.map((category) => category.name)} />
          </ManageCard>

          <ManageCard title="Ubicaciones" count={locations.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("location", async () => { const created = await createInventoryLocation(token!, { code: String(form.get("code")) || undefined, name: String(form.get("name")), description: String(form.get("description")) || undefined, is_active: true }); setLocations((current) => [...current, created]); formElement.reset(); }); }}><Field label="Código" name="code" /><Field label="Nombre" name="name" required /><Field label="Descripción" name="description" /><Submit disabled={saving === "location"} label="Crear ubicación" /></form>
            <SmallList values={locations.map((location) => `${location.code ?? "Sin código"} · ${location.name}`)} />
          </ManageCard>

          <ManageCard title="Artículos" count={items.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("item", async () => { const created = await createInventoryItem(token!, { category_id: String(form.get("category_id")), code: String(form.get("code")) || undefined, name: String(form.get("name")), description: String(form.get("description")) || undefined, tracking_mode: trackingMode, unit_of_measure: String(form.get("unit_of_measure")), is_active: true }); setItems((current) => [...current, created]); formElement.reset(); setTrackingMode("QUANTITY"); }); }}>
              <Select label="Categoría" name="category_id" options={categories.map((category) => ({ value: category.id, label: category.name }))} /><Field label="Código" name="code" /><Field label="Nombre" name="name" required /><Field label="Descripción" name="description" /><label className="text-xs font-semibold text-stone-600">Control<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name="tracking_mode" onChange={(event) => setTrackingMode(event.target.value as typeof trackingMode)} value={trackingMode}><option value="QUANTITY">Por cantidad</option><option value="INDIVIDUAL">Por unidad identificada</option></select></label><Field label="Unidad de medida" name="unit_of_measure" required /><Submit disabled={saving === "item" || !categories.length} label="Crear artículo" />
            </form>
            <SmallList values={items.map((item) => `${item.name} · ${item.tracking_mode === "QUANTITY" ? "cantidad" : "individual"}`)} />
          </ManageCard>

          <ManageCard title="Unidades individuales" count={units.length}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("unit", async () => { const created = await createInventoryUnit(token!, { inventory_item_id: String(form.get("inventory_item_id")), location_id: String(form.get("location_id")) || undefined, asset_tag: String(form.get("asset_tag")), serial_number: String(form.get("serial_number")) || undefined, status: "AVAILABLE", condition: String(form.get("condition")) as "NEW" | "GOOD" | "FAIR", notes: String(form.get("notes")) || undefined, is_active: true }); setUnits((current) => [...current, created]); formElement.reset(); }); }}>
              <Select label="Artículo individual" name="inventory_item_id" options={individualItems.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Ubicación" name="location_id" options={locations.map((location) => ({ value: location.id, label: location.name }))} optional /><Field label="Etiqueta patrimonial" name="asset_tag" required /><Field label="Serie" name="serial_number" /><Select label="Condición inicial" name="condition" options={[{ value: "NEW", label: "Nuevo" }, { value: "GOOD", label: "Bueno" }, { value: "FAIR", label: "Regular" }]} /><Field label="Notas" name="notes" /><Submit disabled={saving === "unit" || !individualItems.length} label="Crear unidad" />
            </form>
            <SmallList values={units.map((unit) => `${unit.asset_tag} · ${itemById[unit.inventory_item_id]?.name ?? "Artículo"} · ${unit.status}`)} />
          </ManageCard>

          <div className="xl:col-span-2"><ManageCard title="Entradas y ajustes de stock" count={movements.length}>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("movement", async () => { const created = await createInventoryMovement(token!, { inventory_item_id: String(form.get("inventory_item_id")), location_id: String(form.get("location_id")), movement_type: String(form.get("movement_type")) as InventoryMovement["movement_type"], quantity: Number(form.get("quantity")), notes: String(form.get("notes")) || undefined }); setMovements((current) => [created, ...current]); formElement.reset(); }); }}>
              <Select label="Artículo por cantidad" name="inventory_item_id" options={quantityItems.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Ubicación" name="location_id" options={locations.map((location) => ({ value: location.id, label: location.name }))} /><Select label="Movimiento" name="movement_type" options={[{ value: "INITIAL_STOCK", label: "Stock inicial" }, { value: "ADJUSTMENT_IN", label: "Ajuste de entrada" }, { value: "ADJUSTMENT_OUT", label: "Ajuste de salida" }]} /><Field label="Cantidad" name="quantity" required type="number" /><Field label="Notas" name="notes" /><Submit disabled={saving === "movement" || !quantityItems.length || !locations.length} label="Registrar movimiento" />
            </form>
            <SmallList values={movements.slice(0, 12).map((movement) => `${itemById[movement.inventory_item_id]?.name ?? "Artículo"} · ${movement.movement_type} ${movement.quantity} · saldo ${movement.balance_after}`)} />
          </ManageCard></div>
        </div>}
      </section>
    </main>
  );
}

function ManageCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="rounded-2xl border border-stone-200 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold">{count}</span></div><div className="mt-4">{children}</div></section>; }
function SmallList({ values }: { values: string[] }) { return <ul className="mt-5 max-h-36 divide-y overflow-y-auto rounded-xl bg-stone-50 px-3">{values.map((value, index) => <li className="py-2 text-xs" key={`${value}-${index}`}>{value}</li>)}{!values.length ? <li className="py-3 text-xs text-stone-500">Sin registros.</li> : null}</ul>; }
function Field({ label, name, required = false, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) { return <label className="text-xs font-semibold text-stone-600">{label}<input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" min={type === "number" ? "0.001" : undefined} name={name} required={required} step={type === "number" ? "0.001" : undefined} type={type} /></label>; }
function Select({ label, name, options, optional = false }: { label: string; name: string; options: Array<{ value: string; label: string }>; optional?: boolean }) { return <label className="text-xs font-semibold text-stone-600">{label}<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name={name} required={!optional}><option value="">{optional ? "Sin ubicación" : "Seleccionar…"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Submit({ label, disabled }: { label: string; disabled: boolean }) { return <button className="self-end rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={disabled} type="submit">{disabled ? "Guardando…" : label}</button>; }
