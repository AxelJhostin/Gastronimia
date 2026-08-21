'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function Navbar() {
  const { usuario, logout, tieneRol } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-lg font-bold text-amber-500">
              GastroGestión
            </Link>
          </div>

          {/* Menú Escritorio */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-medium">
            <Link href="/" className="hover:text-amber-400">Inicio</Link>
            {tieneRol(['ADMIN', 'ALMACEN']) && (
              <>
                <Link href="/inventario" className="hover:text-amber-400">Inventario</Link>
                <Link href="/compras" className="hover:text-amber-400">Compras</Link>
              </>
            )}
            {tieneRol(['ADMIN', 'PROFESOR', 'ALMACEN']) && (
              <Link href="/solicitudes" className="hover:text-amber-400">Solicitudes</Link>
            )}
            {tieneRol(['ADMIN', 'PROFESOR']) && (
              <Link href="/reservas" className="hover:text-amber-400">Reservas</Link>
            )}
            {tieneRol(['ADMIN']) && (
              <Link href="/academia" className="hover:text-amber-400">Academia</Link>
            )}
          </div>

          {/* Estado de Usuario */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {usuario ? (
              <>
                <span className="text-slate-400">
                  {usuario.nombre} (<strong className="text-amber-400">{usuario.rol}</strong>)
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

          {/* Botón Móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {menuAbierto && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 text-sm bg-slate-800 border-t border-slate-700">
          <Link href="/" onClick={() => setMenuAbierto(false)} className="block py-1">Inicio</Link>
          {tieneRol(['ADMIN', 'ALMACEN']) && (
            <>
              <Link href="/inventario" onClick={() => setMenuAbierto(false)} className="block py-1">Inventario</Link>
              <Link href="/compras" onClick={() => setMenuAbierto(false)} className="block py-1">Compras</Link>
            </>
          )}
          {tieneRol(['ADMIN', 'PROFESOR', 'ALMACEN']) && (
            <Link href="/solicitudes" onClick={() => setMenuAbierto(false)} className="block py-1">Solicitudes</Link>
          )}
          {tieneRol(['ADMIN', 'PROFESOR']) && (
            <Link href="/reservas" onClick={() => setMenuAbierto(false)} className="block py-1">Reservas</Link>
          )}
          {tieneRol(['ADMIN']) && (
            <Link href="/academia" onClick={() => setMenuAbierto(false)} className="block py-1">Academia</Link>
          )}
          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
            {usuario ? (
              <>
                <span className="text-slate-400">{usuario.nombre} ({usuario.rol})</span>
                <button onClick={logout} className="text-amber-400 font-semibold">Salir</button>
              </>
            ) : (
              <Link href="/login" className="text-amber-400 font-semibold">Ingresar</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}