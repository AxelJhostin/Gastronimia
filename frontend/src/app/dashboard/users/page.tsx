import Link from "next/link";

import { UserProvisionForm } from "@/components/admin/user-invitation-form";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

export default function UserManagementPage() {
  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <Link className="text-sm text-amber-800 underline" href="/dashboard">
          Volver al panel
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Administración
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Crear usuario</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Crea la cuenta, asigna sus roles y comparte las credenciales temporales
          de forma segura. La persona deberá cambiarlas al ingresar por primera vez.
        </p>
        <AdminRouteGuard>
          <UserProvisionForm />
        </AdminRouteGuard>
      </section>
    </main>
  );
}
