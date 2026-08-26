'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CreateUserForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "TEACHER">("TEACHER");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      // 1. Crear el usuario en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (signUpError) {
        setErrorMessage(signUpError.message);
        return;
      }

      // 2. Si el trigger de la BD no crea el perfil automáticamente, actualizamos la tabla profiles
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          role,
        });

        if (profileError) {
          setErrorMessage(profileError.message);
          return;
        }
      }

      setSuccessMessage("Usuario registrado exitosamente.");
      
      // Limpiar campos o redirigir tras un breve tiempo
      setTimeout(() => {
        router.push("/dashboard/users");
        router.refresh();
      }, 1200);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Nombre Completo
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej. María Chef"
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Correo Electrónico
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="docente@gastronomia.edu"
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Contraseña Inicial
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Rol Operativo
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "MANAGER" | "TEACHER")}
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none bg-white"
        >
          <option value="TEACHER">Docente (TEACHER)</option>
          <option value="MANAGER">Pañol / Encargado (MANAGER)</option>
          <option value="ADMIN">Administrador (ADMIN)</option>
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Registrando usuario..." : "Guardar y Crear Credenciales"}
        </button>
      </div>
    </form>
  );
}