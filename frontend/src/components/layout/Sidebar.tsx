'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Academia', href: '/academia' },
  { name: 'Inventario', href: '/inventario' },
  { name: 'Solicitudes', href: '/solicitudes' },
  { name: 'Compras', href: '/compras' },
  { name: 'Reservas', href: '/reservas' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-amber-500">GastroGestión</h1>
          <p className="text-xs text-slate-400">Sistema de Control Gastronómico</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-800 pt-4 px-2 text-xs text-slate-500">
        MVP v1.0.0
      </div>
    </aside>
  );
}