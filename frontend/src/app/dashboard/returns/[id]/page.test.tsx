import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ReturnDetailPage from "@/app/dashboard/returns/[id]/page";

const api = vi.hoisted(() => ({
  getLoanPending: vi.fn(),
  recordEquipmentReturn: vi.fn(),
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

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "loan-1" }) }));
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
  createClient: () => ({
    storage: { from: vi.fn() },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("flujo de devolución", () => {
  it("registra una devolución parcial con inspección e incidencia", async () => {
    api.getLoanPending.mockResolvedValue({
      loan: {
        id: "loan-1",
        equipment_request_id: "request-1",
        responsible_teacher_id: "teacher-1",
        collected_by_name: "María Pérez",
        delivered_by_user_id: "user-1",
        delivered_at: "2026-09-01T13:00:00Z",
        created_at: "2026-09-01T13:00:00Z",
        status: "ACTIVE",
        closed_at: null,
        is_overdue: false,
      },
      quantity_details: [
        {
          equipment_loan_detail_id: "loan-detail-1",
          inventory_item_id: "item-1",
          location_id: "location-1",
          loaned_quantity: 5,
          returned_quantity: 0,
          pending_quantity: 5,
          inventory_item_name: "Harina",
          inventory_item_code: "HAR-01",
          unit_of_measure: "kg",
        },
      ],
      unit_ids_pending: ["loan-unit-1"],
      pending_units: [
        {
          equipment_loan_unit_id: "loan-unit-1",
          inventory_unit_id: "unit-1",
          asset_tag: "BAT-001",
          serial_number: "SER-001",
          condition: "GOOD",
        },
      ],
    });
    api.recordEquipmentReturn.mockResolvedValue({
      id: "return-1",
      equipment_loan_id: "loan-1",
      returned_by_name: "María Pérez",
      received_by_user_id: "user-1",
      returned_at: "2026-09-01T16:00:00Z",
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
      incidents: [
        {
          id: "incident-1",
          inventory_unit_id: "unit-1",
          incident_type: "DAMAGE",
          severity: "HIGH",
          description: "Golpe en la carcasa",
          requires_unavailable: true,
        },
      ],
    });

    render(<ReturnDetailPage />);

    expect(await screen.findByRole("heading", { name: /recepcionar préstamo/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Cantidad devuelta"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Condición observada"), {
      target: { value: "DAMAGED" },
    });
    fireEvent.change(screen.getByLabelText("Novedad"), {
      target: { value: "DAMAGE" },
    });
    fireEvent.change(screen.getByLabelText("Severidad"), {
      target: { value: "HIGH" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Golpe en la carcasa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolución e inspección" }));
    fireEvent.click(await screen.findByRole("button", { name: "Registrar devolución" }));

    await waitFor(() =>
      expect(api.recordEquipmentReturn).toHaveBeenCalledWith("test-token", "loan-1", {
        returned_by_name: "María Pérez",
        quantity_details: [
          {
            equipment_loan_detail_id: "loan-detail-1",
            returned_quantity: 2,
            location_id: "location-1",
          },
        ],
        loan_unit_ids: ["loan-unit-1"],
      }),
    );
    expect(api.recordReturnInspection).toHaveBeenCalledWith("test-token", "return-1", {
      notes: undefined,
      items: [
        {
          inventory_unit_id: "unit-1",
          observed_condition: "DAMAGED",
          is_complete: true,
          incidents: [
            {
              incident_type: "DAMAGE",
              severity: "HIGH",
              description: "Golpe en la carcasa",
            },
          ],
        },
      ],
    });
    expect(await screen.findByText("Devolución e inspección registradas")).toBeInTheDocument();
  });
});
