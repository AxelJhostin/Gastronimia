"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getInventoryItems, getInventoryStock, type InventoryItem, type InventoryStock } from "@/lib/api/client";

// Roles con permiso de lectura para el catálogo e inventario
const ALLOWED_ROLES = ["ADMIN", "MANAGER", "STOREKEEPER", "TEACHER", "teacher", "storekeeper", "admin"];

export default function InventoryPage() {
  const identity = useDashboardIdentity();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => ALLOWED_ROLES.includes(role));

  useEffect(() => {
    if (!hasAccess) return;

    void Promise.all([getInventoryItems(identity.accessToken), getInventoryStock(identity.accessToken)])
      .then(([nextItems, nextStock]) => {
        setItems(nextItems);
        setStock(nextStock);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el inventario.")
      )
      .finally(() => setLoading(false));
  }, [identity, hasAccess]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando inventario…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  const quantityByItem = stock.reduce<Record<string, number>>((total, row) => {
    total[row.inventory_item_id] = (total[row.inventory_item_id] ?? 0) + Number(row.quantity);
    return total;
  }, {});

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Control de Pañol
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Inventarios de Equipos
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Consulta la disponibilidad, estado y ubicación de herramientas y utensilios de cocina.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Tabla de Inventario */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar el inventario: {error}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Equipo / Útil</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Stock Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      Cargando inventario…
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {item.tracking_mode === "QUANTITY" ? "Por cantidad" : "Por unidad"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-stone-900">
                        {quantityByItem[item.id] ?? 0} {item.unit_of_measure}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-stone-100 text-stone-700 ring-stone-500/20"
                          }`}
                        >
                          {item.is_active ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                        >
                          Ver ficha →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No hay equipos registrados en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}