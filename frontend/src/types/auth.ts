export type Rol = 'ADMIN' | 'PROFESOR' | 'ALMACEN';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterDTO {
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
}