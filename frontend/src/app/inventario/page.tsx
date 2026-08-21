'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';
import { InsumoModal } from '@/components/inventario/InsumoModal';
import { RutaProtegida } from '@/components/auth/RutaProtegida';
import { Insumo } from '@/types/inventario';
import Link from 'next/link';

export default function InventarioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: insumos, isLoading } = useQuery<Insumo[]>({
    queryKey: ['insumos'],
    queryFn: () => inventarioService.getInsumos(),
  });

  return (
    <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACEN']}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Control de Inventario</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Gestión de insumos y niveles de stock.</p>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Catálogo de Insumos</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nuevo Insumo
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando inventario...</div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="block md:hidden space-y-3">
              {insumos?.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{item.nombre}</span>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {item.categoria}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Stock Actual:</strong> {item.stockActual} {item.unidadMedida}</p>
                    <p><strong>Stock Mínimo:</strong> {item.stockMinimo} {item.unidadMedida}</p>
                    <p><strong>Ubicación:</strong> {item.ubicacion ?? 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Escritorio (Tabla) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                  <tr>
                    <th className="px-6 py-3">Insumo</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Stock Actual</th>
                    <th className="px-6 py-3">Stock Mínimo</th>
                    <th className="px-6 py-3">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {insumos?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.nombre}</td>
                      <td className="px-6 py-4">{item.categoria}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.stockActual} {item.unidadMedida}</td>
                      <td className="px-6 py-4">{item.stockMinimo} {item.unidadMedida}</td>
                      <td className="px-6 py-4">{item.ubicacion ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <InsumoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </RutaProtegida>
  );
}