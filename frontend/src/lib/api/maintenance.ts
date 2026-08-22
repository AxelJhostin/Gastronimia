import { apiFetch } from './http';

export interface MaintenanceRecord {
  id?: string;
  asset_id: string; // ID del activo individual
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE';
  description: string;
  cost?: number;
  scheduled_date: string; // YYYY-MM-DD
  completed_date?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export const maintenanceApi = {
  // Obtener todos los registros de mantenimiento
  getMaintenanceRecords: (assetId?: string) =>
    apiFetch<MaintenanceRecord[]>(`/maintenance${assetId ? `?asset_id=${assetId}` : ''}`),

  // Crear un nuevo registro
  createMaintenance: (data: MaintenanceRecord) =>
    apiFetch<MaintenanceRecord>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Actualizar el estado o fecha de finalización
  updateMaintenanceStatus: (
    id: string,
    data: { status: MaintenanceRecord['status']; completed_date?: string; notes?: string }
  ) =>
    apiFetch<MaintenanceRecord>(`/maintenance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};