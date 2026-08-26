import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuditLogPage() {
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

  // 3. Consultar registros de auditoría
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-6xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Seguridad y Control
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
              Historial de Auditoría
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Bitácora inmutable de eventos, modificaciones y acciones del sistema.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Tabla de Logs */}
        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar los registros de auditoría: {error.message}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha / Hora</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Módulo</th>
                  <th className="px-4 py-3 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-xs">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap font-sans">
                        {new Date(log.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3.5 text-stone-900 font-sans">
                        {log.profiles?.full_name || log.profiles?.email || "Sistema"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-sans text-stone-600">
                        {log.entity_type}
                      </td>
                      <td className="px-4 py-3.5 font-sans text-stone-600 truncate max-w-xs">
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500 font-sans">
                      No hay registros de auditoría almacenados.
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