'use client';

import { useState } from 'react';
import { InsumosTable } from '@/components/inventario/InsumosTable';
import { InsumoModal } from '@/components/inventario/InsumoModal';
import Link from 'next/link';

export default function InventarioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Módulo de Inventario</h1>
          <p className="text-slate-500 text-sm">
            Control de insumos, unidades de medida y alertas de stock mínimo.
          </p>
        </div>
        <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Catálogo de Insumos</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nuevo Insumo
          </button>
        </div>

        <InsumosTable />
      </div>

      <InsumoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}