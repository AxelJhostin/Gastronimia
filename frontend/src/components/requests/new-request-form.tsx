"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar, Utensils, Send } from "lucide-react";

interface RequestItemInput {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
}

export function NewRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityDate, setActivityDate] = useState("");
  const [preparationName, setPreparationName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RequestItemInput[]>([
    { inventoryItemId: "", name: "", quantity: 1, unit: "kg" },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { inventoryItemId: "", name: "", quantity: 1, unit: "kg" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof RequestItemInput,
    value: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enviar solicitud a la API / Supabase RPC
      // const response = await createRequest({ activityDate, preparationName, notes, items });
      
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error al crear la solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Nueva Solicitud de Insumos</h2>
        <p className="text-xs text-slate-500">
          Registra los requerimientos para las actividades gastronómicas programadas.
        </p>
      </div>

      {/* Datos Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Utensils className="h-3.5 w-3.5 text-slate-500" />
            Nombre de la Preparación / Taller
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Taller de Panadería Artesanal"
            value={preparationName}
            onChange={(e) => setPreparationName(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Fecha de Requerimiento
          </label>
          <input
            type="date"
            required
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Listado Dinámico de Insumos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Insumos y Equipos Requeridos</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" /> Agregar Ítem
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <input
              type="text"
              placeholder="Nombre del ingrediente o equipo"
              required
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
              className="flex-1 text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="number"
              min="0.1"
              step="any"
              required
              placeholder="Cant."
              value={item.quantity}
              onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
              className="w-24 text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <select
              value={item.unit}
              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
              className="w-28 text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">litros</option>
              <option value="ml">ml</option>
              <option value="unidades">unidades</option>
            </select>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Notas adicionales */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Observaciones adicionales
        </label>
        <textarea
          rows={3}
          placeholder="Indicaciones especiales de almacenamiento o manipulación..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {loading ? "Guardando..." : "Enviar Solicitud"}
        </button>
      </div>
    </form>
  );
}