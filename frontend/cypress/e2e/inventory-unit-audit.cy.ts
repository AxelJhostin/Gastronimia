import { api } from "../support/api";
import type { InventoryUnit, OperationalAuditLog } from "../../src/lib/api/client";

describe("R-04 responsable de la edición de unidades", () => {
  for (const role of ["manager", "admin"] as const) {
    it(`registra a ${role}, conserva los valores y muestra los cambios al administrador`, () => {
      cy.seedBase().then((scenario) => {
        const actor = scenario[role];
        cy.loginAs(actor.email, actor.password);
        cy.visit("/dashboard");
        api<Array<{ id: string }>>("/admin/inventory/categories").then((categories) => {
          api<{ id: string }>("/admin/inventory/items", "POST", { category_id: categories[0].id, name: `QA auditoría ${scenario.marker}`, tracking_mode: "INDIVIDUAL" }, 201).then((item) => {
            api<InventoryUnit>("/admin/inventory/units", "POST", { inventory_item_id: item.id, asset_tag: `QA-R04-${scenario.marker}`, location_id: scenario.locationId }, 201).then((unit) => {
              const first = { ...unit, status: "DISABLED", condition: "FAIR", is_active: false, location_id: null };
              api(`/admin/inventory/units/${unit.id}`, "PATCH", { ...first, p_user_id: scenario.teacher.id, performed_by_user_id: scenario.teacher.id });
              const second = { ...first, notes: `QA nota ${scenario.marker}`, serial_number: `QA-SER-${scenario.marker}` };
              api(`/admin/inventory/units/${unit.id}`, "PATCH", second);
              // Reenviar los mismos valores no crea un evento de cambio ficticio.
              api(`/admin/inventory/units/${unit.id}`, "PATCH", second);
              api(`/admin/inventory/units/${unit.id}`, "PATCH", { ...second, inventory_item_id: scenario.inventoryItemId }, 409);
              if (role === "manager") api("/admin/audit", "GET", undefined, 403);
              cy.loginAs(scenario.admin.email, scenario.admin.password);
              cy.visit("/dashboard/audit-log");
              api<OperationalAuditLog[]>("/admin/audit").then((logs) => {
                const events = logs.filter((log) => log.entity_id === unit.id);
                expect(events).to.have.length(2);
                for (const entry of events) {
                  expect(entry.performed_by_user_id).to.equal(actor.id);
                  expect(entry.action).to.equal("UNIT_CHANGE");
                  expect(Number.isNaN(Date.parse(entry.recorded_at))).to.equal(false);
                }
                const statusEvent = events.find((entry) => entry.previous_data?.status === "AVAILABLE")!;
                expect(statusEvent.previous_data).to.include({ status: "AVAILABLE", condition: "GOOD", is_active: true, location_id: scenario.locationId });
                expect(statusEvent.current_data).to.include({ status: "DISABLED", condition: "FAIR", is_active: false, location_id: null });
                const notesEvent = events.find((entry) => entry.current_data?.notes === second.notes)!;
                expect(notesEvent.previous_data?.notes).to.equal(null);
                expect(notesEvent.current_data?.serial_number).to.equal(second.serial_number);
                cy.get(`[data-audit-id="${notesEvent.id}"]`).within(() => {
                  cy.contains(`Cypress ${role}`).should("be.visible");
                  cy.contains("summary", "Ver cambios").click();
                  cy.contains(second.notes).should("be.visible");
                  cy.contains(second.serial_number).should("be.visible");
                });
              });
            });
          });
        });
      });
    });
  }
});
