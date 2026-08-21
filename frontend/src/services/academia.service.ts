/*import { fetcher } from '@/lib/api/client';
import { 
  Asignatura, 
  CrearAsignaturaDTO, 
  ActualizarAsignaturaDTO 
} from '@/types/academia';

export const academiaService = {
  // Obtener catálogo de asignaturas
  getAsignaturas: async (): Promise<Asignatura[]> => {
    return fetcher<Asignatura[]>('/academia/asignaturas', {
      next: { revalidate: 60 },
    });
  },

  // Obtener asignatura por ID
  getAsignaturaById: async (id: string): Promise<Asignatura> => {
    return fetcher<Asignatura>(`/academia/asignaturas/${id}`);
  },

  // Crear asignatura
  crearAsignatura: async (data: CrearAsignaturaDTO): Promise<Asignatura> => {
    return fetcher<Asignatura>('/academia/asignaturas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar asignatura
  actualizarAsignatura: async (
    id: string, 
    data: ActualizarAsignaturaDTO
  ): Promise<Asignatura> => {
    return fetcher<Asignatura>(`/academia/asignaturas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Eliminar asignatura
  eliminarAsignatura: async (id: string): Promise<{ success: boolean }> => {
    return fetcher<{ success: boolean }>(`/academia/asignaturas/${id}`, {
      method: 'DELETE',
    });
  },
};*/

import { 
  Asignatura, 
  CrearAsignaturaDTO, 
  ActualizarAsignaturaDTO 
} from '@/types/academia';

// Datos en memoria para simular el servidor
let mockAsignaturas: Asignatura[] = [
  {
    id: '1',
    codigo: 'GAS-101',
    nombre: 'Técnicas Culinarias I',
    descripcion: 'Bases de corte y cocciones principales',
    creditos: 60,
    is_active: true,
  },
  {
    id: '2',
    codigo: 'GAS-102',
    nombre: 'Panadería y Pastelería',
    descripcion: 'Masas fermentadas y repostería básica',
    creditos: 45,
    is_active: true,
  },
];

export const academiaService = {
  getAsignaturas: async (): Promise<Asignatura[]> => {
    await new Promise((res) => setTimeout(res, 300));
    return [...mockAsignaturas];
  },

  getAsignaturaById: async (id: string): Promise<Asignatura> => {
    await new Promise((res) => setTimeout(res, 300));
    const item = mockAsignaturas.find((a) => a.id === id);
    if (!item) throw new Error('Asignatura no encontrada');
    return item;
  },

  crearAsignatura: async (data: CrearAsignaturaDTO): Promise<Asignatura> => {
    await new Promise((res) => setTimeout(res, 300));
    const nueva: Asignatura = {
      id: String(Date.now()),
      ...data,
      is_active: true,
    };
    mockAsignaturas.push(nueva);
    return nueva;
  },

  actualizarAsignatura: async (id: string, data: ActualizarAsignaturaDTO): Promise<Asignatura> => {
    await new Promise((res) => setTimeout(res, 300));
    mockAsignaturas = mockAsignaturas.map((item) =>
      item.id === id ? { ...item, ...data } : item
    );
    return mockAsignaturas.find((item) => item.id === id)!;
  },

  eliminarAsignatura: async (id: string): Promise<{ success: boolean }> => {
    await new Promise((res) => setTimeout(res, 300));
    mockAsignaturas = mockAsignaturas.filter((item) => item.id !== id);
    return { success: true };
  },
};