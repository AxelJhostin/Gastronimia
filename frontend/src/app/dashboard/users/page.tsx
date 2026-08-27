"use client";

import Link from "next/link";

import { UserProvisionForm } from "@/components/admin/user-invitation-form";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

export default function UserManagementPage() {
  return (
    <AdminRouteGuard>
      <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900 min-h-[calc(100vh-4rem)]">
        <section className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm my-auto">
          <Link 
            className="inline-flex items-center text-xs font-semibold text-amber-800 underline hover:text-amber-900 transition-colors" 
            href="/dashboard"
          >
            ← Volver al panel
          </Link>
          
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Administración
          </p>
          
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
            Crear usuario
          </h1>
          
          <p className="mt-2 text-sm leading-6 text-stone-600 border-b border-stone-100 pb-6">
            Crea la cuenta, asigna sus roles y comparte las credenciales temporales
            de forma segura. La persona deberá cambiarlas al ingresar por primera vez.
          </p>
          
          <div className="mt-6">
            <UserProvisionForm />
          </div>
        </section>
      </main>
    </AdminRouteGuard>
  );
}