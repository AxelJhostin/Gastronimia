"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  GraduationCap,
  History,
  House,
  Package,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Truck,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { AppShell, type NavigationItem } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { RoleCode } from "@/lib/api/client";

type RoleNavigationItem = Omit<NavigationItem, "roles"> & {
  roles: RoleCode[];
};

const NAV_ITEMS: RoleNavigationItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: <House className="size-4" />,
    roles: ["ADMIN", "MANAGER", "TEACHER"],
  },
  {
    label: "Solicitudes",
    href: "/dashboard/requests",
    icon: <FileText className="size-4" />,
    roles: ["ADMIN", "MANAGER", "TEACHER"],
  },
  {
    label: "Mis préstamos",
    href: "/dashboard/loans",
    icon: <History className="size-4" />,
    roles: ["TEACHER"],
  },
  {
    label: "Preparaciones",
    href: "/dashboard/preparations",
    icon: <Utensils className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Entregas",
    href: "/dashboard/deliveries",
    icon: <Truck className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Inventario y stock",
    href: "/dashboard/inventory",
    icon: <Package className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Préstamos y devoluciones",
    href: "/dashboard/returns",
    icon: <RotateCcw className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Mantenimiento",
    href: "/dashboard/maintenance",
    icon: <Wrench className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Incidencias",
    href: "/dashboard/incidents",
    icon: <TriangleAlert className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    icon: <Users className="size-4" />,
    roles: ["ADMIN"],
  },
  {
    label: "Academia",
    href: "/dashboard/academic",
    icon: <GraduationCap className="size-4" />,
    roles: ["ADMIN"],
  },
  {
    label: "Auditoría",
    href: "/dashboard/audit-log",
    icon: <ShieldCheck className="size-4" />,
    roles: ["ADMIN"],
  },
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: <BarChart3 className="size-4" />,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const identityState = useDashboardIdentity();

  const userRoles =
    identityState.status === "authenticated"
      ? identityState.user.roles
      : [];

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  const identity = identityState.status === "authenticated" ? (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">{identityState.user.email?.slice(0, 1).toUpperCase() ?? "U"}</span>
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{identityState.user.email}</p><p className="mt-0.5 truncate text-xs text-white/55">{identityState.user.roles.map(roleLabel).join(" · ")}</p></div>
    </div>
  ) : <p className="text-xs text-white/60">Cargando tu perfil…</p>;

  async function handleLogout() {
    await createClient().auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    router.replace("/login");
    router.refresh();
  }

  return <AppShell identity={identity} navigation={visibleNavItems} onLogout={handleLogout}>{children}</AppShell>;
}

function roleLabel(role: RoleCode) {
  return { ADMIN: "Administrador", MANAGER: "Encargado", TEACHER: "Docente", "PAÑOLERO": "Pañolero" }[role];
}
