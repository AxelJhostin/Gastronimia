"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, 
  Package, 
  FileText, 
  Utensils, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  ClipboardList, 
  BarChart3 
} from "lucide-react";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import type { RoleCode } from "@/lib/api/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RoleCode[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
    roles: ["ADMIN", "MANAGER", "TEACHER"],
  },
  {
    label: "Solicitudes",
    href: "/dashboard/requests",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "TEACHER"],
  },
  {
    label: "Preparaciones",
    href: "/dashboard/preparations",
    icon: Utensils,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Entregas",
    href: "/dashboard/deliveries",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Inventario y Stock",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Devoluciones",
    href: "/dashboard/returns",
    icon: RotateCcw,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Mantenimiento",
    href: "/dashboard/maintenance",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Incidencias",
    href: "/dashboard/incidents",
    icon: AlertTriangle,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Academia",
    href: "/dashboard/academic",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    label: "Auditoría",
    href: "/dashboard/audit-log",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const identityState = useDashboardIdentity();

  const userRoles =
    identityState.status === "authenticated"
      ? identityState.user.roles
      : [];

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Utensils className="h-6 w-6 text-emerald-500" />
        <span className="font-bold text-lg tracking-tight">Gastronomía</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {identityState.status === "authenticated" && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <p className="text-xs font-semibold text-slate-300 truncate">
            {identityState.user.email}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {identityState.user.roles.map((role) => (
              <span
                key={role}
                className="inline-block px-2 py-0.5 text-[10px] font-medium rounded uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
