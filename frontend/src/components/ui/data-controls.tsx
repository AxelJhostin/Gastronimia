import type { ChangeEventHandler, SelectHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/cn";

export function SearchField({
  label = "Buscar",
  onChange,
  placeholder = "Buscar…",
  value,
}: {
  label?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  value?: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-gastro-muted">⌕</span>
      <input className="w-full rounded-lg border border-gastro-outline-variant bg-white py-2.5 pl-10 pr-3 text-sm text-gastro-primary outline-none transition-colors placeholder:text-gastro-muted focus:border-gastro-action focus:ring-2 focus:ring-gastro-action/20" onChange={onChange} placeholder={placeholder} type="search" value={value} />
    </label>
  );
}

export function FilterSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select className={cn("min-w-40", className)} {...props}>{children}</Select>;
}

export function Pagination({
  currentPage,
  onPageChange,
  totalPages,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}) {
  if (totalPages < 2) return null;
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      <Button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} size="sm" variant="secondary">Anterior</Button>
      <p aria-live="polite" className="text-sm text-gastro-muted">Página {currentPage} de {totalPages}</p>
      <Button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} size="sm" variant="secondary">Siguiente</Button>
    </nav>
  );
}
