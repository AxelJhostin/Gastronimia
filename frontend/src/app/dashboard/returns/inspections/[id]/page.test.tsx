import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PendingReturnInspectionPage from "@/app/dashboard/returns/inspections/[id]/page";

const api = vi.hoisted(() => ({
  getPendingReturnInspection: vi.fn(),
  recordReturnInspection: vi.fn(),
  registerIncidentEvidence: vi.fn(),
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => ({
    accessToken: "test-token",
    status: "authenticated",
    user: { id: "user-1", email: "manager@example.com", roles: ["MANAGER"] },
  }),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "return-1" }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  ...api,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ storage: { from: vi.fn() } }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("recuperación de inspecciones de devolución", () => {
  it("permite completar una devolución cuantitativa después de recargar", async () => {
    api.getPendingReturnInspection.mockResolvedValue({
      equipment_return: {
        id: "return-1",
        equipment_loan_id: "loan-1",
        returned_by_name: "María Pérez",
        received_by_user_id: "user-1",
        returned_at: "2026-09-01T16:00:00Z",
      },
      loan: {
        id: "loan-1",
        equipment_request_id: "request-1",
        responsible_teacher_id: "teacher-1",
        collected_by_name: "María Pérez",
        delivered_by_user_id: "user-1",
        delivered_at: "2026-09-01T13:00:00Z",
        created_at: "2026-09-01T13:00:00Z",
        status: "CLOSED",
        closed_at: "2026-09-01T16:00:00Z",
        is_overdue: false,
      },
      units: [],
    });
    api.recordReturnInspection.mockResolvedValue({
      id: "inspection-1",
      equipment_request_id: "request-1",
      equipment_loan_id: "loan-1",
      equipment_return_id: "return-1",
      stage: "RETURN",
      inspected_by_user_id: "user-1",
      inspected_at: "2026-09-01T16:01:00Z",
      notes: null,
      incidents: [],
    });

    render(<PendingReturnInspectionPage />);

    expect(await screen.findByText(/únicamente recursos por cantidad/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Completar inspección" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const confirmationButtons = screen.getAllByRole("button", {
      name: "Completar inspección",
    });
    fireEvent.click(confirmationButtons[confirmationButtons.length - 1]);

    await waitFor(() =>
      expect(api.recordReturnInspection).toHaveBeenCalledWith("test-token", "return-1", {
        notes: undefined,
        items: [],
      }),
    );
    expect(await screen.findByText("Inspección completada")).toBeInTheDocument();
  });
});
