import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewRequestForm } from "@/components/requests/new-request-form";

export default async function NewRequestPage() {
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener lista de ítems disponibles para seleccionar en el formulario
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("id, name, sku, available_quantity")
    .gt("available_quantity", 0);

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Prácticas de Cocina
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Nueva Solicitud de Pañol
            </h1>
          </div>
          <Link
            href="/dashboard/requests"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Cancelar
          </Link>
        </div>

        <p className="mt-4 text-xs text-stone-600 leading-relaxed">
          Selecciona la fecha de la clase e indica los insumos o equipos necesarios para la práctica.
        </p>

        <div className="mt-6">
          <NewRequestForm items={inventoryItems || []} userId={user.id} />
        </div>
      </section>
    </main>
  );
}