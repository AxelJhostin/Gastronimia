'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';
import { CrearInsumoDTO } from '@/types/inventario';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function InsumoModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CrearInsumoDTO>({
    nombre: '',
    categoria: 'Lácteos',
    stockActual: 0,
    stockMinimo: 0,
    unidadMedida: 'Kg',
    ubicacion: '',
  });

  const mutation = useMutation({
    mutationFn: inventarioService.crearInsumo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      onClose();
      setFormData({
        nombre: '',
        categoria: 'Lácteos',
        stockActual: 0,
        stockMinimo: 0,
        unidadMedida: 'Kg',
        ubicacion: '',
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
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Agregar Nuevo Insumo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre del Insumo</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Harina de Trigo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full rounded-lg border p-2 text-slate-900"
              >
                <option value="Lácteos">Lácteos</option>
                <option value="Carnes">Carnes</option>
                <option value="Granos y Harinas">Granos y Harinas</option>
                <option value="Verduras">Verduras</option>
                <option value="Licores">Licores</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unidad de Medida</label>
              <select
                value={formData.unidadMedida}
                onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                className="w-full rounded-lg border p-2 text-slate-900"
              >
                <option value="Kg">Kg</option>
                <option value="L">Litros</option>
                <option value="Unidad">Unidad</option>
                <option value="Gramos">Gramos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Inicial</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={formData.stockActual}
                onChange={(e) => setFormData({ ...formData, stockActual: Number(e.target.value) })}
                className="w-full rounded-lg border p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: Number(e.target.value) })}
                className="w-full rounded-lg border p-2 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ubicación en Almacén</label>
            <input
              type="text"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Estante B2"
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
              {mutation.isPending ? 'Guardando...' : 'Guardar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}