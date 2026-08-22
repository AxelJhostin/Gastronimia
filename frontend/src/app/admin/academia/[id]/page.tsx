'use client';

import { useQuery } from '@tanstack/react-query';
import { academiaService } from '@/services/academia.service';
import Link from 'next/link';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AsignaturaDetallePage({ params }: PageProps) {
  // Desenvolver los parámetros en Next.js App Router
  const resolvedParams = use(params);
  const asignaturaId = resolvedParams.id;

  const { data: asignatura, isLoading, isError, error } = useQuery({
    queryKey: ['asignatura', asignaturaId],
    queryFn: () => academiaService.getAsignaturaById(asignaturaId),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Cargando detalles de la asignatura...</div>;
  }

  if (isError || !asignatura) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al obtener la asignatura: {error instanceof Error ? error.message : 'No encontrada'}
        </div>
        <Link href="/academia" className="inline-block mt-4 text-amber-600 font-medium">
          ← Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            {asignatura.codigo}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">{asignatura.nombre}</h1>
        </div>
        <Link href="/academia" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
          ← Volver a Academia
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-md font-semibold text-slate-800">Información General</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Horas / Créditos:</p>
            <p className="font-medium text-slate-800">{asignatura.creditos} horas</p>
          </div>
          <div>
            <p className="text-slate-500">Estado:</p>
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                asignatura.is_active
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {asignatura.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Descripción:</p>
            <p className="text-slate-800">{asignatura.descripcion || 'Sin descripción disponible.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}