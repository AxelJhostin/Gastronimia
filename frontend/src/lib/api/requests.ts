import { apiFetch } from './http';

export interface RequestItemPayload {
  item_id: string;
  requested_quantity: number;
}

export interface CreateRequestPayload {
  section_id: string;
  usage_date: string; // Formato YYYY-MM-DD
  notes?: string;
  items: RequestItemPayload[];
}

export interface SupplyRequestItem {
  id: string;
  item_id: string;
  requested_quantity: number;
  approved_quantity?: number;
  item_name?: string;
  unit_code?: string;
}

export interface SupplyRequest {
  id: string;
  teacher_id: string;
  section_id: string;
  usage_date: string;
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  items: SupplyRequestItem[];
}

export interface ApprovalPayload {
  status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  rejection_reason?: string;
  items?: {
    item_id: string;
    approved_quantity: number;
  }[];
}

export const requestsApi = {
  // Endpoints para Docentes
  createRequest: (data: CreateRequestPayload) =>
    apiFetch<SupplyRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyRequests: () => apiFetch<SupplyRequest[]>('/requests/me'),

  // Endpoints para Admin / Manager
  getAllRequests: (status?: string) =>
    apiFetch<SupplyRequest[]>(`/requests${status ? `?status=${status}` : ''}`),

  reviewRequest: (requestId: string, data: ApprovalPayload) =>
    apiFetch<SupplyRequest>(`/requests/${requestId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};