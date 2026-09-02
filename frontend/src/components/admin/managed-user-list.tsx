"use client";

import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  getManagedUsers,
  updateManagedUserRoles,
  updateManagedUserStatus,
  type ManagedUser,
  type RoleCode,
} from "@/lib/api/client";

const ROLES: RoleCode[] = ["ADMIN", "MANAGER", "TEACHER"];

export function ManagedUserList() {
  const identity = useDashboardIdentity();
  const currentUserId = identity.status === "authenticated" ? identity.user.id : null;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, RoleCode[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<ManagedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (identity.status !== "authenticated") return;
    void getManagedUsers(identity.accessToken)
      .then((data) => {
        setUsers(data);
        setDraftRoles(Object.fromEntries(data.map((user) => [user.id, user.roles])));
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error ? loadError.message : "No fue posible cargar los usuarios.",
        ),
      )
      .finally(() => setLoading(false));
  }, [identity]);

  const toggleRole = (userId: string, role: RoleCode) => {
    setDraftRoles((current) => {
      const roles = current[userId] ?? [];
      return {
        ...current,
        [userId]: roles.includes(role)
          ? roles.filter((candidate) => candidate !== role)
          : [...roles, role],
      };
    });
  };

  const saveRoles = async (user: ManagedUser) => {
    if (identity.status !== "authenticated") return;
    const roles = draftRoles[user.id] ?? [];
    if (roles.length === 0) {
      setError("Cada usuario debe conservar al menos un rol.");
      return;
    }

    setSavingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await updateManagedUserRoles(identity.accessToken, user.id, roles);
      setUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id ? { ...candidate, roles } : candidate,
        ),
      );
      setSuccess(`Roles de ${user.full_name} actualizados.`);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible actualizar los roles.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const saveStatus = async () => {
    if (identity.status !== "authenticated" || !pendingStatusUser) return;
    const user = pendingStatusUser;
    const nextStatus = !user.is_active;

    setSavingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await updateManagedUserStatus(identity.accessToken, user.id, nextStatus);
      setUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id
            ? { ...candidate, is_active: nextStatus }
            : candidate,
        ),
      );
      setSuccess(
        `${user.full_name} fue ${nextStatus ? "activado" : "desactivado"}.`,
      );
      setPendingStatusUser(null);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible actualizar el estado del usuario.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-sm text-stone-500">Cargando usuarios…</p>;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold">Usuarios existentes</h2>
        <p className="text-sm text-stone-600">Consulta cuentas y cambia sus permisos sin usar identificadores manuales.</p>
      </div>
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div> : null}
      {success ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{success}</div> : null}
      <div className="space-y-3">
        {users.map((user) => (
          <article className="rounded-xl border border-stone-200 p-4" key={user.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-xs text-stone-500">{user.email} · {user.is_active ? "Cuenta activa" : "Cuenta inactiva"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {ROLES.map((role) => (
                  <label className="flex items-center gap-1.5 text-xs font-semibold" key={role}>
                    <input checked={(draftRoles[user.id] ?? []).includes(role)} onChange={() => toggleRole(user.id, role)} type="checkbox" />
                    {role}
                  </label>
                ))}
                <button className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={savingId === user.id} onClick={() => void saveRoles(user)} type="button">{savingId === user.id ? "Guardando…" : "Guardar roles"}</button>
                <button className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${user.is_active ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"}`} disabled={savingId === user.id || currentUserId === user.id} onClick={() => setPendingStatusUser(user)} type="button">{currentUserId === user.id ? "Cuenta actual" : user.is_active ? "Desactivar" : "Activar"}</button>
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 ? <p className="rounded-xl bg-stone-50 p-5 text-sm text-stone-500">No hay usuarios administrables.</p> : null}
      </div>
      <ConfirmModal
        confirmLabel={pendingStatusUser?.is_active ? "Desactivar cuenta" : "Activar cuenta"}
        description={pendingStatusUser?.is_active ? "La persona perderá acceso al sistema hasta que un administrador reactive la cuenta." : "La persona podrá volver a ingresar con sus roles actuales."}
        isOpen={pendingStatusUser !== null}
        isSubmitting={savingId === pendingStatusUser?.id}
        onClose={() => setPendingStatusUser(null)}
        onConfirm={() => void saveStatus()}
        title={pendingStatusUser?.is_active ? "Confirmar desactivación" : "Confirmar activación"}
        tone={pendingStatusUser?.is_active ? "danger" : "positive"}
      />
    </section>
  );
}
