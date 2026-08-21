import { Reserva, CrearReservaDTO } from '@/types/reservas';

let mockReservas: Reserva[] = [
  {
    id: '1',
    espacio: 'Cocina A - Panadería',
    profesorNombre: 'Chef Carlos Ruiz',
    asignatura: 'Panadería Artesanal',
    fecha: '2026-08-25',
    horaInicio: '08:00',
    horaFin: '12:00',
    estado: 'Confirmada',
  },
  {
    id: '2',
    espacio: 'Taller de Repostería',
    profesorNombre: 'Chef Elena Gómez',
    asignatura: 'Pastelería Avanzada',
    fecha: '2026-08-26',
    horaInicio: '14:00',
    horaFin: '18:00',
    estado: 'Pendiente',
  },
];

export const reservasService = {
  getReservas: async (): Promise<Reserva[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockReservas];
  },

  crearReserva: async (data: CrearReservaDTO): Promise<Reserva> => {
    await new Promise((res) => setTimeout(res, 200));
    const nueva: Reserva = {
      id: String(Date.now()),
      ...data,
      estado: 'Confirmada',
    };
    mockReservas.unshift(nueva);
    return nueva;
  },
};