'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reservasService } from '@/services/reservas.service';
import { ReservaModal } from '@/components/reservas/ReservaModal';
import { RutaProtegida } from '@/components/auth/RutaProtegida';
import Link from 'next/link';

export default function ReservasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reservas, isLoading } = useQuery({
    queryKey: ['reservas'],
    queryFn: () => reservasService.getReservas(),
  });

  return (
    <RutaProtegida rolesPermitidos={['ADMIN', 'PROFESOR']}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reservas de Espacios</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Programación de uso de cocinas y talleres.</p>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Calendario de Agendamiento</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nueva Reserva
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando reservas...</div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="block md:hidden space-y-3">
              {reservas?.map((reserva) => (
                <div key={reserva.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{reserva.espacio}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        reserva.estado === 'Confirmada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reserva.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Profesor:</strong> {reserva.profesorNombre}</p>
                    <p><strong>Asignatura:</strong> {reserva.asignatura}</p>
                    <p><strong>Fecha:</strong> {reserva.fecha}</p>
                    <p><strong>Horario:</strong> {reserva.horaInicio} - {reserva.horaFin}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Escritorio (Tabla) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
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
                      <td className="px-6 py-4 font-medium">{reserva.horaInicio} - {reserva.horaFin}</td>
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
          </>
        )}

        <ReservaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </RutaProtegida>
  );
}