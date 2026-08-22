'use client';

import { useEffect, useState } from 'react';
import { requestsApi, SupplyRequest } from '@/lib/api/requests';

export default function AdminSolicitudesPage() {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<SupplyRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario de revisión
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestsApi.getAllRequests();
      setRequests(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSelectRequest = (req: SupplyRequest) => {
    setSelectedReq(req);
    const initialQty: Record<string, number> = {};
    req.items?.forEach((item) => {
      initialQty[item.item_id] = item.requested_quantity;
    });
    setApprovedQuantities(initialQty);
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReq) return;

    if (status === 'REJECTED' && !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo para el rechazo.');
      return;
    }

    setSubmitting(true);
    try {
      await requestsApi.reviewRequest(selectedReq.id, {
        status,
        rejection_reason: status === 'REJECTED' ? rejectionReason : undefined,
        items: status === 'APPROVED'
          ? Object.entries(approvedQuantities).map(([item_id, approved_quantity]) => ({
              item_id,
              approved_quantity,
            }))
          : undefined,
      });

      setSelectedReq(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la revisión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-stone-600 text-sm">Cargando solicitudes pendientes...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Aprobación de Solicitudes</h1>
        <p className="text-sm text-stone-500">Revisa, ajusta cantidades o rechaza peticiones de insumos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado lateral */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-200">
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectRequest(r)}
              className={`w-full p-4 text-left transition-colors ${
                selectedReq?.id === r.id ? 'bg-amber-50 border-l-4 border-amber-700' : 'hover:bg-stone-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-stone-900">{r.usage_date}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">Docente ID: {r.teacher_id}</p>
            </button>
          ))}
        </div>

        {/* Detalle y revisión */}
        <div className="lg:col-span-2">
          {selectedReq ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-5">
              <h3 className="font-bold text-stone-900 text-lg">Detalle de Solicitud</h3>
              <p className="text-xs text-stone-500">Fecha de Uso: <strong>{selectedReq.usage_date}</strong></p>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-100 text-xs text-stone-600 uppercase">
                    <tr>
                      <th className="p-3">Item ID</th>
                      <th className="p-3">Cant. Solicitada</th>
                      <th className="p-3">Cant. Aprobada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedReq.items?.map((item) => (
                      <tr key={item.item_id}>
                        <td className="p-3 font-mono text-xs">{item.item_id}</td>
                        <td className="p-3 font-semibold">{item.requested_quantity}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={approvedQuantities[item.item_id] ?? item.requested_quantity}
                            onChange={(e) =>
                              setApprovedQuantities({
                                ...approvedQuantities,
                                [item.item_id]: Number(e.target.value),
                              })
                            }
                            className="w-20 border rounded p-1 text-sm font-bold text-amber-800"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700">Motivo de Rechazo (si aplica)</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Ej: Stock insuficiente de harina..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800"
                >
                  Aprobar Solicitud
                </button>
                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={submitting}
                  className="flex-1 bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-800"
                >
                  Rechazar Solicitud
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-stone-200 text-stone-500 text-sm">
              Selecciona una solicitud de la lista para gestionarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}