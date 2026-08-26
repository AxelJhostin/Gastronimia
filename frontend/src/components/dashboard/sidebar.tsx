"use client";

import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

export default function Sidebar() {
  const identity = useDashboardIdentity();

  if (identity.status === "loading") {
    return <aside className="w-64 shrink-0 border-r border-stone-200 bg-white p-5" />;
  }

  if (identity.status === "unavailable") {
    return null;
  }

  const isAdmin = identity.user.roles.includes("ADMIN");

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-5 text-stone-900">
      <p className="text-lg font-semibold">Gastronomía</p>
      <p className="mt-1 text-xs text-stone-500">Laboratorio e inventario</p>
      <nav className="mt-8 space-y-2 text-sm" aria-label="Navegación principal">
        <Link className="block rounded-lg px-3 py-2 hover:bg-stone-100" href="/dashboard">
          Panel principal
        </Link>
        {isAdmin ? (
          <Link className="block rounded-lg px-3 py-2 hover:bg-stone-100" href="/dashboard/users">
            Usuarios
          </Link>
        ) : null}
      </nav>
      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </aside>
  );
}
