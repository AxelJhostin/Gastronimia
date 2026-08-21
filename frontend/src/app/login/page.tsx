import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Gastronomía
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Accede con la cuenta proporcionada por la institución.
        </p>
        <LoginForm />
        <Link className="mt-6 inline-block text-sm text-amber-800 underline" href="/">
          Volver a la portada
        </Link>
      </section>
    </main>
  );
}
