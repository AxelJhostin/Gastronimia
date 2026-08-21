export interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  ubicacion?: string; // Usa 'ubicacion: string;' si es obligatorio
}

export type CrearInsumoDTO = Omit<Insumo, 'id'>;