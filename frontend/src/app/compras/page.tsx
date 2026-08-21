'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';
import { OrdenCompraModal } from '@/components/compras/OrdenCompraModal';
import { RutaProtegida } from '@/components/auth/RutaProtegida';
import { OrdenCompra } from '@/types/compras';
import Link from 'next/link';

export default function ComprasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ordenes, isLoading } = useQuery<OrdenCompra[]>({
    queryKey: ['ordenesCompra'],
    queryFn: () => comprasService.getOrdenes(),
  });

  return (
    <RutaProtegida rolesPermitidos={['ADMIN', 'ALMACEN']}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Módulo de Compras</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Gestión de órdenes de compra y proveedores.</p>
          </div>
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Órdenes de Compra</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nueva Orden
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando órdenes...</div>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas) */}
            <div className="block md:hidden space-y-3">
              {ordenes?.map((orden) => (
                <div key={orden.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{orden.codigo}</span>
                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {orden.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Proveedor:</strong> {orden.proveedorNombre}</p>
                    <p><strong>Fecha Emisión:</strong> {orden.fechaEmision}</p>
                    <p><strong>Monto Total:</strong> ${orden.total.toFixed(2)}</p>
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
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3">Fecha Emisión</th>
                    <th className="px-6 py-3">Monto Total</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {ordenes?.map((orden) => (
                    <tr key={orden.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{orden.codigo}</td>
                      <td className="px-6 py-4">{orden.proveedorNombre}</td>
                      <td className="px-6 py-4">{orden.fechaEmision}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">${orden.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          {orden.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <OrdenCompraModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </RutaProtegida>
  );
}