"use client";

import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  title: string;
  description: string;
  type?: "confirm" | "incident";
  isSubmitting?: boolean;
  confirmLabel?: string;
  tone?: "positive" | "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = "confirm",
  isSubmitting = false,
  confirmLabel = "Confirmar acción",
  tone = "positive",
}: ConfirmModalProps) {
  const [incidentNotes, setIncidentNotes] = useState("");
  const titleId = useId();
  const descriptionId = useId();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div aria-describedby={descriptionId} aria-labelledby={titleId} aria-modal="true" className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" role="dialog">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {type === "incident" ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            <h3 className="text-sm font-bold text-slate-900" id={titleId}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            aria-label="Cerrar confirmación"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed" id={descriptionId}>{description}</p>

          {type === "incident" && (
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Detalle técnico del incidente / justificación
              </label>
              <textarea
                rows={3}
                placeholder="Escribe el motivo del reporte o descripción del daño..."
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-3 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(incidentNotes)}
            className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${tone === "danger" ? "bg-red-700 hover:bg-red-800" : tone === "warning" || type === "incident" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isSubmitting ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
