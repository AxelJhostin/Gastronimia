'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesService } from '@/services/solicitudes.service';
import { EstadoSolicitud } from '@/types/solicitudes';

export function SolicitudesTable() {
  const queryClient = useQueryClient();

  const { data: solicitudes, isLoading, isError } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesService.getSolicitudes(),
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoSolicitud }) =>
      solicitudesService.cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
    },
  });

  if (isLoading) return <div className="p-6 text-center text-slate-500">Cargando solicitudes...</div>;
  if (isError) return <div className="p-4 bg-red-50 text-red-600 rounded-md">Error al cargar las solicitudes.</div>;

  const getBadgeStyle = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-800';
      case 'Aprobada':
        return 'bg-blue-100 text-blue-800';
      case 'Entregada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-xs uppercase text-slate-700">
          <tr>
            <th className="px-6 py-3">Código</th>
            <th className="px-6 py-3">Asignatura</th>
            <th className="px-6 py-3">Solicitante</th>
            <th className="px-6 py-3">Fecha Requerida</th>
            <th className="px-6 py-3">Estado</th>
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {solicitudes?.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-semibold text-slate-900">{item.codigo}</td>
              <td className="px-6 py-4">{item.asignaturaNombre}</td>
              <td className="px-6 py-4">{item.solicitante}</td>
              <td className="px-6 py-4">{item.fechaRequerida}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeStyle(item.estado)}`}>
                  {item.estado}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {item.estado === 'Pendiente' && (
                  <>
                    <button
                      onClick={() => estadoMutation.mutate({ id: item.id, estado: 'Aprobada' })}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => estadoMutation.mutate({ id: item.id, estado: 'Rechazada' })}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {item.estado === 'Aprobada' && (
                  <button
                    onClick={() => estadoMutation.mutate({ id: item.id, estado: 'Entregada' })}
                    className="text-xs font-medium text-green-600 hover:text-green-800"
                  >
                    Marcar Entregada
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}