import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function ChangePasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Seguridad
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Cambiar Contraseña
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver
          </Link>
        </div>

        <p className="mt-4 text-xs text-stone-600 leading-relaxed">
          Ingresa tu nueva contraseña a continuación. Asegúrate de que tenga al menos 6 caracteres.
        </p>

        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}