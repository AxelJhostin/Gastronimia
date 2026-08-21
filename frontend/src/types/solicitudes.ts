export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Entregada';

export interface ItemSolicitud {
  insumoId: string;
  nombreInsumo: string;
  cantidad: number;
}

export interface Solicitud {
  id: string;
  codigo: string;
  solicitante: string;
  asignatura: string;
  fechaRequerida: string;
  estado: EstadoSolicitud;
  items: ItemSolicitud[];
}

export type CrearSolicitudDTO = Omit<Solicitud, 'id' | 'codigo' | 'estado'>;