"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({ cancelLabel = "Cancelar", confirmLabel = "Confirmar", description, isOpen, onClose, onConfirm, title }: { cancelLabel?: string; confirmLabel?: string; description: string; isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (isOpen && !dialog.open) dialog.showModal(); if (!isOpen && dialog.open) dialog.close(); }, [isOpen]);
  return <dialog aria-describedby="confirm-dialog-description" aria-labelledby="confirm-dialog-title" className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gastro-outline-variant bg-white p-0 text-gastro-primary shadow-xl backdrop:bg-gastro-primary/40" onClose={onClose} ref={dialogRef}><div className="p-6"><h2 className="text-xl font-semibold" id="confirm-dialog-title">{title}</h2><p className="mt-3 text-sm leading-6 text-gastro-muted" id="confirm-dialog-description">{description}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button onClick={onClose} variant="secondary">{cancelLabel}</Button><Button onClick={onConfirm} variant="danger">{confirmLabel}</Button></div></div></dialog>;
}
