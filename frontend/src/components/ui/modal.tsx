"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  children,
  description,
  isOpen,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      aria-describedby={description ? "modal-description" : undefined}
      aria-labelledby="modal-title"
      className="w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-gastro-outline-variant bg-white p-0 text-gastro-primary shadow-xl backdrop:bg-gastro-primary/40"
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold" id="modal-title">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-gastro-muted" id="modal-description">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}
