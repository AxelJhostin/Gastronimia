import { Insumo, CrearInsumoDTO } from '@/types/inventario';

let mockInsumos: Insumo[] = [
  {
    id: '1',
    codigo: 'INS-001',
    nombre: 'Harina de Trigo Todo Uso',
    categoria: 'Granos',
    unidadMedida: 'Kg',
    stockActual: 50,
    stockMinimo: 10,
    precioUnitario: 1.20,
    is_active: true,
  },
  {
    id: '2',
    codigo: 'INS-002',
    nombre: 'Leche Entera',
    categoria: 'Lácteos',
    unidadMedida: 'L',
    stockActual: 4,
    stockMinimo: 15,
    precioUnitario: 0.95,
    is_active: true,
  },
];

export const inventarioService = {
  getInsumos: async (): Promise<Insumo[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockInsumos];
  },

  crearInsumo: async (data: CrearInsumoDTO): Promise<Insumo> => {
    await new Promise((res) => setTimeout(res, 200));
    const nuevo: Insumo = {
      id: String(Date.now()),
      ...data,
      is_active: true,
    };
    mockInsumos.push(nuevo);
    return nuevo;
  },
};