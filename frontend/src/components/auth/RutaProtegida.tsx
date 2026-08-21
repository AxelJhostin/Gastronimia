'use client';

import { useAuth } from '@/context/AuthContext';
import { RolUsuario } from '@/types/auth';
import { ReactNode } from 'react';
import Link from 'next/link';

interface RutaProtegidaProps {
  children: ReactNode;
  rolesPermitidos?: RolUsuario[];
}

export function RutaProtegida({ children, rolesPermitidos }: RutaProtegidaProps) {
  const { usuario, tieneRol } = useAuth();

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-sm text-slate-600 mt-2">Debes iniciar sesión para acceder a este módulo.</p>
        <Link href="/login" className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm text-white">
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (rolesPermitidos && !tieneRol(rolesPermitidos)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-3">
        <div className="rounded-full bg-red-100 p-3 text-red-600 font-bold">403</div>
        <h2 className="text-lg font-bold text-slate-900">Permisos Insuficientes</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
          Tu rol actual (<strong>{usuario.rol}</strong>) no tiene autorización para consultar o modificar esta sección.
        </p>
        <Link href="/" className="text-xs font-semibold text-amber-600 hover:underline">
          ← Volver al Inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}