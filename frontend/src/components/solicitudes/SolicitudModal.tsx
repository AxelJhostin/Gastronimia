'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesService } from '@/services/solicitudes.service';
import { CrearSolicitudDTO } from '@/types/solicitudes';

interface SolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SolicitudModal({ isOpen, onClose }: SolicitudModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CrearSolicitudDTO>({
    asignaturaNombre: '',
    solicitante: '',
    fechaRequerida: '',
    observaciones: '',
    items: [{ insumoId: '1', nombreInsumo: 'Harina de Trigo Todo Uso', cantidad: 1, unidadMedida: 'Kg' }],
  });

  const mutation = useMutation({
    mutationFn: (data: CrearSolicitudDTO) => solicitudesService.crearSolicitud(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      onClose();
      setFormData({
        asignaturaNombre: '',
        solicitante: '',
        fechaRequerida: '',
        observaciones: '',
        items: [{ insumoId: '1', nombreInsumo: 'Harina de Trigo Todo Uso', cantidad: 1, unidadMedida: 'Kg' }],
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
        <h2 className="mb-4 text-xl font-bold text-slate-900">Nueva Solicitud de Insumos</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Asignatura</label>
            <input
              type="text"
              required
              placeholder="Ej: Técnicas Culinarias I"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.asignaturaNombre}
              onChange={(e) => setFormData({ ...formData, asignaturaNombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Solicitante (Profesor/Docente)</label>
            <input
              type="text"
              required
              placeholder="Ej: Chef Antonio Silva"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.solicitante}
              onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha Requerida</label>
            <input
              type="date"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.fechaRequerida}
              onChange={(e) => setFormData({ ...formData, fechaRequerida: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Observaciones</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el uso de los insumos"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
              {mutation.isPending ? 'Guardando...' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}