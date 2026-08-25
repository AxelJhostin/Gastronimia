import { getClientEnv } from "@/lib/env";

export type RoleCode = "ADMIN" | "MANAGER" | "TEACHER";

export type CurrentUser = {
  id: string;
  email: string | null;
  roles: RoleCode[];
  must_change_password: boolean;
};

export type CreateUserInvitationInput = {
  email: string;
  full_name: string;
  roles: RoleCode[];
};

export type ProvisionedUser = {
  user_id: string;
  email: string;
  full_name: string;
  roles: RoleCode[];
  temporary_password: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestApi<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: unknown;
    } | null;
    const message =
      typeof body?.detail === "string"
        ? body.detail
        : "No fue posible completar la operación.";
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getApiHealth() {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/health`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("No fue posible verificar el estado de la API.");
  }

  return (await response.json()) as { status: string };
}

export function getCurrentUser(accessToken: string) {
  return requestApi<CurrentUser>("/auth/me", accessToken);
}

export function createManagedUser(
  accessToken: string,
  input: CreateUserInvitationInput,
) {
  return requestApi<ProvisionedUser>("/admin/users", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function completeTemporaryPasswordChange(accessToken: string) {
  return requestApi<void>("/auth/password-change-complete", accessToken, {
    method: "POST",
  });
}
