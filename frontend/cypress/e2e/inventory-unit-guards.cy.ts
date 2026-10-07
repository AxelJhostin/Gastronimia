import { api } from "../support/api";
import type { SeedScenario } from "../support/types";
import type { InventoryUnit } from "../../src/lib/api/client";

type IndividualScenario = SeedScenario & { individualItemId: string; unitId: string; loanId: string; requestId: string };

function login(scenario: SeedScenario) {
  cy.loginAs(scenario.manager.email, scenario.manager.password);
  cy.visit("/dashboard");
}

function unit(id: string) {
  return api<InventoryUnit[]>("/admin/inventory/units").then((rows) => {
    const value = rows.find((row) => row.id === id);
    expect(value, "unidad creada para la prueba").not.to.equal(undefined);
    return value!;
  });
}

describe("R-03 protección de unidades", () => {
  it("rechaza estados operativos, daño disponible y cambio de artículo; conserva edición e historial", () => {
    cy.seedBase().then((scenario) => {
      login(scenario);
      api<Array<{ id: string }>>("/admin/inventory/categories").then((categories) => {
        api<{ id: string }>("/admin/inventory/items", "POST", { category_id: categories[0].id, name: `QA reglas ${scenario.marker}`, tracking_mode: "INDIVIDUAL" }, 201).then((item) => {
          const data = { inventory_item_id: item.id, location_id: scenario.locationId, asset_tag: `QA-R03-${scenario.marker}`, condition: "GOOD", status: "AVAILABLE" };
          for (const status of ["LOANED", "MAINTENANCE"]) api("/admin/inventory/units", "POST", { ...data, status }, 422);
          api("/admin/inventory/units", "POST", { ...data, condition: "DAMAGED" }, 422);
          api<InventoryUnit>("/admin/inventory/units", "POST", data, 201).then((created) => {
            for (const status of ["LOANED", "MAINTENANCE"]) api(`/admin/inventory/units/${created.id}`, "PATCH", { ...created, status }, 422);
            api(`/admin/inventory/units/${created.id}`, "PATCH", { ...created, condition: "DAMAGED" }, 422);
            api(`/admin/inventory/units/${created.id}`, "PATCH", { ...created, inventory_item_id: scenario.inventoryItemId }, 409);
            api(`/admin/inventory/units/${created.id}`, "PATCH", { ...created, status: "DISABLED", condition: "DAMAGED" }).its("status").should("eq", "DISABLED");
            api(`/admin/inventory/units/${created.id}`, "PATCH", { ...created, notes: "QA reparada y revisada" }).its("status").should("eq", "AVAILABLE");
            api<unknown[]>(`/admin/inventory/units/${created.id}/history`).should("have.length", 3);
            cy.visit("/dashboard/inventory/manage");
            cy.contains("li", data.asset_tag).contains("button", "Editar").click();
            cy.get('[role="dialog"]').within(() => {
              cy.get('select[name="inventory_item_id"]').should("not.exist");
              cy.get('select[name="status"] option').then((options) => expect([...options].map((option) => (option as HTMLOptionElement).value)).not.to.include.members(["LOANED", "MAINTENANCE"]));
              cy.get('input[name="notes"]').clear().type("QA edición segura");
              cy.contains("button", "Guardar cambios").click();
            });
            cy.get('[role="dialog"]').should("not.exist");
            unit(created.id).its("notes").should("eq", "QA edición segura");
          });
        });
      });
    });
  });

  it("bloquea la edición de una unidad seleccionada para preparación", () => {
    cy.task<IndividualScenario>("seed:individual-prepared").then((scenario) => {
      login(scenario);
      unit(scenario.unitId).then((current) => {
        api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "DISABLED" }, 409);
        api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, is_active: false }, 409);
        api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, location_id: null }, 409);
        unit(current.id).should("deep.equal", current);
      });
    });
  });

  it("impide liberar un préstamo o saltar la inspección y permite la devolución normal", () => {
    cy.task<IndividualScenario>("seed:individual-loan").then((scenario) => {
      login(scenario);
      unit(scenario.unitId).then((current) => {
        api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "AVAILABLE" }, 409);
        unit(current.id).its("status").should("eq", "LOANED");
        api<{ unit_ids_pending: string[] }>(`/admin/returns/loans/${scenario.loanId}/pending`).then((pending) => {
          api<{ id: string }>(`/admin/returns/loans/${scenario.loanId}`, "POST", { returned_by_name: "QA devolución R-03", quantity_details: [], loan_unit_ids: pending.unit_ids_pending }).then((returned) => {
            api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "AVAILABLE" }, 409);
            unit(current.id).its("status").should("eq", "MAINTENANCE");
            api(`/admin/inspections/returns/${returned.id}`, "POST", { items: [{ inventory_unit_id: current.id, observed_condition: "GOOD", is_complete: true }] });
            unit(current.id).its("status").should("eq", "AVAILABLE");
            api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "AVAILABLE", notes: "QA devolución cerrada" }).its("notes").should("eq", "QA devolución cerrada");
            api<{ loan: { status: string }; unit_ids_pending: string[] }>(`/admin/returns/loans/${scenario.loanId}/pending`).then((result) => {
              expect(result.loan.status).to.equal("CLOSED");
              expect(result.unit_ids_pending).to.have.length(0);
            });
            api<Array<{ current_status: string }>>(`/admin/inventory/units/${current.id}/history`).then((history) => expect(history.map((entry) => entry.current_status)).to.include.members(["LOANED", "MAINTENANCE", "AVAILABLE"]));
          });
        });
      });
    });
  });

  it("impide editar una unidad en mantenimiento y permite cerrarlo por su flujo", () => {
    cy.task<IndividualScenario>("seed:individual-prepared").then((scenario) => {
      login(scenario);
      // Otra unidad libre del mismo artículo, sin preparación activa.
      api<InventoryUnit>("/admin/inventory/units", "POST", { inventory_item_id: scenario.individualItemId, asset_tag: `QA-MAN-R03-${scenario.marker}` }, 201).then((current) => {
        api<{ id: string }>("/admin/maintenance", "POST", { inventory_unit_id: current.id, maintenance_type: "PREVENTIVE", reason: "QA revisión" }).then((maintenance) => {
          api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "AVAILABLE" }, 409);
          api(`/admin/inventory/units/${current.id}`, "PATCH", { ...current, status: "DISABLED", is_active: false }, 409);
          unit(current.id).its("status").should("eq", "MAINTENANCE");
          api(`/admin/maintenance/${maintenance.id}/complete`, "POST", { final_status: "AVAILABLE", final_condition: "GOOD", resolution: "QA revisión completada" }).its("status").should("eq", "COMPLETED");
          unit(current.id).its("status").should("eq", "AVAILABLE");
        });
      });
    });
  });
});
