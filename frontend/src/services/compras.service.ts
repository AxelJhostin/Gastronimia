import { Proveedor, CrearProveedorDTO, OrdenCompra } from '@/types/compras';

let mockProveedores: Proveedor[] = [
  {
    id: '1',
    rnc: '130-12345-1',
    nombre: 'Distribuidora Lácteos del Este',
    contacto: 'Carlos Mendoza',
    telefono: '809-555-0192',
    email: 'ventas@lacteoseste.com',
    direccion: 'Av. Central #45, Santo Domingo',
  },
  {
    id: '2',
    rnc: '101-98765-4',
    nombre: 'Molinos Nacionales S.A.',
    contacto: 'María Fernández',
    telefono: '809-555-0144',
    email: 'pedidos@molinosnac.com',
    direccion: 'Zona Industrial Haina',
  },
];

let mockOrdenes: OrdenCompra[] = [
  {
    id: '1',
    codigo: 'OC-2026-001',
    proveedorId: '2',
    proveedorNombre: 'Molinos Nacionales S.A.',
    fechaEmision: '2026-08-10',
    estado: 'Recibida',
    items: [
      { insumoId: '1', nombreInsumo: 'Harina de Trigo Todo Uso', cantidad: 50, precioUnitario: 45.0 },
    ],
    total: 2250.0,
  },
];

export const comprasService = {
  getProveedores: async (): Promise<Proveedor[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockProveedores];
  },

  crearProveedor: async (data: CrearProveedorDTO): Promise<Proveedor> => {
    await new Promise((res) => setTimeout(res, 200));
    const nuevo: Proveedor = {
      id: String(Date.now()),
      ...data,
    };
    mockProveedores.push(nuevo);
    return nuevo;
  },

  getOrdenesCompra: async (): Promise<OrdenCompra[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...mockOrdenes];
  },

  crearOrdenCompra: async (data: Omit<OrdenCompra, 'id' | 'codigo'>): Promise<OrdenCompra> => {
    await new Promise((res) => setTimeout(res, 200));
    const nueva: OrdenCompra = {
      id: String(Date.now()),
      codigo: `OC-2026-00${mockOrdenes.length + 1}`,
      ...data,
    };
    mockOrdenes.unshift(nueva);
    return nueva;
  },
};