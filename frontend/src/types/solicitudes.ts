export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Entregada';

export interface SolicitudInsumoItem {
  insumoId: string;
  nombreInsumo: string;
  cantidad: number;
  unidadMedida: string;
}

export interface Solicitud {
  id: string;
  codigo: string;
  asignaturaNombre: string;
  solicitante: string;
  fechaRequerida: string;
  estado: EstadoSolicitud;
  items: SolicitudInsumoItem[];
  observaciones?: string;
}

export type CrearSolicitudDTO = Omit<Solicitud, 'id' | 'codigo' | 'estado'>;