"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { EmailIcon, InputWithIcon, PasswordInput } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("No fue posible iniciar sesión. Revisa tus credenciales.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-stone-700" htmlFor="email">
        Correo institucional
        <InputWithIcon
          autoComplete="email"
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
          id="email"
          icon={<EmailIcon />}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block text-sm font-medium text-stone-700" htmlFor="password">
        Contraseña
        <PasswordInput
          autoComplete="current-password"
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-600 focus:ring-2"
          id="password"
          name="password"
          required
        />
      </label>
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
        {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
