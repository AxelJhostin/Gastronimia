import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: ReactNode;
};

const tones: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-gastro-error-container bg-gastro-error-container text-gastro-error-strong",
  info: "border-orange-200 bg-orange-50 text-orange-950",
};

export function ToastRegion({
  messages,
  onDismiss,
}: {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-3 sm:left-auto sm:right-4">
      {messages.map((message) => (
        <section className={cn("pointer-events-auto rounded-xl border p-4 shadow-lg", tones[message.tone ?? "info"])} key={message.id} role={message.tone === "error" ? "alert" : "status"}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{message.title}</h2>
              {message.description ? <p className="mt-1 text-sm leading-5">{message.description}</p> : null}
              {message.action ? <div className="mt-3">{message.action}</div> : null}
            </div>
            <button aria-label="Cerrar notificación" className="rounded p-1 text-current hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" onClick={() => onDismiss(message.id)} type="button">×</button>
          </div>
        </section>
      ))}
    </div>
  );
}
