'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { solicitudesService } from '@/services/solicitudes.service';
import { SolicitudModal } from '@/components/solicitudes/SolicitudModal';
import { RutaProtegida } from '@/components/auth/RutaProtegida';
import Link from 'next/link';

export default function SolicitudesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesService.getSolicitudes(),
  });

  return (
    <RutaProtegida rolesPermitidos={['ADMIN', 'PROFESOR', 'ALMACEN']}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Solicitudes de Materiales</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Gestión de insumos solicitados para clases y talleres.</p>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Historial de Solicitudes</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nueva Solicitud
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando solicitudes...</div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="block md:hidden space-y-3">
              {solicitudes?.map((sol) => (
                <div key={sol.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{sol.codigo}</span>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                      {sol.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Solicitante:</strong> {sol.solicitante}</p>
                    <p><strong>Asignatura:</strong> {sol.asignatura}</p>
                    <p><strong>Fecha Req.:</strong> {sol.fechaRequerida}</p>
                    <p><strong>Insumos:</strong> {sol.items.map((i) => `${i.nombreInsumo} (${i.cantidad})`).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Escritorio (Tabla) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Solicitante</th>
                    <th className="px-6 py-3">Asignatura</th>
                    <th className="px-6 py-3">Fecha Requerida</th>
                    <th className="px-6 py-3">Ítems</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {solicitudes?.map((sol) => (
                    <tr key={sol.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{sol.codigo}</td>
                      <td className="px-6 py-4">{sol.solicitante}</td>
                      <td className="px-6 py-4">{sol.asignatura}</td>
                      <td className="px-6 py-4">{sol.fechaRequerida}</td>
                      <td className="px-6 py-4">{sol.items.length} ítem(s)</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                          {sol.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <SolicitudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </RutaProtegida>
  );
}