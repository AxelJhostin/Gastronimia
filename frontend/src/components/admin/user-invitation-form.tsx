"use client";

import { FormEvent, useRef, useState } from "react";

import {
  ApiError,
  createManagedUser,
  type RoleCode,
  type ProvisionedUser,
} from "@/lib/api/client";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

const availableRoles: Array<{ code: RoleCode; label: string }> = [
  { code: "TEACHER", label: "Docente" },
  { code: "MANAGER", label: "Encargado" },
  { code: "ADMIN", label: "Administrador" },
];

type SubmissionState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "error"; message: string }
  | { type: "success"; user: ProvisionedUser };

const roleLabels: Record<RoleCode, string> = {
  ADMIN: "Administrador",
  MANAGER: "Encargado",
  TEACHER: "Docente",
};

export function UserProvisionForm() {
  const identity = useDashboardIdentity();
  const [submission, setSubmission] = useState<SubmissionState>({ type: "idle" });
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRef.current) {
      return;
    }

    if (identity.status !== "authenticated") {
      setSubmission({
        type: "error",
        message: "Tu sesión expiró. Inicia sesión nuevamente.",
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const roles = availableRoles
      .filter((role) => formData.get(`role-${role.code}`) === "on")
      .map((role) => role.code);

    if (roles.length === 0) {
      setSubmission({ type: "error", message: "Selecciona al menos un rol." });
      return;
    }

    isSubmittingRef.current = true;
    setCopyMessage(null);
    setSubmission({ type: "submitting" });
    try {
      const provisionedUser = await createManagedUser(identity.accessToken, {
        email: String(formData.get("email") ?? ""),
        full_name: String(formData.get("fullName") ?? ""),
        roles,
      });
      setSubmission({ type: "success", user: provisionedUser });
      form.reset();
    } catch (error) {
      setSubmission({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No fue posible crear el usuario.",
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function copyCredentials(user: ProvisionedUser) {
    const roles = user.roles.map((role) => roleLabels[role]).join(", ");
    const credentials = [
      `Hola ${user.full_name},`,
      "",
      "Se creó tu cuenta en Gastronomía.",
      `Correo: ${user.email}`,
      `Contraseña temporal: ${user.temporary_password}`,
      `Rol(es): ${roles}`,
      "",
      "Ingresa con estas credenciales y cambia la contraseña temporal antes de continuar.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(credentials);
      setCopyMessage("Credenciales copiadas. Ya puedes pegarlas en WhatsApp.");
    } catch {
      setCopyMessage(
        "No fue posible copiar automáticamente. Selecciona las credenciales y cópialas manualmente.",
      );
    }
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
      {submission.type === "error" ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {submission.message}
        </p>
      ) : null}
      {submission.type === "success" ? (
        <section
          aria-live="polite"
          className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
          role="status"
        >
          <div>
            <h2 className="font-semibold">Usuario creado correctamente</h2>
            <p className="mt-1 text-emerald-900">
              Comparte estas credenciales una sola vez por un canal seguro.
            </p>
          </div>
          <dl className="space-y-2 rounded-lg bg-white p-3 text-stone-900">
            <div>
              <dt className="font-medium text-stone-600">Correo</dt>
              <dd className="break-all font-mono">{submission.user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-600">Contraseña temporal</dt>
              <dd className="break-all font-mono">{submission.user.temporary_password}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-600">Roles</dt>
              <dd>{submission.user.roles.map((role) => roleLabels[role]).join(", ")}</dd>
            </div>
          </dl>
          <button
            className="rounded-lg border border-emerald-700 px-3 py-2 font-semibold text-emerald-900 hover:bg-emerald-100"
            onClick={() => void copyCredentials(submission.user)}
            type="button"
          >
            Copiar credenciales
          </button>
          {copyMessage ? <p className="font-medium">{copyMessage}</p> : null}
        </section>
      ) : null}
      <button
        className="w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submission.type === "submitting"}
        type="submit"
      >
        {submission.type === "submitting" ? "Creando usuario…" : "Crear usuario"}
      </button>
    </form>
  );
}
