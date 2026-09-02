"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import { getInventoryItemDetail, type InventoryItemDetail } from "@/lib/api/client";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const identity = useDashboardIdentity();
  const [detail, setDetail] = useState<InventoryItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAccess =
    identity.status === "authenticated" &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || identity.status !== "authenticated") return;
    void getInventoryItemDetail(identity.accessToken, id).then(setDetail).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el ítem."));
  }, [hasAccess, id, identity]);

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando inventario…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;
  if (!detail && !error) return <p className="p-6 text-sm text-stone-600">Cargando inventario…</p>;
  if (error || !detail) return <p className="p-6 text-sm text-red-700">{error ?? "Ítem no encontrado."}</p>;

  return <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900"><section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"><div className="flex items-start justify-between border-b border-stone-100 pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Ficha de inventario</p><h1 className="mt-2 text-3xl font-bold">{detail.item.name}</h1><p className="mt-2 text-sm text-stone-600">{detail.item.code ?? "Sin código"} · {detail.item.tracking_mode === "QUANTITY" ? "Por cantidad" : "Por unidad"}</p></div><Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard/inventory">← Volver</Link></div><p className="mt-5 text-sm text-stone-600">{detail.item.description ?? "Sin descripción."}</p><h2 className="mt-8 text-sm font-semibold uppercase tracking-wider">Stock por ubicación</h2><ul className="mt-3 divide-y rounded-xl border">{detail.stock.map((row) => <li className="flex justify-between p-3 text-sm" key={row.location_id}><span>{row.location_name}</span><strong>{row.quantity} {row.unit_of_measure}</strong></li>)}{!detail.stock.length ? <li className="p-3 text-sm text-stone-500">No hay stock por cantidad registrado.</li> : null}</ul><h2 className="mt-8 text-sm font-semibold uppercase tracking-wider">Unidades</h2><ul className="mt-3 divide-y rounded-xl border">{detail.units.map((unit) => <li className="flex justify-between p-3 text-sm" key={unit.id}><span className="font-mono">{unit.asset_tag}</span><span>{unit.status} · {unit.condition}</span></li>)}{!detail.units.length ? <li className="p-3 text-sm text-stone-500">No hay unidades individuales registradas.</li> : null}</ul></section></main>;
}
