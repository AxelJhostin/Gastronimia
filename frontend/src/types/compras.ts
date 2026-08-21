export interface Proveedor {
  id: string;
  rnc: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion?: string;
}

export type CrearProveedorDTO = Omit<Proveedor, 'id'>;

export type EstadoOrdenCompra = 'Borrador' | 'Enviada' | 'Recibida' | 'Cancelada';

export interface OrdenCompraItem {
  insumoId: string;
  nombreInsumo: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompra {
  id: string;
  codigo: string;
  proveedorId: string;
  proveedorNombre: string;
  fechaEmision: string;
  estado: EstadoOrdenCompra;
  items: OrdenCompraItem[];
  total: number;
}

