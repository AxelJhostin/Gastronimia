import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewRequestForm } from "./new-request-form";

const router = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));
const identity = vi.hoisted(() => ({
  current: {
    accessToken: "teacher-token",
    status: "authenticated" as const,
    user: {
      email: "docente@example.com",
      must_change_password: false,
      roles: ["TEACHER"],
    },
  },
}));
const api = vi.hoisted(() => ({
  createEquipmentRequestDraft: vi.fn(),
  getEquipmentRequestFormOptions: vi.fn(),
  submitEquipmentRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/components/auth/dashboard-identity-provider", () => ({
  useDashboardIdentity: () => identity.current,
}));

vi.mock("@/lib/api/client", () => ({
  createEquipmentRequestDraft: api.createEquipmentRequestDraft,
  getEquipmentRequestFormOptions: api.getEquipmentRequestFormOptions,
  submitEquipmentRequest: api.submitEquipmentRequest,
}));

const options = {
  course_sections: [
    {
      academic_period_id: "period-1",
      created_at: "2035-01-01T00:00:00Z",
      id: "section-1",
      is_active: true,
      section: "A",
      semester: "1",
      subject_id: "subject-1",
      teacher_id: "teacher-1",
      updated_at: "2035-01-01T00:00:00Z",
    },
  ],
  inventory_items: [
    {
      category_id: "category-1",
      code: "BAT-01",
      created_at: "2035-01-01T00:00:00Z",
      description: null,
      id: "item-1",
      is_active: true,
      name: "Batidora",
      tracking_mode: "QUANTITY" as const,
      unit_of_measure: "unidad",
      updated_at: "2035-01-01T00:00:00Z",
    },
  ],
  laboratories: [
    {
      code: "LAB-01",
      created_at: "2035-01-01T00:00:00Z",
      id: "laboratory-1",
      is_active: true,
      location_description: null,
      name: "Laboratorio de cocina",
    },
  ],
};

describe("NewRequestForm", () => {
  beforeEach(() => {
    router.back.mockReset();
    router.push.mockReset();
    api.createEquipmentRequestDraft.mockReset();
    api.getEquipmentRequestFormOptions.mockReset();
    api.submitEquipmentRequest.mockReset();
    api.getEquipmentRequestFormOptions.mockResolvedValue(options);
    api.createEquipmentRequestDraft.mockResolvedValue({ id: "request-1" });
    api.submitEquipmentRequest.mockResolvedValue({ id: "request-1", status: "PENDING" });
  });

  it("crea y envía una solicitud usando el contrato de FastAPI", async () => {
    render(<NewRequestForm />);

    await screen.findByRole("option", { name: "Laboratorio de cocina" });

    fireEvent.change(screen.getByLabelText("Sección"), {
      target: { value: "section-1" },
    });
    fireEvent.change(screen.getByLabelText("Laboratorio"), {
      target: { value: "laboratory-1" },
    });
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2035-06-01T13:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2035-06-01T15:00" },
    });
    fireEvent.change(screen.getByLabelText("Propósito de la práctica"), {
      target: { value: "Práctica de panadería" },
    });
    fireEvent.change(screen.getByLabelText("Artículo"), {
      target: { value: "item-1" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => {
      expect(api.createEquipmentRequestDraft).toHaveBeenCalledWith("teacher-token", {
        course_section_id: "section-1",
        laboratory_id: "laboratory-1",
        start_at: new Date("2035-06-01T13:00").toISOString(),
        end_at: new Date("2035-06-01T15:00").toISOString(),
        purpose: "Práctica de panadería",
        items: [{ inventory_item_id: "item-1", requested_quantity: 3 }],
      });
    });
    expect(api.submitEquipmentRequest).toHaveBeenCalledWith("teacher-token", "request-1");
    expect(router.push).toHaveBeenCalledWith("/dashboard/requests/request-1");
  });
});
