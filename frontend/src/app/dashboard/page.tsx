import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Validar la sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener perfil y rol del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "TEACHER";

  // Redirigir si el rol es TEACHER
  if (role === "TEACHER") {
    redirect("/dashboard/requests");
  }

  // 3. Consultar métricas de la base de datos
  const [
    { count: pendingRequestsCount },
    { count: activeLoansCount },
    { count: totalItemsCount },
    { count: lowStockCount },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).lte("available_quantity", 2),
    supabase.from("requests").select("id, status, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Resumen de Operaciones
          </span>
          <h1 className="text-2xl font-black text-stone-900">
            Panel de Control del Pañol
          </h1>
          <p className="text-xs text-stone-500">
            Bienvenido, {profile?.full_name || user.email} ({role})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-amber-800 shadow-sm"
          >
            ＋ Nueva Solicitud
          </Link>
          <Link
            href="/dashboard/returns"
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 transition-all hover:bg-stone-200"
          >
            🔄 Registrar Devolución
          </Link>
        </div>
      </header>

      {/* Grid de Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Solicitudes Pendientes
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
              📋
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{pendingRequestsCount || 0}</span>
            <Link href="/dashboard/requests" className="text-xs font-bold text-amber-700 hover:underline">
              Ver pendientes →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Préstamos Activos
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
              🔄
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{activeLoansCount || 0}</span>
            <Link href="/dashboard/requests" className="text-xs font-bold text-blue-700 hover:underline">
              Ver préstamos →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total de Ítems
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
              🔪
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-stone-900">{totalItemsCount || 0}</span>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-emerald-700 hover:underline">
              Ver catálogo →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Stock Crítico
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 font-bold text-sm">
              ⚠️
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600">{lowStockCount || 0}</span>
            <span className="text-xs text-stone-400">Unidades ≤ 2</span>
          </div>
        </div>
      </section>

      {/* Tabla de Actividad Reciente */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <h2 className="text-base font-bold text-stone-900">Actividad Reciente del Pañol</h2>
          <Link href="/dashboard/requests" className="text-xs font-semibold text-amber-700 hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400">
                <th className="pb-3 font-semibold uppercase">ID</th>
                <th className="pb-3 font-semibold uppercase">Solicitante</th>
                <th className="pb-3 font-semibold uppercase">Estado</th>
                <th className="pb-3 font-semibold uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {recentRequests && recentRequests.length > 0 ? (
                recentRequests.map((req: any) => {
                  const profileData = Array.isArray(req.profiles)
                    ? req.profiles[0]
                    : req.profiles;

                  return (
                    <tr key={req.id} className="hover:bg-stone-50">
                      <td className="py-3 font-mono font-medium text-stone-900">
                        {req.id.slice(0, 8)}...
                      </td>
                      <td className="py-3">
                        {profileData?.full_name || "Usuario"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            req.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 text-stone-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-stone-400">
                    No hay solicitudes recientes registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}