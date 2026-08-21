'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario, LoginCredentials, RegisterDTO, Rol } from '@/types/auth';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  usuario: Usuario | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => void;
  tieneRol: (roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>({
    id: '1',
    nombre: 'Usuario Demo',
    email: 'admin@gastro.com',
    rol: 'ADMIN',
  });

  const login = async (credentials: LoginCredentials) => {
    const user = await authService.login(credentials);
    setUsuario(user);
  };

  const register = async (data: RegisterDTO) => {
    const user = await authService.register(data);
    setUsuario(user);
  };

  const logout = () => {
    setUsuario(null);
  };

  const tieneRol = (roles: Rol[]) => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, register, logout, tieneRol }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}