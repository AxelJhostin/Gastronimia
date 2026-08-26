"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { getEquipmentRequestDetail, type EquipmentRequestDetail } from "@/lib/api/client";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const identity = useDashboardIdentity();
  const [detail, setDetail] = useState<EquipmentRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (identity.status !== "authenticated") return;
    void getEquipmentRequestDetail(identity.accessToken, id)
      .then(setDetail)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la solicitud."));
  }, [id, identity]);

  if (identity.status === "loading" || (!detail && !error)) return <p className="p-6 text-sm text-stone-600">Cargando solicitud…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (error || !detail) return <p className="p-6 text-sm text-red-700">{error ?? "Solicitud no encontrada."}</p>;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Detalle de solicitud</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{detail.request.purpose || `Solicitud #${detail.request.id.slice(0, 8)}`}</h1>
            <p className="mt-2 text-sm text-stone-600">Estado: <strong>{detail.request.status}</strong> · Inicio: {new Date(detail.request.start_at).toLocaleString("es-EC")}</p>
          </div>
          <Link className="text-xs font-semibold text-stone-600 underline hover:text-amber-800" href="/dashboard/requests">← Volver</Link>
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-4 py-3">Ítem</th><th className="px-4 py-3">Código</th><th className="px-4 py-3 text-right">Cantidad</th></tr></thead>
            <tbody className="divide-y divide-stone-100">{detail.items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.inventory_item_name}</td><td className="px-4 py-3 font-mono text-xs">{item.inventory_item_code ?? "—"}</td><td className="px-4 py-3 text-right">{item.requested_quantity} {item.unit_of_measure}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
