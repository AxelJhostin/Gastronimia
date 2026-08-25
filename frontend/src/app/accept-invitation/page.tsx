"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { PasswordInput, PasswordStrength } from "@/components/ui";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [isInvitationValid, setIsInvitationValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  useEffect(() => {
    async function verifyInvitation() {
      const { data, error } = await createClient().auth.getUser();
      setIsInvitationValid(!error && Boolean(data.user));
    }

    void verifyInvitation();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const submittedPassword = String(formData.get("password") ?? "");
    const submittedPasswordConfirmation = String(formData.get("passwordConfirmation") ?? "");

    if (submittedPassword.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (submittedPassword !== submittedPasswordConfirmation) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await createClient().auth.updateUser({ password: submittedPassword });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage("No fue posible guardar tu contraseña. Solicita otra invitación.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Gastronomía
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Activa tu cuenta
        </h1>
        {isInvitationValid === null ? (
          <p className="mt-4 text-sm text-stone-600">Verificando invitación…</p>
        ) : null}
        {isInvitationValid === false ? (
          <p className="mt-4 text-sm leading-6 text-red-700" role="alert">
            Este enlace no es válido o ya expiró. Solicita una nueva invitación al
            administrador.
          </p>
        ) : null}
        {isInvitationValid ? (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <p className="text-sm leading-6 text-stone-600">
              Define una contraseña personal para terminar la activación.
            </p>
            <label className="block text-sm font-medium text-stone-700" htmlFor="password">
              Contraseña
              <PasswordInput
                autoComplete="new-password"
                className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
                id="password"
                minLength={8}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label
              className="block text-sm font-medium text-stone-700"
              htmlFor="passwordConfirmation"
            >
              Confirmar contraseña
              <PasswordInput
                autoComplete="new-password"
                className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
                id="passwordConfirmation"
                minLength={8}
                name="passwordConfirmation"
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            </label>
            <PasswordStrength confirmation={passwordConfirmation} password={password} />
            {errorMessage ? (
              <p aria-live="polite" className="text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button
              className="w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Activando…" : "Activar cuenta"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
