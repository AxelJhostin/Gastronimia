import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { Sidebar } from "@/components/dashboard/sidebar";

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
}));

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
      screen.getByRole("link", { name: /crear solicitud/i }),
    ).toHaveAttribute("href", "/dashboard/requests/new");
    expect(screen.queryByText("Inventario General")).not.toBeInTheDocument();
  });

  it("muestra las operaciones de almacén a un encargado", () => {
    identity.current = {
      accessToken: "test-token",
      status: "authenticated",
      user: { email: "encargado@example.com", roles: ["MANAGER"] },
    };

    render(<DashboardPage />);

    expect(screen.getByText("Inventario General")).toBeInTheDocument();
    expect(screen.getByText("Devoluciones Pendientes")).toBeInTheDocument();
    expect(screen.getByText("Incidencias")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /crear solicitud/i }),
    ).not.toBeInTheDocument();
  });

  it("no expone al docente enlaces de operaciones administrativas", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Solicitudes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Inventario y Stock" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Preparaciones" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Devoluciones" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });
});
