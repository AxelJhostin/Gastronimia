import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "role";
const tones: Record<BadgeTone, string> = { neutral: "bg-gastro-surface-high text-gastro-primary", success: "bg-emerald-100 text-emerald-950", warning: "bg-amber-100 text-amber-950", danger: "bg-gastro-error-container text-gastro-error-strong", info: "bg-orange-100 text-orange-950", role: "bg-gastro-primary text-white" };

export function Badge({ children, className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", tones[tone], className)} {...props}>{children}</span>;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-2xl border border-gastro-outline-variant bg-white p-5 shadow-gastro-sm", className)} {...props} />;
}

export function PageHeader({ actions, eyebrow, title, description }: { actions?: ReactNode; eyebrow?: string; title: string; description?: string }) {
  return <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div>{eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-gastro-action">{eyebrow}</p> : null}<h1 className="mt-2 text-3xl font-semibold tracking-tight text-gastro-primary sm:text-4xl">{title}</h1>{description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-gastro-muted">{description}</p> : null}</div>{actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}</header>;
}

type FeedbackProps = { title: string; description: string; action?: ReactNode; className?: string };
export function EmptyState({ title, description, action, className }: FeedbackProps) {
  return <section className={cn("flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-gastro-outline-variant bg-white px-6 py-10 text-center", className)}><span aria-hidden="true" className="mb-4 grid size-12 place-items-center rounded-full bg-gastro-surface-low text-2xl text-gastro-muted">⌕</span><h2 className="text-xl font-semibold text-gastro-primary">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-gastro-muted">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</section>;
}
export function ErrorState({ title, description, action, className }: FeedbackProps) {
  return <section className={cn("rounded-2xl border border-gastro-error-container bg-gastro-error-container px-5 py-6", className)} role="alert"><h2 className="text-lg font-semibold text-gastro-error-strong">{title}</h2><p className="mt-2 text-sm leading-6 text-gastro-error-strong">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</section>;
}
export function LoadingState({ label = "Cargando información…" }: { label?: string }) {
  return <div aria-busy="true" aria-live="polite" className="space-y-3"><span className="sr-only">{label}</span><div className="h-6 w-48 animate-pulse rounded bg-gastro-surface-high" /><div className="h-24 animate-pulse rounded-xl bg-gastro-surface-low" /><div className="h-24 animate-pulse rounded-xl bg-gastro-surface-low" /></div>;
}
export function PermissionDenied({ onBack, title = "No tienes permiso para ver esta sección", description = "Tu rol actual no tiene acceso a esta operación. Si crees que es un error, comunícate con un administrador." }: { onBack?: () => void; title?: string; description?: string }) {
  return <section className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-gastro-error-container bg-white px-6 py-12 text-center"><span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-gastro-error-container text-2xl text-gastro-error-strong">!</span><h1 className="mt-5 text-2xl font-semibold text-gastro-primary">{title}</h1><p className="mt-3 text-sm leading-6 text-gastro-muted">{description}</p>{onBack ? <Button className="mt-6" onClick={onBack} variant="secondary">Volver</Button> : null}</section>;
}

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("overflow-x-auto rounded-2xl border border-gastro-outline-variant bg-white", className)} {...props} />; }
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn("w-full min-w-[42rem] border-collapse text-left text-sm", className)} {...props} />; }
export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead className={cn("border-b border-gastro-outline-variant bg-gastro-surface-low text-xs font-bold uppercase tracking-[0.08em] text-gastro-primary", className)} {...props} />; }
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn("border-b border-gastro-outline-variant last:border-b-0", className)} {...props} />; }
export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) { return <td className={cn("px-5 py-4 align-middle text-gastro-primary", className)} {...props} />; }
