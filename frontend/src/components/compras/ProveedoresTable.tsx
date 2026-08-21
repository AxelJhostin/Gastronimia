'use client';

import { useQuery } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';

export function ProveedoresTable() {
  const { data: proveedores, isLoading, isError } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => comprasService.getProveedores(),
  });

  if (isLoading) return <div className="p-6 text-center text-slate-500">Cargando proveedores...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 rounded-md">Error al cargar proveedores.</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-xs uppercase text-slate-700">
          <tr>
            <th className="px-6 py-3">RNC / ID</th>
            <th className="px-6 py-3">Razón Social</th>
            <th className="px-6 py-3">Contacto</th>
            <th className="px-6 py-3">Teléfono</th>
            <th className="px-6 py-3">Correo Electrónico</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {proveedores?.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.rnc}</td>
              <td className="px-6 py-4 font-semibold text-slate-900">{item.nombre}</td>
              <td className="px-6 py-4">{item.contacto}</td>
              <td className="px-6 py-4">{item.telefono}</td>
              <td className="px-6 py-4">{item.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}