'use client';

import { useState } from 'react';
import { AsignaturasTable } from '@/components/academia/AsignaturasTable';
import { AsignaturaModal } from '@/components/academia/AsignaturaModal';
import Link from 'next/link';

export default function AcademiaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Módulo de Academia</h1>
          <p className="text-slate-500 text-sm">
            Gestión de asignaturas, grupos académicos e imparticiones.
          </p>
        </div>
        <Link
          href="/"
          className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Acciones y Tabla */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Catálogo de Asignaturas</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            + Nueva Asignatura
          </button>
        </div>

        {/* Tabla */}
        <AsignaturasTable />
      </div>

      {/* Modal de Formulario */}
      <AsignaturaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}