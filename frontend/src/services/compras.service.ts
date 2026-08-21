import { Proveedor, OrdenCompra, CrearProveedorDTO } from '@/types/compras';

let mockProveedores: Proveedor[] = [];

let mockOrdenes: OrdenCompra[] = [
  {
    id: '1',
    codigo: 'OC-2026-001',
    proveedorId: 'prov-1',
    proveedorNombre: 'Distribuidora Gastronómica S.A.',
    fechaEmision: '2026-08-20',
    estado: 'Enviada',
    items: [],
    total: 450.00,
  },
];

export const comprasService = {
  getProveedores: async (): Promise<Proveedor[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockProveedores];
  },

  crearProveedor: async (data: CrearProveedorDTO): Promise<Proveedor> => {
    await new Promise((res) => setTimeout(res, 200));
    const nuevo: Proveedor = { id: String(Date.now()), ...data };
    mockProveedores.push(nuevo);
    return nuevo;
  },

  getOrdenes: async (): Promise<OrdenCompra[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockOrdenes];
  },
};