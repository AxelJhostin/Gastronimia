'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { academiaService } from '@/services/academia.service';
import { CrearAsignaturaDTO } from '@/types/academia';

interface AsignaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignaturaModal({ isOpen, onClose }: AsignaturaModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CrearAsignaturaDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    creditos: 0,
  });

  const mutation = useMutation({
    mutationFn: (data: CrearAsignaturaDTO) => academiaService.crearAsignatura(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaturas'] });
      onClose();
      setFormData({ codigo: '', nombre: '', descripcion: '', creditos: 0 });
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
        <h2 className="mb-4 text-xl font-bold text-slate-900">Nueva Asignatura</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Código</label>
            <input
              type="text"
              required
              placeholder="Ej: GAS-101"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej: Técnicas Culinarias I"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Horas / Créditos</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.creditos}
              onChange={(e) => setFormData({ ...formData, creditos: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
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
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}