export interface Asignatura {
  id: string;
  codigo: string;
  nombre: string;
  profesor: string;
  estudiantesInscritos: number;
  aulaAsignada: string;
}

export type CrearAsignaturaDTO = Omit<Asignatura, 'id'>;