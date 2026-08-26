import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener rol del usuario actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "TEACHER";

  // 3. Consultar la solicitud con sus detalles e ítems solicitados
  const { data: request, error } = await supabase
    .from("requests")
    .select("*, profiles(full_name, email), request_items(*, inventory_items(name, sku))")
    .eq("id", id)
    .single();

  if (error || !request) {
    notFound();
  }

  // Restricción de seguridad: docentes solo ven sus propias solicitudes
  if (userRole === "TEACHER" && request.user_id !== user.id) {
    redirect("/dashboard/unauthorized");
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Detalle de Solicitud
              </p>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  request.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : request.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                    : request.status === "REJECTED"
                    ? "bg-red-50 text-red-700 ring-red-600/20"
                    : "bg-stone-100 text-stone-700 ring-stone-500/20"
                }`}
              >
                {request.status || "DRAFT"}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              {request.title || `Solicitud #${request.id.slice(0, 8)}`}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Solicitado por <span className="font-semibold text-stone-800">{request.profiles?.full_name || request.profiles?.email}</span>
            </p>
          </div>
          <Link
            href="/dashboard/requests"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver a Solicitudes
          </Link>
        </div>

        {/* Información General */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl border border-stone-100 bg-stone-50/60 p-4 text-xs">
          <div>
            <span className="text-stone-500 block">Fecha Requerida:</span>
            <span className="font-semibold text-stone-800">
              {request.needed_date ? new Date(request.needed_date).toLocaleDateString("es-ES") : "Sin fecha"}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Fecha de Registro:</span>
            <span className="font-semibold text-stone-800">
              {new Date(request.created_at).toLocaleDateString("es-ES")}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Observaciones:</span>
            <span className="font-medium text-stone-700">
              {request.notes || "Sin observaciones adicionales"}
            </span>
          </div>
        </div>

        {/* Tabla de ítems pedidos */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            Equipos e Insumos Solicitados
          </h2>
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ítem</th>
                  <th className="px-4 py-3 font-semibold">Código SKU</th>
                  <th className="px-4 py-3 font-semibold text-right">Cantidad Requerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {request.request_items && request.request_items.length > 0 ? (
                  request.request_items.map((item: { id: string; quantity: number; inventory_items?: { name: string; sku?: string } }) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {item.inventory_items?.name || "Ítem de inventario"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">
                        {item.inventory_items?.sku || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-stone-500">
                      No hay ítems vinculados a esta solicitud.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}