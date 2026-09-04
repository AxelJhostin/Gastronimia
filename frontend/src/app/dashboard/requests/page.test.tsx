import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RequestsPage from "@/app/dashboard/requests/page";

const identity = vi.hoisted(() => ({
  current: {
    accessToken: "test-token",
    status: "authenticated",
    user: { email: "encargado@example.com", roles: ["MANAGER"] },
  },
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => identity.current,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/api/client", () => ({
  getOwnRequests: vi.fn().mockResolvedValue([]),
  getPendingRequests: vi.fn().mockResolvedValue([]),
}));

afterEach(() => {
  cleanup();
  identity.current = {
    accessToken: "test-token",
    status: "authenticated",
    user: { email: "encargado@example.com", roles: ["MANAGER"] },
  };
});

describe("acciones de solicitudes por rol", () => {
  it("no ofrece crear solicitudes al encargado", () => {
    render(<RequestsPage />);

    expect(screen.queryByRole("link", { name: /nueva solicitud/i })).not.toBeInTheDocument();
  });

  it("ofrece crear solicitudes al docente", () => {
    identity.current = {
      accessToken: "test-token",
      status: "authenticated",
      user: { email: "docente@example.com", roles: ["TEACHER"] },
    };

    render(<RequestsPage />);

    expect(screen.getByRole("link", { name: /nueva solicitud/i })).toHaveAttribute("href", "/dashboard/requests/new");
  });
});
