import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChangePasswordPage from "./page";

const mocks = vi.hoisted(() => ({
  complete: vi.fn(), getSession: vi.fn(), refreshSession: vi.fn(),
  replace: vi.fn(), refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/lib/api/client", () => ({ completeTemporaryPasswordChange: mocks.complete }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: mocks }) }));

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: "temporary-token" } }, error: null });
  mocks.refreshSession.mockResolvedValue({ data: { session: { access_token: "activated-token" } }, error: null });
  mocks.complete.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

function submit() {
  fireEvent.change(screen.getByLabelText("Nueva contraseña", { exact: false }), { target: { value: "Personal-safe9!" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña", { exact: false }), { target: { value: "Personal-safe9!" } });
  fireEvent.click(screen.getByRole("button", { name: /Actualizar contraseña/ }));
}

describe("cambio de contraseña temporal", () => {
  it("envía la nueva contraseña al servidor y guarda la sesión renovada", async () => {
    render(<ChangePasswordPage />);
    submit();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.complete).toHaveBeenCalledWith("temporary-token", "Personal-safe9!");
    expect(localStorage.getItem("access_token")).toBe("activated-token");
    expect(localStorage.getItem("token")).toBe("activated-token");
  });

  it("conserva el formulario y permite reintentar cuando el servidor rechaza", async () => {
    mocks.complete.mockRejectedValue(new Error("Usa una contraseña distinta."));
    render(<ChangePasswordPage />);
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Usa una contraseña distinta.");
    expect(screen.getByRole("button", { name: /Actualizar contraseña/ })).toBeEnabled();
    expect(mocks.refreshSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("pide iniciar sesión si la renovación falla después de cambiar la clave", async () => {
    localStorage.setItem("access_token", "temporary-token");
    localStorage.setItem("token", "temporary-token");
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("offline") });
    render(<ChangePasswordPage />);
    submit();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login?reason=password-changed"));
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("no cambia la contraseña si ya no hay sesión", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<ChangePasswordPage />);
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Tu sesión expiró");
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
