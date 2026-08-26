import Link from "next/link";

import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

export default function AuditLogPage() {
  return (
    <AdminRouteGuard>
      <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
        <section className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Seguridad y Control</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Historial de Auditoría</h1>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Esta vista se dejó protegida, pero no se conecta a la tabla directamente. Falta incorporar un endpoint de auditoría con paginación y el nivel de detalle autorizado para cada rol.
          </p>
          <Link className="mt-6 inline-flex text-sm font-semibold text-amber-800 underline" href="/dashboard">← Volver al panel</Link>
        </section>
      </main>
    </AdminRouteGuard>
  );
}
