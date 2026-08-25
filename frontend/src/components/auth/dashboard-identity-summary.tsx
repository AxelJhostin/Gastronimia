"use client";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

const roleLabels = {
  ADMIN: "Administrador",
  MANAGER: "Encargado",
  TEACHER: "Docente",
} as const;

export function DashboardIdentitySummary() {
  const identity = useDashboardIdentity();

  if (identity.status === "loading") {
    return <p className="mt-6 text-sm text-stone-500">Cargando tu perfil…</p>;
  }

  if (identity.status === "unavailable") {
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        {identity.message}
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-900">
        Sesión activa: {identity.user.email ?? "Correo no disponible"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Roles asignados">
        {identity.user.roles.map((role) => (
          <span
            className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900"
            key={role}
          >
            {roleLabels[role]}
          </span>
        ))}
      </div>
    </div>
  );
}
