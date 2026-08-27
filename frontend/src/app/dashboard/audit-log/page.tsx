"use client";

import Link from "next/link";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

export default function AuditLogPage() {
  return (
    <AdminRouteGuard>
      <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900 min-h-[calc(100vh-4rem)]">
        <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Administración
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
                Registro de Auditoría
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Historial de acciones, eventos y modificaciones del sistema.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
            >
              ← Volver al Panel
            </Link>
          </div>

          <div className="mt-6">
            {/* Aquí va la tabla/componente de registros de auditoría */}
            <p className="text-sm text-stone-500">Cargando registros del sistema…</p>
          </div>
        </section>
      </main>
    </AdminRouteGuard>
  );
}