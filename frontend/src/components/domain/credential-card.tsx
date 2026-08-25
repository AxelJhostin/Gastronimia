"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui";

export function CredentialCard({
  email,
  fullName,
  onCopy,
  password,
  roles,
}: {
  email: string;
  fullName: string;
  onCopy?: (message: string) => Promise<void> | void;
  password: string;
  roles: string[];
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function copyCredentials() {
    const message = [
      `Hola ${fullName},`,
      "",
      "Se creó tu cuenta en Gastronomía.",
      `Correo: ${email}`,
      `Contraseña temporal: ${password}`,
      `Roles: ${roles.join(", ")}`,
      "",
      "Inicia sesión y cambia la contraseña temporal antes de continuar.",
    ].join("\n");

    try {
      if (onCopy) {
        await onCopy(message);
      } else {
        await navigator.clipboard.writeText(message);
      }
      setCopyMessage("Credenciales copiadas.");
    } catch {
      setCopyMessage("No fue posible copiar automáticamente. Copia los datos de forma manual.");
    }
  }

  return (
    <Card aria-live="polite" className="border-emerald-200 bg-emerald-50">
      <h2 className="text-lg font-semibold text-emerald-950">Usuario creado correctamente</h2>
      <p className="mt-1 text-sm text-emerald-900">Comparte estas credenciales una sola vez por un canal seguro.</p>
      <dl className="mt-4 space-y-3 rounded-xl bg-white p-4 text-sm text-gastro-primary">
        <div><dt className="font-medium text-gastro-muted">Nombre completo</dt><dd className="mt-1">{fullName}</dd></div>
        <div><dt className="font-medium text-gastro-muted">Correo</dt><dd className="mt-1 break-all font-mono">{email}</dd></div>
        <div><dt className="font-medium text-gastro-muted">Contraseña temporal</dt><dd className="mt-1 flex items-center gap-2"><code className="break-all font-mono">{isPasswordVisible ? password : "••••••••••••"}</code><button aria-label={isPasswordVisible ? "Ocultar contraseña temporal" : "Mostrar contraseña temporal"} className="rounded px-2 py-1 text-xs font-semibold text-gastro-action hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gastro-action" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button">{isPasswordVisible ? "Ocultar" : "Ver"}</button></dd></div>
        <div><dt className="font-medium text-gastro-muted">Roles</dt><dd className="mt-1">{roles.join(", ")}</dd></div>
      </dl>
      <Button className="mt-4" onClick={() => void copyCredentials()} variant="secondary">Copiar credenciales</Button>
      {copyMessage ? <p className="mt-3 text-sm font-medium text-emerald-900" role="status">{copyMessage}</p> : null}
    </Card>
  );
}
