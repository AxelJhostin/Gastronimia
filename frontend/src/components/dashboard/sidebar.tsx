import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Validar sesión de usuario (Paso 2)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Consultar perfil y verificar rol (Paso 2)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Redirigir a solicitudes si el usuario es TEACHER
  if (profile?.role === "TEACHER") {
    redirect("/dashboard/requests");
  }

  // 3. Obtener métricas para el panel general
  const [
    { count: pendingRequestsCount },
    { count: activeLoansCount },
    { count: totalItemsCount },
    { count: lowStockCount },
  ] = await Promise.all([
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }),
    supabase.from("inventory_items").select("*", { count: "exact", head: true }).lte("available_quantity", 2),
  ]);

  return (
    <div className="space-y-8">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Resumen Operativo
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Panel de Control del Pañol
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/requests/new"
            className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
          >
            ＋ Nueva Solicitud
          </Link>
        </div>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Solicitudes Pendientes */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Pendientes
            </span>
            <span className="rounded-full bg-amber-100 p-2 text-amber-700">📋</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">
            {pendingRequestsCount || 0}
          </p>
          <p className="mt-1 text-xs text-stone-500">Por aprobar o rechazar</p>
        </div>

        {/* Préstamos Activos */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              En Préstamo
            </span>
            <span className="rounded-full bg-blue-100 p-2 text-blue-700">🔄</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">
            {activeLoansCount || 0}
          </p>
          <p className="mt-1 text-xs text-stone-500">Equipos entregados a clases</p>
        </div>

        {/* Total Ítems */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Ítems
            </span>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">🔪</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">
            {totalItemsCount || 0}
          </p>
          <p className="mt-1 text-xs text-stone-500">Registrados en inventario</p>
        </div>

        {/* Stock Crítico */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Stock Crítico
            </span>
            <span className="rounded-full bg-rose-100 p-2 text-rose-700">⚠️</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">
            {lowStockCount || 0}
          </p>
          <p className="mt-1 text-xs text-stone-500">Ítems con 2 o menos unidades</p>
        </div>
      </div>

      {/* Secciones de Accesos Rápidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-900">Gestión de Operaciones</h2>
          <p className="mt-1 text-xs text-stone-500">
            Administra los flujos diarios de entrega, recepción y control de stock.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/dashboard/requests"
              className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 p-4 font-semibold text-stone-800 hover:border-amber-600 hover:bg-amber-50/50 transition-colors"
            >
              <span className="text-base mb-1">📋</span>
              Revisar Solicitudes
            </Link>

            <Link
              href="/dashboard/returns"
              className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 p-4 font-semibold text-stone-800 hover:border-amber-600 hover:bg-amber-50/50 transition-colors"
            >
              <span className="text-base mb-1">🔄</span>
              Registrar Devolución
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-900">Inventario de Gastronomía</h2>
          <p className="mt-1 text-xs text-stone-500">
            Supervisa el estado de la cristalería, cuchillería y maquinaria pesada.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/dashboard/inventory"
              className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 p-4 font-semibold text-stone-800 hover:border-amber-600 hover:bg-amber-50/50 transition-colors"
            >
              <span className="text-base mb-1">🔪</span>
              Ver Catálogo Completo
            </Link>

            {profile?.role === "ADMIN" && (
              <Link
                href="/dashboard/inventory/new"
                className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 p-4 font-semibold text-stone-800 hover:border-amber-600 hover:bg-amber-50/50 transition-colors"
              >
                <span className="text-base mb-1">📦</span>
                Ingresar Nuevo Ítem
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}