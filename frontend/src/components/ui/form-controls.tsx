import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const controlClassName = "w-full rounded-lg border border-gastro-outline bg-white px-3 py-2.5 text-sm text-gastro-primary shadow-sm outline-none transition-colors placeholder:text-gastro-muted focus:border-gastro-action focus:ring-2 focus:ring-gastro-action/20 disabled:cursor-not-allowed disabled:bg-gastro-surface-low";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input className={cn(controlClassName, className)} ref={ref} {...props} />;
});

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
