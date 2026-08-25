"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export function AdminUserLink() {
  const [canManageUsers, setCanManageUsers] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      const { data } = await createClient().auth.getSession();
      if (!data.session) {
        return;
      }

      try {
        const user = await getCurrentUser(data.session.access_token);
        setCanManageUsers(user.roles.includes("ADMIN"));
      } catch {
        setCanManageUsers(false);
      }
    }

    void loadPermissions();
  }, []);

  if (!canManageUsers) {
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
