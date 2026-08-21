'use client';

import { useQuery } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';
import { solicitudesService } from '@/services/solicitudes.service';
import { reservasService } from '@/services/reservas.service';
import { academiaService } from '@/services/academia.service';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: insumos } = useQuery({
    queryKey: ['insumos'],
    queryFn: () => inventarioService.getInsumos(),
  });

  const { data: solicitudes } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesService.getSolicitudes(),
  });

  const { data: reservas } = useQuery({
    queryKey: ['reservas'],
    queryFn: () => reservasService.getReservas(),
  });

  const { data: asignaturas } = useQuery({
    queryKey: ['asignaturas'],
    queryFn: () => academiaService.getAsignaturas(),
  });

  // Métricas rápidas
  const insumosStockBajo = insumos?.filter((i) => i.stockActual <= i.stockMinimo) || [];
  const solicitudesPendientes = solicitudes?.filter((s) => s.estado === 'Pendiente') || [];
  const reservasHoy = reservas?.length || 0;
  const totalAsignaturas = asignaturas?.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard General</h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Visión consolidada del sistema GastroGestión.
        </p>
      </div>

      {/* Grid de Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Alertas de Stock</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{insumosStockBajo.length}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                insumosStockBajo.length > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {insumosStockBajo.length > 0 ? 'Atención Requerida' : 'Normal'}
            </span>
          </div>
          <Link
            href="/inventario"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium inline-block pt-2"
          >
            Ver Inventario →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Solicitudes Pendientes</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {solicitudesPendientes.length}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
              En espera
            </span>
          </div>
          <Link
            href="/solicitudes"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium inline-block pt-2"
          >
            Gestionar Solicitudes →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Reservas Programadas</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{reservasHoy}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Espacios Activos
            </span>
          </div>
          <Link
            href="/reservas"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium inline-block pt-2"
          >
            Ver Calendario →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Asignaturas Activas</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalAsignaturas}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Academia
            </span>
          </div>
          <Link
            href="/academia"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium inline-block pt-2"
          >
            Ver Clases →
          </Link>
        </div>
      </div>

      {/* Secciones de Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Insumos Críticos */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Insumos con Stock Bajo
          </h2>
          {insumosStockBajo.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No hay insumos críticos en este momento.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {insumosStockBajo.map((item) => (
                <li key={item.id} className="py-2 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-800">{item.nombre}</span>
                  <span className="text-red-600 font-bold">
                    {item.stockActual} / {item.stockMinimo} {item.unidadMedida}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximas Reservas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Próximos Talleres y Cocinas Reservadas
          </h2>
          {!reservas || reservas.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No hay reservas agendadas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reservas.slice(0, 3).map((res) => (
                <li key={res.id} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{res.espacio}</p>
                    <p className="text-slate-500">{res.asignatura} - {res.profesorNombre}</p>
                  </div>
                  <span className="font-medium text-slate-700">
                    {res.fecha} ({res.horaInicio})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}