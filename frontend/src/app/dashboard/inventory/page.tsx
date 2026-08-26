import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Consultar catálogo de ítems de inventario
  const { data: items, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true });

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
              Error al cargar el inventario: {error.message}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Equipo / Útil</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Stock Total</th>
                  <th className="px-4 py-3 font-semibold">Disponible</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {item.category || "General"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-stone-900">
                        {item.total_quantity ?? 0}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-700">
                        {item.available_quantity ?? 0}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            item.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : item.status === "MAINTENANCE"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          }`}
                        >
                          {item.status || "AVAILABLE"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                        >
                          Ver ficha →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
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