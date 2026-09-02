import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DeliveryDetailPage from "@/app/dashboard/deliveries/[id]/page";

const api = vi.hoisted(() => ({
  deliverEquipmentRequest: vi.fn(),
  generateEquipmentDeliveryQr: vi.fn(),
  getEquipmentPreparationContext: vi.fn(),
  getInventoryStock: vi.fn(),
  recordOutboundInspection: vi.fn(),
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => ({
    accessToken: "test-token",
    status: "authenticated",
    user: { email: "encargado@example.com", roles: ["MANAGER"] },
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "request-1" }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  ...api,
}));

const context = {
  request: {
    id: "request-1",
    teacher_id: "teacher-1",
    course_section_id: "section-1",
    laboratory_id: "laboratory-1",
    start_at: "2026-09-01T14:00:00Z",
    end_at: "2026-09-01T16:00:00Z",
    purpose: "Clase práctica",
    status: "PREPARED" as const,
    submitted_at: "2026-08-31T14:00:00Z",
    created_at: "2026-08-31T13:00:00Z",
    updated_at: "2026-09-01T13:00:00Z",
  },
  items: [
    {
      equipment_reservation_detail_id: "detail-quantity",
      inventory_item_id: "item-quantity",
      inventory_item_name: "Harina",
      inventory_item_code: "HAR-01",
      tracking_mode: "QUANTITY" as const,
      unit_of_measure: "kg",
      reserved_quantity: 2,
      available_units: [],
      prepared_units: [],
    },
    {
      equipment_reservation_detail_id: "detail-unit",
      inventory_item_id: "item-unit",
      inventory_item_name: "Batidora",
      inventory_item_code: "BAT-01",
      tracking_mode: "INDIVIDUAL" as const,
      unit_of_measure: "unidad",
      reserved_quantity: 1,
      available_units: [],
      prepared_units: [
        {
          id: "unit-1",
          asset_tag: "BAT-001",
          serial_number: "SER-001",
          condition: "GOOD" as const,
        },
      ],
    },
  ],
  outbound_inspection: null,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("flujo de entrega", () => {
  it("registra inspección, genera el token y confirma el préstamo", async () => {
    api.getEquipmentPreparationContext.mockResolvedValue(context);
    api.getInventoryStock.mockResolvedValue([
      {
        inventory_item_id: "item-quantity",
        inventory_item_code: "HAR-01",
        inventory_item_name: "Harina",
        unit_of_measure: "kg",
        location_id: "location-1",
        location_code: "A-01",
        location_name: "Bodega principal",
        quantity: 5,
        updated_at: "2026-09-01T13:00:00Z",
      },
    ]);
    api.recordOutboundInspection.mockResolvedValue({
      id: "inspection-1",
      equipment_request_id: "request-1",
      equipment_loan_id: null,
      equipment_return_id: null,
      stage: "OUTBOUND",
      inspected_by_user_id: "user-1",
      inspected_at: "2026-09-01T13:10:00Z",
      notes: null,
    });
    api.generateEquipmentDeliveryQr.mockResolvedValue({
      token: "token-123",
      expires_at: "2099-09-01T13:40:00Z",
    });
    api.deliverEquipmentRequest.mockResolvedValue({
      id: "loan-1",
      equipment_request_id: "request-1",
      responsible_teacher_id: "teacher-1",
      collected_by_name: "María Pérez",
      delivered_by_user_id: "user-1",
      delivered_at: "2026-09-01T13:12:00Z",
      created_at: "2026-09-01T13:12:00Z",
      status: "ACTIVE",
      closed_at: null,
      is_overdue: false,
    });

    render(<DeliveryDetailPage />);

    expect(await screen.findByRole("heading", { name: /entregar solicitud/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Registrar inspección de salida" }));

    await waitFor(() =>
      expect(api.recordOutboundInspection).toHaveBeenCalledWith("test-token", "request-1", {
        notes: undefined,
        items: [
          {
            inventory_unit_id: "unit-1",
            observed_condition: "GOOD",
            is_complete: true,
          },
        ],
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Generar token temporal" }));
    expect(await screen.findByText("token-123")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombre de quien retira"), {
      target: { value: "María Pérez" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar entrega" }));

    await waitFor(() =>
      expect(api.deliverEquipmentRequest).toHaveBeenCalledWith("test-token", {
        qr_token: "token-123",
        collected_by_name: "María Pérez",
        quantity_locations: [
          {
            equipment_reservation_detail_id: "detail-quantity",
            location_id: "location-1",
            loaned_quantity: 2,
          },
        ],
      }),
    );
    expect(await screen.findByText(/préstamo #loan-1 activo/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir devolución" })).toHaveAttribute(
      "href",
      "/dashboard/returns/loan-1",
    );
  });
});
