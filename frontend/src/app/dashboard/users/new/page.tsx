import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "@/components/admin/create-user-form";

export default async function NewUserPage() {
  const supabase = await createClient();

  // Validar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Validar permisos de ADMIN
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    redirect("/dashboard/unauthorized");
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Administración
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Crear Nuevo Usuario
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Registra una nueva cuenta institucional y asigna su rol operativo.
            </p>
          </div>
          <Link
            href="/dashboard/users"
            className="text-xs font-semibold text-stone-600 hover:text-amber-800 underline"
          >
            ← Volver a usuarios
          </Link>
        </div>

        {/* Formulario de Alta */}
        <div className="mt-6">
          <CreateUserForm />
        </div>
      </section>
    </main>
  );
}