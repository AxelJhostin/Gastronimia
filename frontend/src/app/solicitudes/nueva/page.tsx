'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, CourseSection } from '@/lib/api/admin';
import { inventoryApi, InventoryItem } from '@/lib/api/inventory';
import { requestsApi, RequestItemPayload } from '@/lib/api/requests';

export default function NuevaSolicitudPage() {
  const router = useRouter();

  const [sections, setSections] = useState<CourseSection[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [sectionId, setSectionId] = useState('');
  const [usageDate, setUsageDate] = useState('');
  const [notes, setNotes] = useState('');

  // Ítems agregados a la solicitud
  const [selectedItems, setSelectedItems] = useState<{ item_id: string; quantity: number }[]>([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const [secData, itemData] = await Promise.all([
          adminApi.getSections(),
          inventoryApi.getItems(),
        ]);
        setSections(secData);
        setItems(itemData);
      } catch (err: any) {
        console.error('Error cargando catálogos:', err.message);
      }
    }
    initData();
  }, []);

  const handleAddItem = () => {
    if (!currentItemId || currentQty <= 0) return;

    // Verificar si ya está en la lista para sumar cantidad
    const existingIndex = selectedItems.findIndex((i) => i.item_id === currentItemId);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += currentQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { item_id: currentItemId, quantity: currentQty }]);
    }

    setCurrentItemId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.item_id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Debes agregar al menos un insumo a la solicitud.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        section_id: sectionId,
        usage_date: usageDate,
        notes: notes.trim() || undefined,
        items: selectedItems.map((i) => ({
          item_id: i.item_id,
          requested_quantity: i.quantity,
        })),
      };

      await requestsApi.createRequest(payload);
      router.push('/solicitudes/mis-solicitudes');
    } catch (err: any) {
      alert(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Nueva Solicitud de Insumos</h1>
        <p className="text-sm text-stone-500">Programa los insumos requeridos para tu clase o taller de cocina.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Sección / Curso</label>
            <select
              required
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-stone-800"
            >
              <option value="">-- Seleccionar Sección --</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Fecha Requerida de Uso</label>
            <input
              type="date"
              required
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              className="w-full border rounded-lg p-2 text-stone-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-stone-700">Observaciones / Notas (Opcional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm text-stone-800"
            placeholder="Especificaciones de la receta o uso..."
          />
        </div>

        <hr className="border-stone-200" />

        {/* Añadir Insumos */}
        <div className="space-y-3">
          <h3 className="font-bold text-stone-800 text-sm">Selección de Insumos</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1 text-stone-600">Artículo / Insumo</label>
              <select
                value={currentItemId}
                onChange={(e) => setCurrentItemId(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm text-stone-800"
              >
                <option value="">-- Buscar Insumo --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label className="block text-xs font-semibold mb-1 text-stone-600">Cantidad</label>
              <input
                type="number"
                min="1"
                value={currentQty}
                onChange={(e) => setCurrentQty(Number(e.target.value))}
                className="w-full border rounded-lg p-2 text-sm text-stone-800"
              />
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-900"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Tabla de ítems seleccionados */}
        <div className="border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs text-stone-600 uppercase">
              <tr>
                <th className="p-3">Insumo</th>
                <th className="p-3">Cantidad Requerida</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {selectedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-stone-500 text-xs">
                    Ningún insumo seleccionado todavía.
                  </td>
                </tr>
              ) : (
                selectedItems.map((si) => {
                  const itemInfo = items.find((i) => i.id === si.item_id);
                  return (
                    <tr key={si.item_id}>
                      <td className="p-3 font-medium text-stone-900">{itemInfo?.name || si.item_id}</td>
                      <td className="p-3 font-semibold text-stone-800">{si.quantity}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(si.item_id)}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="w-full bg-amber-700 text-white py-3 rounded-xl font-semibold hover:bg-amber-800 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Confirmar y Enviar Solicitud'}
        </button>
      </form>
    </div>
  );
}