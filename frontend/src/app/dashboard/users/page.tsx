import Link from "next/link";
import { redirect } from "next/navigation";

import { UserInvitationForm } from "@/components/admin/user-invitation-form";
import { createClient } from "@/lib/supabase/server";

export default async function UserManagementPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <Link className="text-sm text-amber-800 underline" href="/dashboard">
          Volver al panel
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Administración
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Invitar usuario</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          La persona recibirá un enlace de un solo uso para activar su cuenta y
          definir una contraseña.
        </p>
        <UserInvitationForm />
      </section>
    </main>
  );
}
