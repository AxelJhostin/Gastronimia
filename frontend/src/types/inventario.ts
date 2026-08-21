export interface Insumo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'Lácteos' | 'Carnes' | 'Verduras' | 'Granos' | 'Especias' | 'Otros';
  unidadMedida: 'Kg' | 'L' | 'Unidad' | 'Gramos';
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  is_active: boolean;
}

export type CrearInsumoDTO = Omit<Insumo, 'id' | 'is_active'>;