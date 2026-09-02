import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import IncidentsPage from "./page";

const api = vi.hoisted(() => ({
  getIncidentReport: vi.fn(),
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => ({
    accessToken: "manager-token",
    status: "authenticated",
    user: { email: "encargado@example.com", roles: ["MANAGER"] },
  }),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  getIncidentReport: api.getIncidentReport,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  api.getIncidentReport.mockReset();
});

describe("reporte de incidencias", () => {
  it("carga las incidencias desde FastAPI y muestra su trazabilidad", async () => {
    api.getIncidentReport.mockResolvedValue([
      {
        created_at: "2026-09-01T12:00:00Z",
        description: "Golpe en la carcasa",
        equipment_loan_id: "loan-12345678",
        equipment_request_id: "request-12345678",
        evidence_count: 1,
        id: "incident-12345678",
        incident_type: "DAMAGE",
        inventory_unit_id: "unit-12345678",
        requires_unavailable: true,
        severity: "HIGH",
      },
    ]);

    render(<IncidentsPage />);

    await waitFor(() => expect(api.getIncidentReport).toHaveBeenCalledWith("manager-token"));
    expect(await screen.findByText("Golpe en la carcasa")).toBeInTheDocument();
    expect(screen.getByText("Daño")).toBeInTheDocument();
    expect(screen.getByText("Unidad no disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /reportar novedad/i })).not.toBeInTheDocument();
  });
});
