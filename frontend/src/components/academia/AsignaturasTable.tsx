'use client';

import { useQuery } from '@tanstack/react-query';
import { academiaService } from '@/services/academia.service';
import Link from 'next/link';

export function AsignaturasTable() {
  const { data: asignaturas, isLoading, isError, error } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: () => academiaService.getAsignaturas(),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        Cargando asignaturas...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Error al cargar asignaturas: {error instanceof Error ? error.message : 'Error de servidor'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Horas / Créditos</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {asignaturas && asignaturas.length > 0 ? (
            asignaturas.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{item.codigo}</td>
                <td className="px-4 py-3">{item.nombre}</td>
                <td className="px-4 py-3">{item.creditos} hrs</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      item.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/academia/${item.id}`}
                    className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                No hay asignaturas registradas en el sistema.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}