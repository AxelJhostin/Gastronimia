import { Solicitud, CrearSolicitudDTO, EstadoSolicitud } from '@/types/solicitudes';

let mockSolicitudes: Solicitud[] = [
  {
    id: '1',
    codigo: 'SOL-2026-001',
    asignaturaNombre: 'Técnicas Culinarias I',
    solicitante: 'Chef Marcos Pérez',
    fechaRequerida: '2026-08-25',
    estado: 'Pendiente',
    items: [
      { insumoId: '1', nombreInsumo: 'Harina de Trigo Todo Uso', cantidad: 5, unidadMedida: 'Kg' },
    ],
    observaciones: 'Para la clase práctica de panadería básica.',
  },
  {
    id: '2',
    codigo: 'SOL-2026-002',
    asignaturaNombre: 'Panadería y Pastelería',
    solicitante: 'Chef Lucía Gómez',
    fechaRequerida: '2026-08-22',
    estado: 'Aprobada',
    items: [
      { insumoId: '2', nombreInsumo: 'Leche Entera', cantidad: 10, unidadMedida: 'L' },
    ],
    observaciones: 'Suministro para taller de repostería.',
  },
];

export const solicitudesService = {
  getSolicitudes: async (): Promise<Solicitud[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockSolicitudes];
  },

  crearSolicitud: async (data: CrearSolicitudDTO): Promise<Solicitud> => {
    await new Promise((res) => setTimeout(res, 200));
    const nueva: Solicitud = {
      id: String(Date.now()),
      codigo: `SOL-2026-00${mockSolicitudes.length + 1}`,
      estado: 'Pendiente',
      ...data,
    };
    mockSolicitudes.push(nueva);
    return nueva;
  },

  cambiarEstado: async (id: string, nuevoEstado: EstadoSolicitud): Promise<Solicitud> => {
    await new Promise((res) => setTimeout(res, 200));
    mockSolicitudes = mockSolicitudes.map((s) =>
      s.id === id ? { ...s, estado: nuevoEstado } : s
    );
    return mockSolicitudes.find((s) => s.id === id)!;
  },
};