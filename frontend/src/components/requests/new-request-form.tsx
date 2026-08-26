'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  available_quantity: number;
}

interface NewRequestFormProps {
  items: InventoryItem[];
  userId: string;
}

export function NewRequestForm({ items, userId }: NewRequestFormProps) {
  const [title, setTitle] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [requestItems, setRequestItems] = useState<{ itemId: string; name: string; quantity: number }[]>([]);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const supabase = createClient();

  const handleAddItem = () => {
    if (!selectedItemId) return;

    const foundItem = items.find((i) => i.id === selectedItemId);
    if (!foundItem) return;

    if (quantity > foundItem.available_quantity) {
      setErrorMessage(`Solo hay ${foundItem.available_quantity} unidades disponibles de ${foundItem.name}.`);
      return;
    }

    setErrorMessage(null);
    setRequestItems((prev) => [
      ...prev,
      { itemId: foundItem.id, name: foundItem.name, quantity },
    ]);

    setSelectedItemId("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setRequestItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (requestItems.length === 0) {
      setErrorMessage("Debes agregar al menos un ítem a la solicitud.");
      return;
    }

    startTransition(async () => {
      // 1. Insertar la solicitud principal
      const { data: request, error: reqError } = await supabase
        .from("requests")
        .insert({
          user_id: userId,
          title,
          needed_date: neededDate,
          notes,
          status: "PENDING",
        })
        .select("id")
        .single();

      if (reqError || !request) {
        setErrorMessage(reqError?.message || "Error al guardar la solicitud.");
        return;
      }

      // 2. Insertar los ítems asociados a la solicitud
      const itemsToInsert = requestItems.map((item) => ({
        request_id: request.id,
        item_id: item.itemId,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("request_items")
        .insert(itemsToInsert);

      if (itemsError) {
        setErrorMessage(itemsError.message);
        return;
      }

      router.push("/dashboard/requests");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Asunto / Nombre de la Práctica
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Práctica Pastelería I"
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 focus:border-amber-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Fecha Requerida
        </label>
        <input
          type="date"
          required
          value={neededDate}
          onChange={(e) => setNeededDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 focus:border-amber-600 focus:outline-none"
        />
      </div>

      {/* Agregar Ítems */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Agregar Ítems del Pañol
        </label>
        
        <div className="flex gap-2">
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="flex-1 rounded-lg border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none bg-white"
          >
            <option value="">-- Selecciona un equipo o insumo --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (Disp: {item.available_quantity})
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-20 rounded-lg border border-stone-300 p-2 text-xs text-center focus:border-amber-600 focus:outline-none bg-white"
          />

          <button
            type="button"
            onClick={handleAddItem}
            className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-900 transition-colors"
          >
            ＋ Añadir
          </button>
        </div>

        {/* Lista de ítems agregados */}
        {requestItems.length > 0 && (
          <ul className="mt-3 divide-y divide-stone-200 border-t border-stone-200 pt-2">
            {requestItems.map((item, index) => (
              <li key={index} className="flex justify-between items-center py-1.5 text-xs">
                <span>
                  <strong>{item.quantity}x</strong> {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 font-semibold text-xs"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Observaciones
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Indicaciones adicionales para el pañolero..."
          className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Enviando Solicitud..." : "Crear Solicitud"}
      </button>
    </form>
  );
}