'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reservasService } from '@/services/reservas.service';
import { ReservaModal } from '@/components/reservas/ReservaModal';
import Link from 'next/link';

export default function ReservasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reservas, isLoading } = useQuery({
    queryKey: ['reservas'],
    queryFn: () => reservasService.getReservas(),
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Módulo de Reservas de Espacios</h1>
          <p className="text-slate-500 text-sm">
            Programación y control de uso de cocinas, aulas y talleres.
          </p>
        </div>
        <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Calendario de Agendamiento</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          + Nueva Reserva
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-slate-500">Cargando reservas...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-3">Espacio / Taller</th>
                <th className="px-6 py-3">Profesor</th>
                <th className="px-6 py-3">Asignatura</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Horario</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {reservas?.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{reserva.espacio}</td>
                  <td className="px-6 py-4">{reserva.profesorNombre}</td>
                  <td className="px-6 py-4">{reserva.asignatura}</td>
                  <td className="px-6 py-4">{reserva.fecha}</td>
                  <td className="px-6 py-4 font-medium">
                    {reserva.horaInicio} - {reserva.horaFin}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        reserva.estado === 'Confirmada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reserva.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}