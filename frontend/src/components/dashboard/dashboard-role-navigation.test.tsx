import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { DashboardShell } from "@/components/dashboard/sidebar";

const identity = vi.hoisted(() => ({
  current: {
    accessToken: "test-token",
    status: "authenticated",
    user: {
      email: "usuario@example.com",
      roles: ["TEACHER"],
    },
  },
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => identity.current,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: vi.fn() } }),
}));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>("@/lib/api/client");
  return {
    ...actual,
    getActiveLoans: vi.fn().mockResolvedValue([]),
    getEquipmentMaintenances: vi.fn().mockResolvedValue([]),
    getIncidentReport: vi.fn().mockResolvedValue([]),
    getInventoryStock: vi.fn().mockResolvedValue([]),
    getManagedUsers: vi.fn().mockResolvedValue([]),
    getOwnLoans: vi.fn().mockResolvedValue([]),
    getOwnRequests: vi.fn().mockResolvedValue([]),
    getPendingRequests: vi.fn().mockResolvedValue([]),
    getPendingReturnInspections: vi.fn().mockResolvedValue([]),
  };
});

afterEach(() => {
  cleanup();
  identity.current = {
    accessToken: "test-token",
    status: "authenticated",
    user: { email: "usuario@example.com", roles: ["TEACHER"] },
  };
});

describe("navegación por roles", () => {
  it("muestra al docente el acceso para crear solicitudes", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("link", { name: /nueva solicitud/i }),
    ).toHaveAttribute("href", "/dashboard/requests/new");
    expect(screen.queryByText("Solicitudes por revisar")).not.toBeInTheDocument();
  });

  it("muestra las operaciones de almacén a un encargado", async () => {
    identity.current = {
      accessToken: "test-token",
      status: "authenticated",
      user: { email: "encargado@example.com", roles: ["MANAGER"] },
    };

    render(<DashboardPage />);

    expect(await screen.findByText("Solicitudes por revisar")).toBeInTheDocument();
    expect(screen.getByText("Préstamos activos")).toBeInTheDocument();
    expect(screen.getByText("Incidencias prioritarias")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /nueva solicitud/i }),
    ).not.toBeInTheDocument();
  });

  it("no expone al docente enlaces de operaciones administrativas", () => {
    render(<DashboardShell><div>Contenido</div></DashboardShell>);

    expect(screen.getAllByRole("link", { name: "Inicio" })).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: "Solicitudes" }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: "Mis préstamos" }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: "Inventario y stock" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Preparaciones" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Devoluciones" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Entregas" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("ajusta el menú del encargado a sus funciones operativas", () => {
    identity.current = {
      accessToken: "test-token",
      status: "authenticated",
      user: { email: "encargado@example.com", roles: ["MANAGER"] },
    };

    render(<DashboardShell><div>Contenido</div></DashboardShell>);

    expect(screen.getAllByRole("link", { name: "Préstamos y devoluciones" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Auditoría" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mis préstamos" })).not.toBeInTheDocument();
  });
});
