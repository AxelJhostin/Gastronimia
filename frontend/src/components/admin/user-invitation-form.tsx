"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  ApiError,
  createManagedUser,
  getCurrentUser,
  type RoleCode,
  type ProvisionedUser,
} from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

const availableRoles: Array<{ code: RoleCode; label: string }> = [
  { code: "TEACHER", label: "Docente" },
  { code: "MANAGER", label: "Encargado" },
  { code: "ADMIN", label: "Administrador" },
];

export function UserInvitationForm() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<ProvisionedUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      const { data } = await createClient().auth.getSession();
      if (!data.session) {
        setErrorMessage("Tu sesión expiró. Inicia sesión nuevamente.");
        setIsLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser(data.session.access_token);
        setAccessToken(data.session.access_token);
        setIsAdmin(user.roles.includes("ADMIN"));
      } catch {
        setErrorMessage("No fue posible verificar tus permisos.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPermissions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccess(null);

    if (!accessToken) {
      setErrorMessage("Tu sesión expiró. Inicia sesión nuevamente.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const roles = availableRoles
      .filter((role) => formData.get(`role-${role.code}`) === "on")
      .map((role) => role.code);

    if (roles.length === 0) {
      setErrorMessage("Selecciona al menos un rol.");
      return;
    }

    setIsSubmitting(true);
    try {
      const provisionedUser = await createManagedUser(accessToken, {
        email: String(formData.get("email") ?? ""),
        full_name: String(formData.get("fullName") ?? ""),
        roles,
      });
      setSuccess(provisionedUser);
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "No fue posible crear el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-stone-600">Verificando permisos…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        No tienes permisos para administrar usuarios.
      </p>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-stone-700" htmlFor="fullName">
        Nombre completo
        <input
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
          id="fullName"
          maxLength={160}
          name="fullName"
          required
          type="text"
        />
      </label>
      <label className="block text-sm font-medium text-stone-700" htmlFor="email">
        Correo institucional
        <input
          autoComplete="email"
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
          id="email"
          name="email"
          required
          type="email"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-stone-700">Roles</legend>
        <div className="mt-3 space-y-2">
          {availableRoles.map((role) => (
            <label className="flex items-center gap-2 text-sm text-stone-700" key={role.code}>
              <input name={`role-${role.code}`} type="checkbox" />
              {role.label}
            </label>
          ))}
        </div>
      </fieldset>
      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {success ? (
        <p aria-live="polite" className="text-sm text-emerald-700" role="status">
          Usuario creado: {success.email}. Contraseña temporal: {success.temporary_password}
          <button
            className="ml-2 underline"
            onClick={() => void navigator.clipboard.writeText(success.temporary_password)}
            type="button"
          >
            Copiar
          </button>
        </p>
      ) : null}
      <button
        className="w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creando usuario…" : "Crear usuario"}
      </button>
    </form>
  );
}
