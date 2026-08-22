'use client';

import { useEffect, useState } from 'react';
import { requestsApi, SupplyRequest } from '@/lib/api/requests';

export default function MisSolicitudesPage() {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await requestsApi.getMyRequests();
        setRequests(data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const getStatusBadge = (status: SupplyRequest['status']) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-green-100 text-green-800',
      PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-stone-100 text-stone-600',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) return <p className="p-6 text-stone-600 text-sm">Cargando tus solicitudes...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Mis Solicitudes de Insumos</h1>
        <p className="text-sm text-stone-500">Historial de insumos solicitados y estado de aprobación.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-xs font-semibold text-stone-600 uppercase border-b">
            <tr>
              <th className="p-4">Fecha Uso</th>
              <th className="p-4">Sección ID</th>
              <th className="p-4">Ítems Solicitados</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-stone-500 text-sm">
                  No has registrado ninguna solicitud aún.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="p-4 font-semibold text-stone-900">{r.usage_date}</td>
                  <td className="p-4 text-xs font-mono text-stone-500">{r.section_id}</td>
                  <td className="p-4 text-xs text-stone-700">{r.items?.length ?? 0} insumo(s)</td>
                  <td className="p-4">{getStatusBadge(r.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}