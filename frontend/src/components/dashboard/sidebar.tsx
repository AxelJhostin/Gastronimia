// frontend/src/components/dashboard/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboardIdentity } from '@/components/auth/dashboard-identity-provider';
import type { RoleCode } from '@/lib/api/client';

interface NavItem {
  label: string;
  href: string;
  roles: RoleCode[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
  { label: 'Solicitudes', href: '/dashboard/requests', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
  { label: 'Inventario', href: '/dashboard/inventory', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
  { label: 'Preparaciones', href: '/dashboard/preparations', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Devoluciones', href: '/dashboard/returns', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Novedades', href: '/dashboard/incidents', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reportes', href: '/dashboard/reports', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Usuarios', href: '/dashboard/users', roles: ['ADMIN'] },
  { label: 'Auditoría', href: '/dashboard/audit-log', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const identity = useDashboardIdentity();

  const userRoles = identity.status === 'authenticated' ? identity.user.roles : [];

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <nav className="space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}