export type EstadoReserva = 'Confirmada' | 'Pendiente' | 'Cancelada';

export interface Reserva {
  id: string;
  espacio: string; // ej. Cocina Principal, Taller de Pastelería
  profesorNombre: string;
  asignatura: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
}

export type CrearReservaDTO = Omit<Reserva, 'id' | 'estado'>;