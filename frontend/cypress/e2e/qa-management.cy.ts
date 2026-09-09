import { api } from "../support/api";
import type { SeedScenario } from "../support/types";

describe("QA gestión y reportes", () => {
  let scenario: SeedScenario;
  before(() => cy.seedPendingReturn().then((value) => { scenario = value; }));
  beforeEach(() => {
    cy.loginAs(scenario.admin.email, scenario.admin.password);
    cy.visit("/dashboard");
  });

  it("QA-INV-03 API listado admite movimientos de préstamo y devolución", () => {
    api<Array<{ movement_type: string }>>("/admin/inventory/movements").then((rows) => {
      expect(rows.map((row) => row.movement_type)).to.include("LOAN_OUT").and.include("RETURN_IN");
    });
  });

  for (const [title, label] of [["Categorías", "categoría"], ["Ubicaciones", "ubicación"]]) {
    it(`QA-INV-02 UI crear, editar, desactivar y reactivar ${label}`, () => {
      const name = `QA ${label} ${scenario.marker}`;
      cy.visit("/dashboard/inventory/manage");
      cy.contains("h2", title).closest("section").within(() => {
        cy.get('form input[name="name"]').type(name);
        cy.contains("button", `Crear ${label}`).click();
        cy.contains("li", name).contains("button", "Editar").click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[name="name"]').clear().type(`${name} editada`);
        cy.contains("button", "Guardar cambios").click();
      });
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("li", `${name} editada`).contains("button", "Desactivar").click();
      cy.get('[role="dialog"]').contains("button", "Desactivar").click();
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("li", `${name} editada`).contains("button", "Activar").click();
      cy.get('[role="dialog"]').contains("button", "Activar").click();
      cy.get('[role="dialog"]').should("not.exist");
      cy.reload();
      cy.contains("li", `${name} editada`).contains("button", "Desactivar").should("exist");
    });
  }

  for (const [resource, payload] of [
    ["periods", { name: "QA período", start_date: "2036-01-01", end_date: "2036-12-31" }],
    ["subjects", { name: "QA asignatura" }],
    ["laboratories", { name: "QA laboratorio" }],
  ] as const) {
    it(`QA-ADM-02 API alta, edición, desactivación y reactivación ${resource}`, () => {
      const data = { ...payload, name: `${payload.name} ${scenario.marker}` };
      api<{ id: string }>(`/admin/academic/${resource}`, "POST", data, 201).then(({ id }) => {
        api(`/admin/academic/${resource}/${id}`, "PATCH", { ...data, name: `${data.name} editado`, is_active: false }).its("is_active").should("eq", false);
        api<Array<{ id: string; is_active: boolean }>>(`/admin/academic/${resource}`).then((rows) => {
          expect(rows.find((row) => row.id === id)?.is_active).to.equal(false);
        });
        api(`/admin/academic/${resource}/${id}`, "PATCH", { ...data, is_active: true }).its("is_active").should("eq", true);
      });
    });
  }

  it("QA-INV-03 API ajuste válido, saldo, kardex y rechazo de cero", () => {
    const movement = { inventory_item_id: scenario.inventoryItemId, location_id: scenario.locationId, movement_type: "ADJUSTMENT_IN", quantity: 3, notes: `QA ${scenario.marker}` };
    api("/admin/inventory/movements", "POST", { ...movement, quantity: 0 }, 422);
    api("/admin/inventory/movements", "POST", movement, 201);
    api<Array<{ inventory_item_id: string; quantity: number }>>("/admin/inventory/stock").then((rows) => {
      expect(Number(rows.find((row) => row.inventory_item_id === scenario.inventoryItemId)?.quantity)).to.equal(13);
    });
    api<Array<{ movement_type: string }>>(`/admin/reports/kardex?inventory_item_id=${scenario.inventoryItemId}`).then((rows) => {
      expect(rows.filter((row) => row.movement_type === "ADJUSTMENT_IN")).to.have.length(1);
    });
  });

  it("QA-MAN-01 / QA-INV-04 API unidad individual, mantenimiento e historial", () => {
    api<Array<{ id: string }>>("/admin/inventory/categories").then((categories) => {
      api<{ id: string }>("/admin/inventory/items", "POST", { category_id: categories[0].id, name: `QA equipo ${scenario.marker}`, tracking_mode: "INDIVIDUAL", unit_of_measure: "unidad" }, 201).then((item) => {
        api<{ id: string }>("/admin/inventory/units", "POST", { inventory_item_id: item.id, location_id: scenario.locationId, asset_tag: `QA-${scenario.marker}`, condition: "GOOD" }, 201).then((unit) => {
          api<{ id: string }>("/admin/maintenance", "POST", { inventory_unit_id: unit.id, maintenance_type: "PREVENTIVE", reason: `QA mantenimiento ${scenario.marker}` }).then((maintenance) => {
            api<Array<{ id: string; status: string }>>("/admin/inventory/units").then((rows) => expect(rows.find((row) => row.id === unit.id)?.status).to.equal("MAINTENANCE"));
            api(`/admin/maintenance/${maintenance.id}/complete`, "POST", { final_status: "AVAILABLE", final_condition: "GOOD", resolution: "QA completada" }).its("status").should("eq", "COMPLETED");
            api<Array<{ id: string; status: string }>>("/admin/inventory/units").then((rows) => expect(rows.find((row) => row.id === unit.id)?.status).to.equal("AVAILABLE"));
            api<Array<{ event_type: string }>>(`/admin/inventory/units/${unit.id}/history`).then((rows) => {
              expect(rows.length).to.be.at.least(3);
              expect(rows.map((row) => row.event_type)).to.include("STATUS_CHANGED");
            });
          });
        });
      });
    });
  });

  it("QA-ADM-01 API cambios de roles, baja bloquea token previo y reactivación", () => {
    // Solo se modifica el usuario efímero de este spec.
    const id = scenario.manager.id;
    api(`/admin/users/${id}/roles`, "PUT", { roles: ["TEACHER"] }, 204);
    api<Array<{ id: string; roles: string[] }>>("/admin/users").then((users) => expect(users.find((user) => user.id === id)?.roles).to.deep.equal(["TEACHER"]));
    api(`/admin/users/${id}/roles`, "PUT", { roles: ["MANAGER"] }, 204);
    cy.loginAs(scenario.manager.email, scenario.manager.password);
    cy.visit("/dashboard");
    cy.window({ log: false }).then((window) => {
      const token = window.localStorage.getItem("access_token");
      cy.loginAs(scenario.admin.email, scenario.admin.password);
      cy.visit("/dashboard");
      api(`/admin/users/${id}/status`, "PATCH", { is_active: false }, 204);
      cy.request({ url: "http://127.0.0.1:8000/api/v1/admin/inventory/items", headers: { Authorization: `Bearer ${token}` }, log: false, failOnStatusCode: false }).its("status").should("eq", 403);
      api(`/admin/users/${id}/status`, "PATCH", { is_active: true }, 204);
      cy.request({ url: "http://127.0.0.1:8000/api/v1/admin/inventory/items", headers: { Authorization: `Bearer ${token}` }, log: false, failOnStatusCode: false }).its("status").should("eq", 200);
    });
  });

  for (const [label, endpoint] of [["Solicitudes", "requests"], ["Préstamos", "loans"], ["Stock", "stock"], ["Novedades", "incidents"], ["Kardex", "kardex"]]) {
    it(`QA-REP-01 UI reporte ${label} carga datos reales`, () => {
      cy.loginAs(scenario.manager.email, scenario.manager.password);
      cy.intercept("GET", `**/api/v1/admin/reports/${endpoint}*`).as("report");
      cy.visit("/dashboard/reports");
      cy.contains("button", label).click();
      cy.wait("@report").its("response.statusCode").should("eq", 200);
      cy.contains("Generando datos del informe").should("not.exist");
      cy.get("table").should("be.visible");
    });
  }
});
