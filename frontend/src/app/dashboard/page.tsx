"use client";

import Link from "next/link";
import { AdminUserLink } from "@/components/admin/admin-user-link";
import { DashboardIdentitySummary } from "@/components/auth/dashboard-identity-summary";
import { LogoutButton } from "@/components/auth/logout-button";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  roles: string[];
  badge?: string;
}

const DASHBOARD_MODULES: ModuleCard[] = [
  {
    title: "Preparaciones",
    description: "Gestión y preparación de solicitudes de insumos.",
    href: "/dashboard/preparations",
    icon: "🍳",
    roles: ["ADMIN", "MANAGER", "PAÑOLERO"],
  },
  {
    title: "Devoluciones",
    description: "Recepción y control de insumos devueltos.",
    href: "/dashboard/returns",
    icon: "🔄",
    roles: ["ADMIN", "MANAGER", "PAÑOLERO"],
  },
  {
    title: "Novedades / Incidencias",
    description: "Reporte y seguimiento de averías o imprevistos.",
    href: "/dashboard/incidents",
    icon: "⚠️",
    roles: ["ADMIN", "MANAGER", "PAÑOLERO"],
  },
  {
    title: "Reportes Operativos",
    description: "Métricas y análisis de consumo de inventario.",
    href: "/dashboard/reports",
    icon: "📊",
    roles: ["ADMIN", "MANAGER"],
    badge: "Admin",
  },
  {
    title: "Registro de Auditoría",
    description: "Historial de acciones e interacciones en el sistema.",
    href: "/dashboard/audit-log",
    icon: "📜",
    roles: ["ADMIN"],
    badge: "Solo Admin",
  },
];

export default function DashboardPage() {
  const identity = useDashboardIdentity();

  const userRoles: string[] =
    identity.status === "authenticated" ? (identity.user.roles as string[]) : [];

  const allowedModules = DASHBOARD_MODULES.filter((module) =>
    module.roles.some((role) => userRoles.includes(role))
  );

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Gastronomía
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Panel principal</h1>
            <p className="mt-2 text-sm text-stone-600">
              Tu sesión está validada. Las opciones disponibles se muestran a continuación según tus permisos.
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Resumen de la sesión del usuario */}
        <DashboardIdentitySummary />

        {/* Tarjetas interactivas por rol */}
        {identity.status === "authenticated" && (
          <div className="pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4">
              Módulos Disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allowedModules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex flex-col justify-between p-5 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 hover:border-amber-500 transition-all duration-200 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{module.icon}</span>
                      {module.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
                    Ingresar &rarr;
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-100">
          <AdminUserLink />
        </div>
      </section>
    </main>
  );
}