"use client";

import Link from "next/link";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

export function AdminUserLink() {
  const identity = useDashboardIdentity();

  if (
    identity.status !== "authenticated" ||
    !identity.user.roles.includes("ADMIN")
  ) {
    return null;
  }

  return (
    <Link
      className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
      href="/dashboard/users"
    >
      Administrar usuarios
    </Link>
  );
}
