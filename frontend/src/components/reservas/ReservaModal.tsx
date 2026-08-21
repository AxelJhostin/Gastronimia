'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ReservaModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [espacio, setEspacio] = useState('Cocina Caliente A');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((res) => setTimeout(res, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      onClose();
      setFecha('');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Reservar Espacio / Taller</h3>
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
            <label className="block font-semibold text-slate-700 mb-1">Espacio / Taller</label>
            <select
              value={espacio}
              onChange={(e) => setEspacio(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
            >
              <option value="Cocina Caliente A">Cocina Caliente A</option>
              <option value="Cocina Fría B">Cocina Fría B</option>
              <option value="Taller de Pastelería">Taller de Pastelería</option>
              <option value="Laboratorio de Bebidas">Laboratorio de Bebidas</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border p-2 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-lg border p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-lg border p-2 text-slate-900"
              />
            </div>
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
              {mutation.isPending ? 'Reservando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}