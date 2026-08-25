"use client";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const identity = useDashboardIdentity();

  if (identity.status === "loading") {
    return <p className="mt-6 text-sm text-stone-600">Verificando permisos…</p>;
  }

  if (identity.status === "unavailable") {
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        {identity.message}
      </p>
    );
  }

  if (!identity.user.roles.includes("ADMIN")) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return <>{children}</>;
}
