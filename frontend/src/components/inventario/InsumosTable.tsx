'use client';

import { useQuery } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';

export function InsumosTable() {
  const { data: insumos, isLoading, isError } = useQuery({
    queryKey: ['insumos'],
    queryFn: () => inventarioService.getInsumos(),
  });

  if (isLoading) return <div className="p-6 text-center text-slate-500">Cargando inventario...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 rounded-md">Error al cargar el inventario.</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-xs uppercase text-slate-700">
          <tr>
            <th className="px-6 py-3">Código</th>
            <th className="px-6 py-3">Insumo</th>
            <th className="px-6 py-3">Categoría</th>
            <th className="px-6 py-3">Stock</th>
            <th className="px-6 py-3">Precio Unit.</th>
            <th className="px-6 py-3">Estado Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {insumos?.map((item) => {
            const bajoStock = item.stockActual <= item.stockMinimo;
            return (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{item.codigo}</td>
                <td className="px-6 py-4">{item.nombre}</td>
                <td className="px-6 py-4">{item.categoria}</td>
                <td className="px-6 py-4 font-medium">
                  {item.stockActual} {item.unidadMedida}
                </td>
                <td className="px-6 py-4">${item.precioUnitario.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      bajoStock
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {bajoStock ? 'Stock Bajo' : 'Suficiente'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}