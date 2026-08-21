'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';
import { inventarioService } from '@/services/inventario.service';
import { OrdenCompraItem } from '@/types/compras';

interface OrdenCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrdenCompraModal({ isOpen, onClose }: OrdenCompraModalProps) {
  const queryClient = useQueryClient();

  const [proveedorId, setProveedorId] = useState('');
  const [items, setItems] = useState<OrdenCompraItem[]>([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);

  // Cargar lista de proveedores
  const { data: proveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => comprasService.getProveedores(),
  });

  // Cargar insumos para seleccionar los ítems de la compra
  const { data: insumos } = useQuery({
    queryKey: ['insumos'],
    queryFn: () => inventarioService.getInsumos(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => comprasService.crearOrdenCompra(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenesCompra'] });
      onClose();
      setProveedorId('');
      setItems([]);
    },
  });

  if (!isOpen) return null;

  const handleAgregarItem = () => {
    if (!insumoSeleccionado || cantidad <= 0 || precioUnitario <= 0) return;

    const insumo = insumos?.find((i) => i.id === insumoSeleccionado);
    if (!insumo) return;

    const nuevoItem: OrdenCompraItem = {
      insumoId: insumo.id,
      nombreInsumo: insumo.nombre,
      cantidad,
      precioUnitario,
    };

    setItems([...items, nuevoItem]);
    setInsumoSeleccionado('');
    setCantidad(1);
    setPrecioUnitario(0);
  };

  const handleEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCalculado = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId || items.length === 0) return;

    const prov = proveedores?.find((p) => p.id === proveedorId);

    mutation.mutate({
      proveedorId,
      proveedorNombre: prov?.nombre || 'Proveedor',
      items,
      total: totalCalculado,
      fechaEmision: new Date().toISOString().split('T')[0],
      estado: 'Recibida',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Registrar Nueva Compra / Orden</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Proveedor</label>
            <select
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
            >
              <option value="">Seleccione un proveedor...</option>
              {proveedores?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.rnc})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-b border-slate-200 py-4 my-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Agregar Insumos a la Compra</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-2">
                <select
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={insumoSeleccionado}
                  onChange={(e) => {
                    setInsumoSeleccionado(e.target.value);
                    const ins = insumos?.find((i) => i.id === e.target.value);
                    if (ins) {
                      const itemPrecio =
                        (ins as any).costoUnitario ??
                        (ins as any).costo ??
                        (ins as any).precio ??
                        0;
                      setPrecioUnitario(itemPrecio);
                    }
                  }}
                >
                  <option value="">Seleccionar Insumo...</option>
                  {insumos?.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidadMedida})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  placeholder="Cantidad"
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio Unit."
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAgregarItem}
              className="w-full rounded-md bg-slate-800 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              + Añadir Insumo
            </button>
          </div>

          {/* Tabla de Items añadidos */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">Detalle de la Compra</h4>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2">Insumo</th>
                      <th className="px-3 py-2">Cant.</th>
                      <th className="px-3 py-2">Precio U.</th>
                      <th className="px-3 py-2">Subtotal</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">{item.nombreInsumo}</td>
                        <td className="px-3 py-2">{item.cantidad}</td>
                        <td className="px-3 py-2">${item.precioUnitario.toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold">
                          ${(item.cantidad * item.precioUnitario).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleEliminarItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right text-sm font-bold text-slate-900 pt-1">
                Total Compra: ${totalCalculado.toFixed(2)}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || items.length === 0 || !proveedorId}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}