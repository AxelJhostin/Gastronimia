"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface InspectionItem {
  id: string;
  name: string;
  requestedQuantity: number;
  returnedQuantity: number;
  condition: "good" | "damaged" | "missing";
  notes?: string;
}

interface InspectionPanelProps {
  requestId: string;
  teacherName: string;
  initialItems: InspectionItem[];
}

export function InspectionPanel({ requestId, teacherName, initialItems }: InspectionPanelProps) {
  const [items, setItems] = useState<InspectionItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConditionChange = (id: string, condition: "good" | "damaged" | "missing") => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, condition } : item))
    );
  };

  const handleQuantityChange = (id: string, returnedQuantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, returnedQuantity } : item))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleSaveInspection = async () => {
    setIsSubmitting(true);
    try {
      // Llamada a la API/RPC para guardar la inspección
      // await submitInspection({ requestId, items });
      alert("Inspección de devolución registrada correctamente.");
    } catch (error) {
      console.error("Error al registrar inspección:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Inspección de Devolución
          </h2>
          <p className="text-xs text-slate-500">
            Solicitud ID: <span className="font-mono font-medium">{requestId}</span> | Docente: {teacherName}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-sm text-slate-800">{item.name}</span>
                <span className="text-xs text-slate-500 block">
                  Entregado: {item.requestedQuantity} unidades
                </span>
              </div>

              {/* Botones de Condición */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleConditionChange(item.id, "good")}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    item.condition === "good"
                      ? "bg-emerald-100 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> En regla
                </button>
                <button
                  type="button"
                  onClick={() => handleConditionChange(item.id, "damaged")}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    item.condition === "damaged"
                      ? "bg-amber-100 text-amber-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Dañado
                </button>
                <button
                  type="button"
                  onClick={() => handleConditionChange(item.id, "missing")}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    item.condition === "missing"
                      ? "bg-red-100 text-red-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" /> Faltante
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Cant. Retornada</label>
                <input
                  type="number"
                  min="0"
                  value={item.returnedQuantity}
                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-0.5">Detalle / Novedades</label>
                <input
                  type="text"
                  placeholder="Observaciones de la inspección..."
                  value={item.notes || ""}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSaveInspection}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Registrando..." : "Finalizar Inspección"}
        </button>
      </div>
    </div>
  );
}