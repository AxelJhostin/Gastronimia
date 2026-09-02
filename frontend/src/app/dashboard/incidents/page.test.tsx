import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import IncidentsPage from "./page";

const api = vi.hoisted(() => ({
  getIncidentEvidences: vi.fn(),
  getIncidentReport: vi.fn(),
}));
const storage = vi.hoisted(() => ({ createSignedUrls: vi.fn() }));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => ({
    accessToken: "manager-token",
    status: "authenticated",
    user: { email: "encargado@example.com", roles: ["MANAGER"] },
  }),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  getIncidentEvidences: api.getIncidentEvidences,
  getIncidentReport: api.getIncidentReport,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ storage: { from: () => storage } }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  api.getIncidentEvidences.mockReset();
  api.getIncidentReport.mockReset();
  storage.createSignedUrls.mockReset();
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
    api.getIncidentEvidences.mockResolvedValue([
      {
        id: "evidence-1",
        equipment_incident_id: "incident-12345678",
        storage_path: "user-1/photo.webp",
        uploaded_by_user_id: "user-1",
        created_at: "2026-09-01T12:01:00Z",
      },
    ]);
    storage.createSignedUrls.mockResolvedValue({
      data: [{ path: "user-1/photo.webp", signedUrl: "http://localhost/signed/photo" }],
      error: null,
    });

    render(<IncidentsPage />);

    await waitFor(() => expect(api.getIncidentReport).toHaveBeenCalledWith("manager-token"));
    expect(await screen.findByText("Golpe en la carcasa")).toBeInTheDocument();
    expect(screen.getByText("Daño")).toBeInTheDocument();
    expect(screen.getByText("Unidad no disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /reportar novedad/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver evidencias" }));
    expect(await screen.findByRole("link", { name: "Abrir evidencia 1" })).toHaveAttribute(
      "href",
      "http://localhost/signed/photo",
    );
  });
});
