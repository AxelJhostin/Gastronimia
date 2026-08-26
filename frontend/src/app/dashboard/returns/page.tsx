import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ReturnsPage() {
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Validar rol (MANAGER o ADMIN)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN" && profile?.role !== "MANAGER") {
    redirect("/dashboard/unauthorized");
  }

  // 3. Consultar entregas/retornos de material
  const { data: returns, error } = await supabase
    .from("returns")
    .select("*, requests(title, profiles(full_name))")
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Recepción post-clase
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Devoluciones y Retorno de Pañol
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Control de recepción de valijas y utensilios, verificación de faltantes y daños.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Tabla de Devoluciones */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar el historial de devoluciones: {error.message}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Solicitud / Clase</th>
                  <th className="px-4 py-3 font-semibold">Docente Responsable</th>
                  <th className="px-4 py-3 font-semibold">Fecha Recepción</th>
                  <th className="px-4 py-3 font-semibold">Estado de Recepción</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {returns && returns.length > 0 ? (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {ret.requests?.title || `Retorno #${ret.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {ret.requests?.profiles?.full_name || "Docente"}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {new Date(ret.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            ret.status === "COMPLETE"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : ret.status === "DAMAGED_ITEMS"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          }`}
                        >
                          {ret.status === "COMPLETE"
                            ? "Completo"
                            : ret.status === "DAMAGED_ITEMS"
                            ? "Con observaciones"
                            : "Faltantes"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/returns/${ret.id}`}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                        >
                          Revisar acta →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No hay registros de devoluciones recientes.
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