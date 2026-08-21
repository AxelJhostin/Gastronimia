'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';
import { CrearInsumoDTO } from '@/types/inventario';

interface InsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InsumoModal({ isOpen, onClose }: InsumoModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CrearInsumoDTO>({
    codigo: '',
    nombre: '',
    categoria: 'Otros',
    unidadMedida: 'Kg',
    stockActual: 0,
    stockMinimo: 0,
    precioUnitario: 0,
  });

  const mutation = useMutation({
    mutationFn: (data: CrearInsumoDTO) => inventarioService.crearInsumo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      onClose();
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'Otros',
        unidadMedida: 'Kg',
        stockActual: 0,
        stockMinimo: 0,
        precioUnitario: 0,
      });
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Nuevo Insumo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Código</label>
              <input
                type="text"
                required
                placeholder="INS-003"
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Categoría</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none bg-white"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
              >
                <option value="Lácteos">Lácteos</option>
                <option value="Carnes">Carnes</option>
                <option value="Verduras">Verduras</option>
                <option value="Granos">Granos</option>
                <option value="Especias">Especias</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre del Insumo</label>
            <input
              type="text"
              required
              placeholder="Ej: Aceite de Oliva"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Unidad de Medida</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none bg-white"
                value={formData.unidadMedida}
                onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value as any })}
              >
                <option value="Kg">Kg</option>
                <option value="L">L</option>
                <option value="Unidad">Unidad</option>
                <option value="Gramos">Gramos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Precio Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.precioUnitario}
                onChange={(e) => setFormData({ ...formData, precioUnitario: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Stock Inicial</label>
              <input
                type="number"
                required
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.stockActual}
                onChange={(e) => setFormData({ ...formData, stockActual: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Stock Mínimo</label>
              <input
                type="number"
                required
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}