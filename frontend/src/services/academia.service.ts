import { Asignatura, CrearAsignaturaDTO } from '@/types/academia';

let mockAsignaturas: Asignatura[] = [
  {
    id: '1',
    codigo: 'ACAD-01',
    nombre: 'Panadería Artesanal',
    profesor: 'Chef Carlos Ruiz',
    estudiantesInscritos: 18,
    aulaAsignada: 'Cocina A - Panadería',
  },
  {
    id: '2',
    codigo: 'ACAD-02',
    nombre: 'Pastelería Avanzada',
    profesor: 'Chef Elena Gómez',
    estudiantesInscritos: 15,
    aulaAsignada: 'Taller de Repostería',
  },
];

export const academiaService = {
  getAsignaturas: async (): Promise<Asignatura[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockAsignaturas];
  },

  crearAsignatura: async (data: CrearAsignaturaDTO): Promise<Asignatura> => {
    await new Promise((res) => setTimeout(res, 200));
    const nueva: Asignatura = {
      id: String(Date.now()),
      ...data,
    };
    mockAsignaturas.push(nueva);
    return nueva;
  },
};