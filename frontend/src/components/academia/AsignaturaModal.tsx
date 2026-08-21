'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignaturaModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [profesor, setProfesor] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((res) => setTimeout(res, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia'] });
      onClose();
      setNombre('');
      setCodigo('');
      setProfesor('');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Registrar Nueva Asignatura</h3>
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
            <label className="block font-semibold text-slate-700 mb-1">Código</label>
            <input
              type="text"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: GAS-101"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre de la Asignatura</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Taller de Panadería Avanzada"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Profesor Encargado</label>
            <input
              type="text"
              required
              value={profesor}
              onChange={(e) => setProfesor(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
              placeholder="Ej: Chef Carlos Mendoza"
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
              {mutation.isPending ? 'Guardando...' : 'Guardar Asignatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}