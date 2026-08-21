'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { academiaService } from '@/services/academia.service';
import { AsignaturaModal } from '@/components/academia/AsignaturaModal';
import { RutaProtegida } from '@/components/auth/RutaProtegida';
import Link from 'next/link';

export default function AcademiaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: asignaturas, isLoading } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: () => academiaService.getAsignaturas(),
  });

  return (
    <RutaProtegida rolesPermitidos={['ADMIN']}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Módulo de Academia</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Gestión académica, asignaturas y docentes.</p>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Catálogo de Asignaturas</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nueva Asignatura
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando asignaturas...</div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="block md:hidden space-y-3">
              {asignaturas?.map((asig) => (
                <div key={asig.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{asig.nombre}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                      {asig.codigo}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Profesor:</strong> {asig.profesor}</p>
                    <p><strong>Estudiantes:</strong> {asig.estudiantesInscritos}</p>
                    <p><strong>Aula Asignada:</strong> {asig.aulaAsignada}</p>
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
                    <th className="px-6 py-3">Asignatura</th>
                    <th className="px-6 py-3">Profesor</th>
                    <th className="px-6 py-3">Inscritos</th>
                    <th className="px-6 py-3">Aula Asignada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {asignaturas?.map((asig) => (
                    <tr key={asig.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{asig.codigo}</td>
                      <td className="px-6 py-4 font-medium">{asig.nombre}</td>
                      <td className="px-6 py-4">{asig.profesor}</td>
                      <td className="px-6 py-4">{asig.estudiantesInscritos} alumnos</td>
                      <td className="px-6 py-4">{asig.aulaAsignada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <AsignaturaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </RutaProtegida>
  );
}