"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const controlClassName = "w-full rounded-lg border border-gastro-outline bg-white px-3 py-2.5 text-sm text-gastro-primary shadow-sm outline-none transition-colors placeholder:text-gastro-muted focus:border-gastro-action focus:ring-2 focus:ring-gastro-action/20 disabled:cursor-not-allowed disabled:bg-gastro-surface-low";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input className={cn(controlClassName, className)} ref={ref} {...props} />;
});

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);
    const label = isVisible ? "Ocultar contraseña" : "Mostrar contraseña";

    return (
      <div className="relative">
        <input {...props} className={cn(controlClassName, "pr-11", className)} ref={ref} type={isVisible ? "text" : "password"} />
        <button
          aria-label={label}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-gastro-muted hover:text-gastro-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gastro-action"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          <EyeIcon isVisible={isVisible} />
        </button>
      </div>
    );
  },
);

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      {isVisible ? <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.8" /> : null}
    </svg>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ["Sin evaluar", "Baja", "Media", "Buena", "Alta"];
  const colors = ["bg-gastro-surface-high", "bg-gastro-error", "bg-amber-500", "bg-gastro-action", "bg-emerald-600"];

  return (
    <div aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.08em] text-gastro-muted">Nivel de seguridad</span>
        <span className="font-medium text-gastro-primary">{labels[score]}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1" role="progressbar" aria-label={`Nivel de seguridad: ${labels[score]}`} aria-valuemax={4} aria-valuemin={0} aria-valuenow={score}>
        {[1, 2, 3, 4].map((level) => <span className={cn("h-1.5 rounded-full", level <= score ? colors[score] : "bg-gastro-surface-high")} key={level} />)}
      </div>
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea className={cn(controlClassName, "min-h-28 resize-y", className)} ref={ref} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select className={cn(controlClassName, className)} ref={ref} {...props} />;
});

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("size-4 rounded border-gastro-outline text-gastro-action focus:ring-2 focus:ring-gastro-action/20", className)} type="checkbox" {...props} />;
}

export function Field({ children, description, error, htmlFor, label, required }: { children: ReactNode; description?: string; error?: string; htmlFor: string; label: string; required?: boolean }) {
  return <div className="space-y-2">
    <label className="block text-sm font-semibold text-gastro-primary" htmlFor={htmlFor}>{label}{required ? <span aria-hidden="true" className="ml-1 text-gastro-error">*</span> : null}</label>
    {children}
    {description ? <p className="text-sm text-gastro-muted">{description}</p> : null}
    {error ? <p className="text-sm text-gastro-error" role="alert">{error}</p> : null}
  </div>;
}
