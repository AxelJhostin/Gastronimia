export interface Asignatura {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  creditos: number;
  is_active: boolean;
  created_at?: string;
}

export interface CrearAsignaturaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  creditos: number;
}

export interface ActualizarAsignaturaDTO extends Partial<CrearAsignaturaDTO> {
  is_active?: boolean;
}