"use client";

import { useState } from "react";
import { 
  PackageCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  ArrowRightLeft 
} from "lucide-react";

export interface InventoryDispatchItem {
  id: string;
  name: string;
  requestedQuantity: number;
  availableStock: number;
  unit: string;
  dispatchQuantity: number;
  condition: "good" | "damaged" | "missing";
  notes?: string;
}

interface DispatchInspectionPanelProps {
  requestId: string;
  teacherName: string;
  activityName: string;
  activityDate: string;
  initialItems: InventoryDispatchItem[];
  mode?: "dispatch" | "return"; // Controla si es entrega o devolución
}

export function DispatchInspectionPanel({
  requestId,
  teacherName,
  activityName,
  activityDate,
  initialItems,
  mode = "dispatch",
}: DispatchInspectionPanelProps) {
  const [items, setItems] = useState<InventoryDispatchItem[]>(initialItems);
  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dispatchQuantity: quantity } : item))
    );
  };

  const handleConditionChange = (id: string, condition: "good" | "damaged" | "missing") => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, condition } : item))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      requestId,
      mode,
      generalNotes,
      items: items.map((item) => ({
        itemId: item.id,
        quantity: item.dispatchQuantity,
        condition: item.condition,
        notes: item.notes || "",
      })),
    };

    try {
      // Llamada al endpoint correspondiente (/api/v1/deliveries o /api/v1/returns)
      console.log("Registrando inspección/despacho:", payload);
      alert(
        mode === "dispatch"
          ? "Entrega autorizada y registrada con éxito."
          : "Devolución e inspección registrada con éxito."
      );
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            {mode === "dispatch" ? (
              <PackageCheck className="h-6 w-6 text-emerald-600" />
            ) : (
              <ArrowRightLeft className="h-6 w-6 text-amber-600" />
            )}
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "dispatch" ? "Panel de Despacho y Entrega" : "Inspección de Devolución"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Solicitud: <span className="font-mono font-semibold">{requestId}</span> | Docente: <span className="font-medium text-slate-700">{teacherName}</span>
          </p>
        </div>

        <div className="text-right sm:text-right">
          <span className="text-xs font-medium text-slate-500 block">Taller / Actividad</span>
          <span className="text-sm font-semibold text-slate-800">{activityName} ({activityDate})</span>
        </div>
      </div>

      {/* Lista de Ítems para Inspección */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-slate-600" />
          Verificación de Materiales e Insumos
        </h3>

        {items.map((item) => {
          const hasStockIssue = mode === "dispatch" && item.dispatchQuantity > item.availableStock;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                hasStockIssue ? "bg-red-50/50 border-red-200" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info del Ítem */}
                <div className="flex-1">
                  <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Solicitado: <strong>{item.requestedQuantity} {item.unit}</strong></span>
                    {mode === "dispatch" && (
                      <span className={item.availableStock < item.requestedQuantity ? "text-amber-600 font-semibold" : ""}>
                        Stock Disponible: {item.availableStock} {item.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selección de Condición */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleConditionChange(item.id, "good")}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      item.condition === "good"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> En Regla
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConditionChange(item.id, "damaged")}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      item.condition === "damaged"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> Dañado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConditionChange(item.id, "missing")}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      item.condition === "missing"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Faltante
                  </button>
                </div>
              </div>

              {/* Cantidades y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {mode === "dispatch" ? "Cantidad a Entregar" : "Cantidad Retornada"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.dispatchQuantity}
                    onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                  {hasStockIssue && (
                    <p className="text-[10px] text-red-600 font-medium mt-1">
                      La cantidad excede el stock actual.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Novedades u Observaciones del Ítem
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Empaque abierto, pieza desgastada..."
                    value={item.notes || ""}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notas Generales */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Observaciones del Almacén / Estado de la Entrega
        </label>
        <textarea
          rows={2}
          placeholder="Comentarios opcionales sobre la entrega o la devolución..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Botón de Acción */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting
            ? "Procesando..."
            : mode === "dispatch"
            ? "Autorizar y Entregar"
            : "Confirmar Devolución"}
        </button>
      </div>
    </form>
  );
}