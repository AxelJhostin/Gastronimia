import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const modules = [
    {
      title: "Academia",
      description: "Gestión de períodos académicos, asignaturas y secciones.",
      href: "/admin/academia",
      role: "ADMIN / MANAGER",
    },
    {
      title: "Inventario y Stock",
      description: "Control de insumos, stock mínimo, recepciones y mermas.",
      href: "/admin/inventario",
      role: "ADMIN / MANAGER",
    },
    {
      title: "Solicitudes de Insumos",
      description: "Peticiones de ingredientes para clases y aprobación.",
      href: "/solicitudes",
      role: "DOCENTE / ADMIN",
    },
    {
      title: "Reserva de Espacios",
      description: "Programación de talleres y laboratorios de cocina.",
      href: "/reservas",
      role: "DOCENTE / ADMIN",
    },
    {
      title: "Mantenimiento",
      description: "Registro de incidencias y revisiones de equipos.",
      href: "/admin/mantenimiento",
      role: "ADMIN / MANAGER",
    },
    {
      title: "Gestión de Usuarios",
      description: "Administración de usuarios, roles y permisos.",
      href: "/admin/usuarios",
      role: "ADMIN",
    },
  ];

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Gastronomía
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Panel Principal</h1>
            <p className="mt-1 text-sm text-stone-500">
              Sesión validada. Selecciona un módulo para comenzar a trabajar.
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Rejilla de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="p-5 border border-stone-200 rounded-xl hover:border-amber-700 hover:shadow-md transition bg-stone-50/50 flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {mod.role}
                </span>
                <h3 className="font-bold text-stone-900 text-base mt-2">{mod.title}</h3>
                <p className="text-xs text-stone-600 mt-1">{mod.description}</p>
              </div>
              <span className="text-xs font-semibold text-amber-700 hover:underline">
                Acceder →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

/*"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, UserMe } from "@/lib/api/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserPermissions() {
      try {
        const user: UserMe = await authApi.getMe();

        // Redirección por rol prioritario según la guía de handoff
        if (user.roles.includes("ADMIN") || user.roles.includes("MANAGER")) {
          router.replace("/admin/solicitudes");
        } else if (user.roles.includes("TEACHER")) {
          router.replace("/solicitudes/mis-solicitudes");
        } else {
          setError("El usuario no tiene asignado un rol válido.");
        }
      } catch (err: any) {
        setError(err.message || "Error al verificar sesión con la API.");
      } finally {
        setLoading(false);
      }
    }

    loadUserPermissions();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-600">Cargando perfil y permisos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return null;
}*/