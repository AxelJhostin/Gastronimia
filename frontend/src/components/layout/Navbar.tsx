'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function Navbar() {
  const { user, logout, hasRole } = useAuth();

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold text-amber-500">
            GastroGestión
          </Link>

          <div className="hidden md:flex items-center space-x-4 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-amber-400">Inicio</Link>

            {/* Opciones TEACHER */}
            {hasRole(['TEACHER']) && (
              <>
                <Link href="/solicitudes/nueva" className="hover:text-amber-400">Nueva Solicitud</Link>
                <Link href="/solicitudes/mis-solicitudes" className="hover:text-amber-400">Mis Solicitudes</Link>
              </>
            )}

            {/* Opciones MANAGER / ADMIN */}
            {hasRole(['MANAGER', 'ADMIN']) && (
              <>
                <Link href="/admin/solicitudes" className="hover:text-amber-400">Pendientes</Link>
                <Link href="/admin/inventario" className="hover:text-amber-400">Inventario</Link>
                <Link href="/admin/mantenimiento" className="hover:text-amber-400">Mantenimiento</Link>
                <Link href="/admin/reportes" className="hover:text-amber-400">Reportes</Link>
              </>
            )}

            {/* Opciones Exclusivas ADMIN */}
            {hasRole(['ADMIN']) && (
              <>
                <Link href="/admin/academia" className="hover:text-amber-400">Academia</Link>
                <Link href="/admin/usuarios" className="hover:text-amber-400">Usuarios</Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {user ? (
              <>
                <span className="text-slate-400">
                  {user.email} (<strong className="text-amber-400">{user.roles.join(', ')}</strong>)
                </span>
                <button
                  onClick={logout}
                  className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded bg-amber-600 px-3 py-1 font-semibold text-white">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}