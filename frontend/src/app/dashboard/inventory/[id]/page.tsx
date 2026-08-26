import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

interface InventoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener información detallada del ítem
  const { data: item, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Ficha del Equipo
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              {item.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Categoría: <span className="font-medium text-stone-800">{item.category || "General"}</span>
            </p>
          </div>
          <Link
            href="/dashboard/inventory"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Inventario
          </Link>
        </div>

        {/* Información Detallada */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Tarjeta de Stock y Estado */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Disponibilidad
            </h2>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Stock Total:</span>
              <span className="text-lg font-bold text-stone-900">{item.total_quantity ?? 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Stock Disponible:</span>
              <span className="text-lg font-bold text-emerald-700">{item.available_quantity ?? 0}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="text-sm text-stone-600">Estado Operativo:</span>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                  item.status === "AVAILABLE"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : item.status === "MAINTENANCE"
                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                    : "bg-red-50 text-red-700 ring-red-600/20"
                }`}
              >
                {item.status || "AVAILABLE"}
              </span>
            </div>
          </div>

          {/* Tarjeta de Especificaciones Técnicas */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Ubicación y Almacenamiento
            </h2>

            <div>
              <span className="block text-xs text-stone-500">Ubicación en Pañol:</span>
              <span className="text-sm font-medium text-stone-900">
                {item.location || "Estantería Principal / Pañol A"}
              </span>
            </div>

            <div>
              <span className="block text-xs text-stone-500">Código Interno:</span>
              <span className="text-sm font-mono text-stone-800">
                {item.sku || `EQ-${item.id.slice(0, 8).toUpperCase()}`}
              </span>
            </div>

            <div>
              <span className="block text-xs text-stone-500">Descripción / Observaciones:</span>
              <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                {item.description || "Sin observaciones registradas para este activo."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}