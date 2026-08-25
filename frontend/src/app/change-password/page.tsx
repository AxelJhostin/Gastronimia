"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { completeTemporaryPasswordChange } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput, PasswordStrength } from "@/components/ui";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedPassword = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (submittedPassword.length < 8 || submittedPassword !== confirmation) {
      setErrorMessage("Usa al menos 8 caracteres y confirma la misma contraseña.");
      return;
    }
    setIsSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({ password: submittedPassword });
    if (error || !data.user) {
      setErrorMessage("No fue posible cambiar la contraseña.");
      setIsSubmitting(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setErrorMessage("Tu sesión expiró. Inicia sesión nuevamente.");
      setIsSubmitting(false);
      return;
    }
    try {
      await completeTemporaryPasswordChange(sessionData.session.access_token);
      await supabase.auth.refreshSession();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("La contraseña cambió, pero no fue posible finalizar la activación.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <form className="w-full max-w-md space-y-5 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-semibold tracking-tight">Cambia tu contraseña temporal</h1>
        <p className="text-sm text-stone-600">Debes definir una contraseña personal antes de continuar.</p>
        <PasswordInput className="w-full" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña" required />
        <PasswordStrength password={password} />
        <PasswordInput className="w-full" minLength={8} name="confirmation" placeholder="Confirmar contraseña" required />
        {errorMessage ? <p className="text-sm text-red-700" role="alert">{errorMessage}</p> : null}
        <button className="w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Guardando…" : "Guardar contraseña"}</button>
      </form>
    </main>
  );
}
