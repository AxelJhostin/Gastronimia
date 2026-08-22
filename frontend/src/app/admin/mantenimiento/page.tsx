'use client';

import { useEffect, useState } from 'react';
import { maintenanceApi, MaintenanceRecord } from '@/lib/api/maintenance';

export default function AdminMantenimientoPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario
  const [form, setForm] = useState<MaintenanceRecord>({
    asset_id: '',
    maintenance_type: 'PREVENTIVE',
    description: '',
    cost: 0,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'SCHEDULED',
  });

  const loadData = async () => {
    try {
      const data = await maintenanceApi.getMaintenanceRecords();
      setRecords(data);
    } catch (err: any) {
      console.error('Error al cargar mantenimientos:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await maintenanceApi.createMaintenance(form);
      setForm({
        asset_id: '',
        maintenance_type: 'PREVENTIVE',
        description: '',
        cost: 0,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'SCHEDULED',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al programar mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MaintenanceRecord['status']) => {
    try {
      await maintenanceApi.updateMaintenanceStatus(id, {
        status: newStatus,
        completed_date: newStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    const styles = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-stone-100 text-stone-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Mantenimiento de Equipos y Activos</h1>
        <p className="text-sm text-stone-500">Programa mantenimientos preventivos y registra reparaciones de utensilios o equipos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm shadow-sm">
          <h3 className="font-bold text-stone-800">Programar Mantenimiento</h3>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">ID del Activo Individual</label>
            <input
              type="text"
              required
              value={form.asset_id}
              onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
              className="w-full border rounded-lg p-2 text-stone-800"
              placeholder="Ej: AST-00123"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Tipo de Mantenimiento</label>
            <select
              value={form.maintenance_type}
              onChange={(e) => setForm({ ...form, maintenance_type: e.target.value as any })}
              className="w-full border rounded-lg p-2 text-stone-800"
            >
              <option value="PREVENTIVE">Preventivo (Revisión periódica)</option>
              <option value="CORRECTIVE">Correctivo (Reparación / Falla)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Fecha Programada</label>
            <input
              type="date"
              required
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full border rounded-lg p-2 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Costo Estimado ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              className="w-full border rounded-lg p-2 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Descripción / Trabajo a realizar</label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg p-2 text-stone-800"
              placeholder="Ej: Mantenimiento de motor de batidora industrial..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-800"
          >
            Guardar Registro
          </button>
        </form>

        {/* Tabla de registros */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
              <tr>
                <th className="p-3">Activo ID</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-stone-500 text-xs">
                    No hay registros de mantenimiento almacenados.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="p-3 font-mono text-xs font-semibold">{r.asset_id}</td>
                    <td className="p-3 text-xs font-medium">
                      {r.maintenance_type === 'PREVENTIVE' ? 'Preventivo' : 'Correctivo'}
                    </td>
                    <td className="p-3 text-xs">{r.scheduled_date}</td>
                    <td className="p-3">{getStatusBadge(r.status)}</td>
                    <td className="p-3 text-right space-x-2">
                      {r.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id!, 'IN_PROGRESS')}
                          className="text-xs text-amber-700 hover:underline font-semibold"
                        >
                          Iniciar
                        </button>
                      )}
                      {r.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id!, 'COMPLETED')}
                          className="text-xs text-green-700 hover:underline font-semibold"
                        >
                          Completar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}