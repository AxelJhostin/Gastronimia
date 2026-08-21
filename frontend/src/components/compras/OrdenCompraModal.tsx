'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OrdenCompraModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [total, setTotal] = useState(0);

  const mutation = useMutation({
    mutationFn: async () => {
      // Petición mock o creación de orden
      await new Promise((res) => setTimeout(res, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenesCompra'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Nueva Orden de Compra</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 text-xs sm:text-sm"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre del Proveedor</label>
            <input
              type="text"
              required
              value={proveedorNombre}
              onChange={(e) => setProveedorNombre(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Distribuidora Central"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monto Total Estimado ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="w-full rounded-lg border p-2 text-slate-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 border text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-amber-600 px-4 py-2 text-white font-semibold hover:bg-amber-700 disabled:bg-slate-400"
            >
              {mutation.isPending ? 'Creando...' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}