'use client';

import { useEffect, useState } from 'react';
import {
  inventoryApi,
  InventoryItem,
  UnitOfMeasure,
  InventoryMovement,
} from '@/lib/api/inventory';

export default function AdminInventarioPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'units' | 'kardex'>('items');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Formularios
  const [itemForm, setItemForm] = useState<InventoryItem>({
    sku: '',
    name: '',
    type: 'QUANTITY',
    unit_id: '',
    min_stock: 0,
  });

  const [unitForm, setUnitForm] = useState<UnitOfMeasure>({ code: '', name: '' });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [iData, uData, mData] = await Promise.all([
        inventoryApi.getItems(),
        inventoryApi.getUnits(),
        inventoryApi.getMovements(),
      ]);
      setItems(iData);
      setUnits(uData);
      setMovements(mData);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryApi.createItem({
        ...itemForm,
        unit_id: itemForm.type === 'QUANTITY' ? itemForm.unit_id : undefined,
      });
      setItemForm({ sku: '', name: '', type: 'QUANTITY', unit_id: '', min_stock: 0 });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryApi.createUnit(unitForm);
      setUnitForm({ code: '', name: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Gestión de Inventario y Catálogos</h1>
        <p className="text-sm text-stone-500">Administra insumos a granel, equipos/utensilios únicos y unidades de medida.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-2 ${activeTab === 'items' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Artículos
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-2 ${activeTab === 'units' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Unidades de Medida
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`pb-2 ${activeTab === 'kardex' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Kardex / Movimientos
        </button>
      </div>

      {/* Tab Artículos */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateItem} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm">
            <h3 className="font-bold text-stone-800">Nuevo Artículo</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">SKU / Código</label>
              <input
                type="text"
                required
                value={itemForm.sku}
                onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: HAR-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nombre</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: Harina de Trigo Tipo 00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tipo de Control</label>
              <select
                value={itemForm.type}
                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as any })}
                className="w-full border rounded-lg p-2"
              >
                <option value="QUANTITY">Por Cantidad / Granel (Insumos)</option>
                <option value="INDIVIDUAL">Por Activo Individual (Equipos/Utensilios)</option>
              </select>
            </div>

            {itemForm.type === 'QUANTITY' && (
              <div>
                <label className="block text-xs font-semibold mb-1">Unidad de Medida</label>
                <select
                  required
                  value={itemForm.unit_id}
                  onChange={(e) => setItemForm({ ...itemForm, unit_id: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">-- Seleccionar --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={itemForm.min_stock}
                onChange={(e) => setItemForm({ ...itemForm, min_stock: Number(e.target.value) })}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white py-2 rounded-lg font-semibold hover:bg-amber-800"
            >
              Guardar Artículo
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Stock Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-semibold">{item.sku}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${item.type === 'QUANTITY' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {item.type === 'QUANTITY' ? 'Cantidad' : 'Individual'}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{item.current_stock ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Unidades */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateUnit} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm">
            <h3 className="font-bold text-stone-800">Nueva Unidad de Medida</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Código / Símbolo</label>
              <input
                type="text"
                required
                value={unitForm.code}
                onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: KG, L, UN"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nombre</label>
              <input
                type="text"
                required
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: Kilogramos, Litros"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white py-2 rounded-lg font-semibold hover:bg-amber-800"
            >
              Guardar Unidad
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {units.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-semibold">{u.code}</td>
                    <td className="p-3">{u.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Kardex */}
      {activeTab === 'kardex' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Item ID</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 text-xs text-stone-500">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{m.item_id}</td>
                  <td className="p-3 font-semibold text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${m.movement_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{m.quantity}</td>
                  <td className="p-3 text-stone-600">{m.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}