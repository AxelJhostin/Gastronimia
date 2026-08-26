import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RequestsPage() {
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Consultar perfil para validar rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "TEACHER";

  // 3. Consultar solicitudes de insumos/equipos
  let query = supabase
    .from("requests")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  // Si es docente, ver solo sus propias solicitudes; si es ADMIN/MANAGER, ver todas
  if (userRole === "TEACHER") {
    query = query.eq("user_id", user.id);
  }

  const { data: requests, error } = await query;

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Operación
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Gestión de Solicitudes y Reservas
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Revisa, administra y genera las reservas de pañol para actividades docentes.
            </p>
          </div>

          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
          >
            ＋ Nueva Solicitud
          </Link>
        </div>

        {/* Listado de Solicitudes */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar las solicitudes: {error.message}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código / Asunto</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Fecha Requerida</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests && requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">
                        {req.title || `Solicitud #${req.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {req.profiles?.full_name || "Docente"}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {req.needed_date
                          ? new Date(req.needed_date).toLocaleDateString("es-ES")
                          : "Por definir"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            req.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : req.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : req.status === "REJECTED"
                              ? "bg-red-50 text-red-700 ring-red-600/20"
                              : "bg-stone-100 text-stone-700 ring-stone-500/20"
                          }`}
                        >
                          {req.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/requests/${req.id}`}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                      No tienes borradores ni solicitudes registradas actualmente.
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