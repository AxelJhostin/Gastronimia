import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, getCurrentUser } from "@/lib/api/client";

const auth = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth }),
}));

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  });
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  auth.refreshSession.mockReset();
  auth.signOut.mockReset();
});

describe("cliente de FastAPI", () => {
  it("muestra los detalles de validación 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: vi.fn().mockResolvedValue({
          detail: [
            { loc: ["body", "items", 0], msg: "La cantidad debe ser mayor que cero." },
          ],
        }),
      }),
    );

    await expect(getCurrentUser("token")).rejects.toEqual(
      new ApiError("La cantidad debe ser mayor que cero.", 422),
    );
  });

  it("renueva una sesión vencida y reintenta una sola vez", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ detail: "Credenciales inválidas." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "manager@example.com",
          roles: ["MANAGER"],
          must_change_password: false,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    auth.refreshSession.mockResolvedValue({
      data: { session: { access_token: "fresh-token" } },
      error: null,
    });

    const user = await getCurrentUser("expired-token");

    expect(user.id).toBe("user-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer fresh-token");
    expect(localStorage.getItem("access_token")).toBe("fresh-token");
  });
});
