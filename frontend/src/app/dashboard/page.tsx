"use client";

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
}