import { getClientEnv } from "@/lib/env";

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

export async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  
  const basePath = endpoint.startsWith('/api') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}${basePath}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}
