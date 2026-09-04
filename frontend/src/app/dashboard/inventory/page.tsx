"use client";

import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { InventoryItemCard, InventoryToolbar, type InventoryUnitState } from "@/components/domain/inventory";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { EmptyState, ErrorState, FilterSelect, LoadingState, PageHeader } from "@/components/ui";
import {
  getInventoryCategories,
  getInventoryItems,
  getInventoryStock,
  getInventoryUnits,
  type InventoryCategory,
  type InventoryItem,
  type InventoryStock,
  type InventoryUnit,
} from "@/lib/api/client";

const demoImages: Record<string, string> = {
  "BAT-004": "/demo/inventory/batidora-planetaria.webp",
  "BOWL-002": "/demo/inventory/menaje-pasteleria.webp",
  "CUCH-001": "/demo/inventory/cuchilleria.webp",
  "MANGA-003": "/demo/inventory/menaje-pasteleria.webp",
};

export default function InventoryPage() {
  const identity = useDashboardIdentity();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess = identity.status === "authenticated" && identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");
  const accessToken = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!hasAccess || !accessToken) return;
    const token = accessToken;
    let active = true;
    void Promise.all([getInventoryItems(token), getInventoryStock(token), getInventoryUnits(token), getInventoryCategories(token)])
      .then(([nextItems, nextStock, nextUnits, nextCategories]) => {
        if (!active) return;
        setItems(nextItems);
        setStock(nextStock);
        setUnits(nextUnits);
        setCategories(nextCategories);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el inventario.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, hasAccess]);

  const quantityByItem = useMemo(() => stock.reduce<Record<string, number>>((total, row) => {
    total[row.inventory_item_id] = (total[row.inventory_item_id] ?? 0) + Number(row.quantity);
    return total;
  }, {}), [stock]);
  const categoryById = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item.name])), [categories]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category_id === category;
      const matchesQuery = !normalizedQuery || `${item.name} ${item.code ?? ""}`.toLocaleLowerCase("es").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  if (identity.status === "loading") return <LoadingState label="Cargando inventario…" />;
  if (identity.status === "unavailable") return <ErrorState description={identity.message} title="No pudimos cargar tu sesión" />;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  return <div className="space-y-7">
    <PageHeader
      actions={<Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gastro-action px-4 text-sm font-semibold text-white hover:bg-gastro-action-hover" href="/dashboard/inventory/manage"><PackagePlus className="size-4" /> Gestionar inventario</Link>}
      description="Consulta existencias, condición y trazabilidad de los recursos disponibles para prácticas."
      eyebrow="Control de bodega"
      title="Inventario"
    />
    <InventoryToolbar onSearchChange={setQuery} searchValue={query}>
      <FilterSelect aria-label="Filtrar por categoría" onChange={(event) => setCategory(event.target.value)} value={category}>
        <option value="all">Todas las categorías</option>
        {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
    </InventoryToolbar>
    {loading ? <LoadingState label="Consultando equipos y utensilios…" /> : null}
    {error ? <ErrorState description={error} title="No pudimos cargar el inventario" /> : null}
    {!loading && !error && !filteredItems.length ? <EmptyState description={query || category !== "all" ? "Prueba otra búsqueda o elimina el filtro seleccionado." : "Agrega el primer recurso desde Gestión de inventario."} title={query || category !== "all" ? "No encontramos coincidencias" : "No hay recursos registrados"} /> : null}
    {!loading && !error && filteredItems.length ? <section aria-label="Recursos de inventario" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filteredItems.map((item) => {
      const itemUnits = units.filter((unit) => unit.inventory_item_id === item.id && unit.is_active);
      const status = getItemStatus(item, itemUnits, quantityByItem[item.id] ?? 0);
      const quantityLabel = item.tracking_mode === "QUANTITY" ? `${quantityByItem[item.id] ?? 0} ${item.unit_of_measure}` : `${itemUnits.length} ${itemUnits.length === 1 ? "unidad" : "unidades"}`;
      return <Link aria-label={`Ver ficha de ${item.name}`} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gastro-action focus-visible:ring-offset-2" href={`/dashboard/inventory/${item.id}`} key={item.id}>
        <InventoryItemCard assetCode={item.code ?? "Sin código"} category={categoryById[item.category_id] ?? "Sin categoría"} condition={getCondition(item, itemUnits)} imageAlt={`${item.name} en el laboratorio de Gastronomía`} imageUrl={item.code ? demoImages[item.code] : undefined} name={item.name} quantityLabel={quantityLabel} status={status} trackingLabel={item.tracking_mode === "QUANTITY" ? "Por cantidad" : "Individual"} />
      </Link>;
    })}</section> : null}
  </div>;
}

function getItemStatus(item: InventoryItem, units: InventoryUnit[], quantity: number): InventoryUnitState {
  if (!item.is_active) return "MAINTENANCE";
  if (item.tracking_mode === "QUANTITY") return quantity > 0 ? "AVAILABLE" : "RESERVED";
  if (units.some((unit) => unit.status === "AVAILABLE")) return "AVAILABLE";
  if (units.some((unit) => unit.status === "MAINTENANCE" || unit.status === "DISABLED")) return "MAINTENANCE";
  return "RESERVED";
}

function getCondition(item: InventoryItem, units: InventoryUnit[]) {
  if (item.tracking_mode === "QUANTITY") return item.is_active ? "Disponible" : "Inactivo";
  const worst = units.some((unit) => unit.condition === "DAMAGED") ? "DAMAGED" : units.some((unit) => unit.condition === "FAIR") ? "FAIR" : units.some((unit) => unit.condition === "GOOD") ? "GOOD" : "NEW";
  return { NEW: "Nuevo", GOOD: "Bueno", FAIR: "Requiere revisión", DAMAGED: "Dañado" }[worst];
}
