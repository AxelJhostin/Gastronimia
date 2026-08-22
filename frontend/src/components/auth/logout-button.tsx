"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
      onClick={handleLogout}
      type="button"
    >
      Cerrar sesión
    </button>
  );
}