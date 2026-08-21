'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasService } from '@/services/reservas.service';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ESPACIOS = [
  'Cocina A - Panadería',
  'Cocina B - Calientes',
  'Taller de Repostería',
  'Laboratorio de Análisis Sensorial',
  'Aula Magna',
];

export function ReservaModal({ isOpen, onClose }: ReservaModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    espacio: ESPACIOS[0],
    profesorNombre: '',
    asignatura: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '11:00',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => reservasService.crearReserva(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      onClose();
      setFormData({
        espacio: ESPACIOS[0],
        profesorNombre: '',
        asignatura: '',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '08:00',
        horaFin: '11:00',
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Reservar Espacio / Cocina</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Espacio o Taller</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.espacio}
              onChange={(e) => setFormData({ ...formData, espacio: e.target.value })}
            >
              {ESPACIOS.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Profesor / Encargado</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.profesorNombre}
              onChange={(e) => setFormData({ ...formData, profesorNombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Asignatura / Taller</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.asignatura}
              onChange={(e) => setFormData({ ...formData, asignatura: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input
              type="date"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Hora Inicio</label>
              <input
                type="time"
                required
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hora Fin</label>
              <input
                type="time"
                required
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.horaFin}
                onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
              />
            </div>
          </div>

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
              disabled={mutation.isPending}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}