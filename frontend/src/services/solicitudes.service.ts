import { Solicitud, CrearSolicitudDTO } from '@/types/solicitudes';

let mockSolicitudes: Solicitud[] = [
  {
    id: '1',
    codigo: 'SOL-2026-001',
    solicitante: 'Chef Carlos Ruiz',
    asignatura: 'Panadería Artesanal',
    fechaRequerida: '2026-08-25',
    estado: 'Pendiente',
    items: [
      { insumoId: '1', nombreInsumo: 'Harina de Trigo Todo Uso', cantidad: 20 },
      { insumoId: '2', nombreInsumo: 'Mantequilla sin Sal', cantidad: 5 },
    ],
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
      ...data,
      estado: 'Pendiente',
    };
    mockSolicitudes.unshift(nueva);
    return nueva;
  },
};