import { apiFetch } from './http';

export interface Space {
  id?: string;
  name: string;
  code: string;
  capacity: number;
  description?: string;
  is_active?: boolean;
}

export interface SpaceReservation {
  id: string;
  space_id: string;
  teacher_id: string;
  section_id?: string;
  reservation_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
}

export interface CreateReservationPayload {
  space_id: string;
  section_id?: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export const reservationsApi = {
  // Espacios
  getSpaces: () => apiFetch<Space[]>('/reservations/spaces'),
  createSpace: (data: Space) =>
    apiFetch<Space>('/reservations/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reservas
  getReservations: (params?: { date?: string; space_id?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<SpaceReservation[]>(`/reservations${query ? `?${query}` : ''}`);
  },

  createReservation: (data: CreateReservationPayload) =>
    apiFetch<SpaceReservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelReservation: (id: string) =>
    apiFetch<SpaceReservation>(`/reservations/${id}/cancel`, {
      method: 'PATCH',
    }),
};  