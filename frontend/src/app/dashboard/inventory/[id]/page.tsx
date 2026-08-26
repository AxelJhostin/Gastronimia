import Link from "next/link";

export default function InventoryDetailPage() {
  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Inventario</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Ficha de inventario</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          La ficha detallada se habilitará con un endpoint de FastAPI que combine el ítem, stock y unidades autorizadas. Esta ruta no lee el inventario directamente desde Supabase.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-amber-800 underline" href="/dashboard/inventory">← Volver al inventario</Link>
      </section>
    </main>
  );
}
