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
