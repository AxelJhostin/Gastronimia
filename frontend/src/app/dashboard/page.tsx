import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Gastronomía
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Panel principal</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-6 leading-7 text-stone-600">
          Tu sesión está validada. Las opciones disponibles se mostrarán según tu rol.
        </p>
      </section>
    </main>
  );
}
