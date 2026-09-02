import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManagedUserList } from "./managed-user-list";

const api = vi.hoisted(() => ({
  getManagedUsers: vi.fn(),
  updateManagedUserRoles: vi.fn(),
  updateManagedUserStatus: vi.fn(),
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => ({
    status: "authenticated",
    accessToken: "test-token",
    user: {
      id: "admin-id",
      email: "admin@example.test",
      roles: ["ADMIN"],
      must_change_password: false,
    },
  }),
}));

vi.mock("@/lib/api/client", () => api);

describe("ManagedUserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getManagedUsers.mockResolvedValue([
      {
        id: "teacher-id",
        email: "teacher@example.test",
        full_name: "Docente Prueba",
        is_active: true,
        roles: ["TEACHER"],
      },
    ]);
    api.updateManagedUserStatus.mockResolvedValue(undefined);
  });

  it("confirma y desactiva una cuenta administrada", async () => {
    render(<ManagedUserList />);

    expect(await screen.findByText("Docente Prueba")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    fireEvent.click(screen.getByRole("button", { name: "Desactivar cuenta" }));

    await waitFor(() =>
      expect(api.updateManagedUserStatus).toHaveBeenCalledWith(
        "test-token",
        "teacher-id",
        false,
      ),
    );
    expect(await screen.findByText("Docente Prueba fue desactivado.")).toBeInTheDocument();
  });
});
