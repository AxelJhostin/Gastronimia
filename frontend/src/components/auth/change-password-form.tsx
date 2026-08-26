'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("Contraseña actualizada con éxito.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Nueva Contraseña
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
          Confirmar Contraseña
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Actualizando..." : "Actualizar Contraseña"}
      </button>
    </form>
  );
}