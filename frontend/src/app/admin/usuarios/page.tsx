'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '@/lib/api/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId: string, roleToToggle: 'ADMIN' | 'MANAGER' | 'TEACHER', currentRoles: string[]) => {
    const newRoles = currentRoles.includes(roleToToggle)
      ? currentRoles.filter((r) => r !== roleToToggle)
      : [...currentRoles, roleToToggle];

    try {
      setSavingId(userId);
      await adminApi.updateUserRoles(userId, newRoles);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: newRoles as any } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Error al actualizar roles');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="p-6 text-stone-600 text-sm">Cargando usuarios...</p>;
  if (error) return <p className="p-6 text-red-600 text-sm">{error}</p>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Gestión de Usuarios y Roles</h1>
        <p className="text-sm text-stone-500">Asigna o remueve permisos para administradores, encargados y docentes.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-stone-700">
          <thead className="bg-stone-100 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">ID de Usuario</th>
              <th className="p-4">Roles Asignados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="p-4 font-medium text-stone-900">{u.email}</td>
                <td className="p-4 font-mono text-xs text-stone-500">{u.id}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {(['ADMIN', 'MANAGER', 'TEACHER'] as const).map((role) => {
                      const isActive = u.roles.includes(role);
                      return (
                        <button
                          key={role}
                          disabled={savingId === u.id}
                          onClick={() => handleRoleToggle(u.id, role, u.roles)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                            isActive
                              ? 'bg-amber-700 text-white border-amber-700'
                              : 'bg-stone-50 text-stone-600 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}