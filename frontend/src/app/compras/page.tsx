'use client';

import { useState } from 'react';
import { ProveedoresTable } from '@/components/compras/ProveedoresTable';
import { ProveedorModal } from '@/components/compras/ProveedorModal';
import { OrdenCompraModal } from '@/components/compras/OrdenCompraModal';
import { useQuery } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';
import Link from 'next/link';

export default function ComprasPage() {
  const [tab, setTab] = useState<'proveedores' | 'ordenes'>('ordenes');
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false);

  const { data: ordenes, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenesCompra'],
    queryFn: () => comprasService.getOrdenesCompra(),
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Módulo de Compras y Proveedores</h1>
          <p className="text-slate-500 text-sm">
            Gestión de órdenes de compra, abastecimiento y proveedores.
          </p>
        </div>
        <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
          ← Volver al Dashboard
        </Link>
      </div>

      Pestañas de Navegación del Módulo
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setTab('ordenes')}
          className={`pb-2 px-1 text-sm font-semibold transition-colors ${
            tab === 'ordenes'
              ? 'border-b-2 border-amber-600 text-amber-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Órdenes de Compra
        </button>
        <button
          onClick={() => setTab('proveedores')}
          className={`pb-2 px-1 text-sm font-semibold transition-colors ${
            tab === 'proveedores'
              ? 'border-b-2 border-amber-600 text-amber-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Proveedores
        </button>
      </div>

      {tab === 'ordenes' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Historial de Compras Realizadas</h2>
            <button
              onClick={() => setIsOrdenModalOpen(true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
            >
              + Nueva Orden de Compra
            </button>
          </div>

          {loadingOrdenes ? (
            <div className="p-6 text-center text-slate-500">Cargando órdenes de compra...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3">Fecha Emisión</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {ordenes?.map((orden) => (
                    <tr key={orden.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{orden.codigo}</td>
                      <td className="px-6 py-4">{orden.proveedorNombre}</td>
                      <td className="px-6 py-4">{orden.fechaEmision}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ${orden.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {orden.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Catálogo de Proveedores</h2>
            <button
              onClick={() => setIsProveedorModalOpen(true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
            >
              + Nuevo Proveedor
            </button>
          </div>

          <ProveedoresTable />
        </div>
      )}

      <ProveedorModal
        isOpen={isProveedorModalOpen}
        onClose={() => setIsProveedorModalOpen(false)}
      />

      <OrdenCompraModal
        isOpen={isOrdenModalOpen}
        onClose={() => setIsOrdenModalOpen(false)}
      />
    </div>
  );
}