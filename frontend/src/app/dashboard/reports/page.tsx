import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Validar rol de ADMIN
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    redirect("/dashboard/unauthorized");
  }

  // 3. Obtener métricas rápidas desde la base de datos
  const { count: totalRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true });

  const { count: pendingRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  const { count: totalItems } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });

  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Auditoría y Análisis
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Reportes de Operación
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Visión consolidada del uso de insumos, solicitudes docentes y rotación de stock.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Tarjetas de Métricas Clave */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Solicitudes
            </span>
            <div className="mt-2 text-3xl font-bold text-stone-900">
              {totalRequests ?? 0}
            </div>
            <p className="mt-1 text-xs text-stone-600">Histórico registrado</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pendientes
            </span>
            <div className="mt-2 text-3xl font-bold text-amber-900">
              {pendingRequests ?? 0}
            </div>
            <p className="mt-1 text-xs text-amber-700">Requieren aprobación</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Ítems en Pañol
            </span>
            <div className="mt-2 text-3xl font-bold text-stone-900">
              {totalItems ?? 0}
            </div>
            <p className="mt-1 text-xs text-stone-600">Equipos catalogados</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Usuarios Activos
            </span>
            <div className="mt-2 text-3xl font-bold text-stone-900">
              {activeUsers ?? 0}
            </div>
            <p className="mt-1 text-xs text-stone-600">Cuentas habilitadas</p>
          </div>
        </div>

        {/* Bloque de accesos a reportes avanzados */}
        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
            Exportación y Consultas
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Selecciona un tipo de informe para generar un resumen operativo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-lg bg-white border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:border-amber-700 hover:text-amber-800 transition-colors shadow-sm">
              📄 Consumo Mensual por Materia
            </button>
            <button className="rounded-lg bg-white border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:border-amber-700 hover:text-amber-800 transition-colors shadow-sm">
              🛠️ Estado de Equipos y Mantenimiento
            </button>
            <button className="rounded-lg bg-white border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:border-amber-700 hover:text-amber-800 transition-colors shadow-sm">
              📋 Trazabilidad de Devoluciones
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}