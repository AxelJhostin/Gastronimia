import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DispatchInspectionPanel } from "@/components/inventory/dispatch-inspection-panel";
import { InspectionPanel } from "@/components/returns/inspection-panel";

describe("paneles de inspección", () => {
  it("delega el guardado de una inspección de devolución", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <InspectionPanel
        initialItems={[
          {
            condition: "good",
            id: "unit-1",
            name: "Batidora",
            requestedQuantity: 1,
            returnedQuantity: 1,
          },
        ]}
        onSubmit={onSubmit}
        requestId="request-1"
        teacherName="Docente"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Finalizar Inspección" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        items: [
          expect.objectContaining({ condition: "good", id: "unit-1", returnedQuantity: 1 }),
        ],
        requestId: "request-1",
      }),
    );
  });

  it("delega el despacho sin simular una respuesta exitosa", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DispatchInspectionPanel
        activityDate="2026-09-01"
        activityName="Panadería"
        initialItems={[
          {
            availableStock: 5,
            condition: "good",
            dispatchQuantity: 2,
            id: "item-1",
            name: "Bandeja",
            requestedQuantity: 2,
            unit: "unidad",
          },
        ]}
        onSubmit={onSubmit}
        requestId="request-1"
        teacherName="Docente"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Autorizar y Entregar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        generalNotes: "",
        items: [
          {
            condition: "good",
            itemId: "item-1",
            notes: "",
            quantity: 2,
          },
        ],
        mode: "dispatch",
        requestId: "request-1",
      }),
    );
  });
});
