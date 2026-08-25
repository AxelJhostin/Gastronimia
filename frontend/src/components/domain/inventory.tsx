import type { ReactNode } from "react";

import { Badge, Button, SearchField } from "@/components/ui";
import { cn } from "@/lib/cn";

export type InventoryUnitState = "AVAILABLE" | "RESERVED" | "MAINTENANCE";

const stateConfig: Record<InventoryUnitState, { label: string; track: string; badge: "success" | "warning" | "danger" }> = {
  AVAILABLE: { label: "Disponibles", track: "bg-emerald-100", badge: "success" },
  RESERVED: { label: "En uso / reservados", track: "bg-amber-100", badge: "warning" },
  MAINTENANCE: { label: "En mantenimiento", track: "bg-gastro-error-container", badge: "danger" },
};

export function UnitStatusSummary({ states, title = "Estado de unidades" }: { states: Partial<Record<InventoryUnitState, number>>; title?: string }) {
  const total = Object.values(states).reduce((sum, value) => sum + (value ?? 0), 0);
  return <section className="rounded-2xl border border-gastro-outline-variant bg-white p-5 shadow-gastro-sm"><h2 className="border-b border-gastro-outline-variant pb-3 text-xl font-semibold text-gastro-primary">{title}</h2><div className="mt-5 space-y-5">{(Object.keys(stateConfig) as InventoryUnitState[]).map((state) => { const value = states[state] ?? 0; const width = total ? Math.round((value / total) * 100) : 0; const config = stateConfig[state]; return <div key={state}><div className="flex items-center justify-between gap-3"><span className="text-base text-gastro-muted">{config.label}</span><strong className="text-2xl text-gastro-primary">{value}</strong></div><div aria-label={`${config.label}: ${value} de ${total}`} aria-valuemax={total} aria-valuemin={0} aria-valuenow={value} className="mt-2 h-3 overflow-hidden rounded-full bg-gastro-surface-high" role="progressbar"><div className={cn("h-full rounded-full", config.track)} style={{ width: `${width}%` }} /></div></div>; })}</div></section>;
}

export function InventoryItemCard({ assetCode, category, condition, imageAlt, imageUrl, name, quantityLabel, status, trackingLabel }: { assetCode: string; category: string; condition: string; imageAlt?: string; imageUrl?: string; name: string; quantityLabel: string; status: InventoryUnitState; trackingLabel: string }) {
  const config = stateConfig[status];
  return <article className="overflow-hidden rounded-xl border border-gastro-outline-variant bg-white shadow-gastro-sm"><div className="relative aspect-[16/10] bg-gastro-surface-low">{imageUrl ? (
    // Signed Storage URLs are dynamic; configuring every possible host for next/image is not safe here.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={imageAlt ?? name} className="size-full object-cover" src={imageUrl} />
  ) : <div aria-hidden="true" className="grid size-full place-items-center text-4xl text-gastro-outline-variant">▧</div>}<Badge className="absolute right-3 top-3" tone={config.badge}>{config.label.slice(0, 1).toUpperCase() + config.label.slice(1)}</Badge></div><div className="p-5"><div className="flex items-center justify-between gap-3 font-mono text-xs text-gastro-muted"><span>{assetCode}</span><span>{trackingLabel}</span></div><h3 className="mt-3 text-xl font-semibold leading-7 text-gastro-primary">{name}</h3><p className="mt-2 text-sm text-gastro-muted">{category}</p><div className="mt-5 flex items-end justify-between gap-4 border-t border-gastro-outline-variant pt-4 text-sm"><p className={cn("font-semibold", status === "MAINTENANCE" ? "text-gastro-error-strong" : "text-gastro-muted")}>Condición: {condition}</p><strong className="text-right text-gastro-primary">{quantityLabel}</strong></div></div></article>;
}

export function InventoryToolbar({ actions, children, onSearchChange, searchValue }: { actions?: ReactNode; children?: ReactNode; onSearchChange?: (value: string) => void; searchValue?: string }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-gastro-outline-variant bg-white p-4 shadow-gastro-sm lg:flex-row lg:items-center"><SearchField onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Buscar por nombre o ID…" value={searchValue} /><div className="flex flex-wrap gap-3">{children}</div>{actions ? <div className="lg:ml-auto">{actions}</div> : null}</div>;
}

export function InventoryPrimaryAction({ onClick }: { onClick?: () => void }) {
  return <Button onClick={onClick}>＋ Nuevo ítem</Button>;
}
