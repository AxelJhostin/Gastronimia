'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SolicitudModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [asignatura, setAsignatura] = useState('');
  const [fechaRequerida, setFechaRequerida] = useState('');
  const [detalles, setDetalles] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((res) => setTimeout(res, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      onClose();
      setAsignatura('');
      setFechaRequerida('');
      setDetalles('');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Nueva Solicitud de Insumos</h3>
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
            <label className="block font-semibold text-slate-700 mb-1">Asignatura / Taller</label>
            <input
              type="text"
              required
              value={asignatura}
              onChange={(e) => setAsignatura(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Cocina Internacional I"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fecha Requerida</label>
            <input
              type="date"
              required
              value={fechaRequerida}
              onChange={(e) => setFechaRequerida(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detalle de Insumos Requeridos</label>
            <textarea
              rows={3}
              required
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: 2 Kg Harina de Trigo, 1 Litro Leche Entera, 500g Mantequilla"
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
              {mutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}