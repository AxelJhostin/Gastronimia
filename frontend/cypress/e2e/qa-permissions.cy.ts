import type { SeedScenario } from "../support/types";
import { api } from "../support/api";

type Role = "admin" | "manager" | "teacher";
const staff: Role[] = ["admin", "manager"];
// La expectativa sale de la sección 5 del plan, no de los permisos implementados.
const routes: Array<[string, Role[]]> = [
  ["/dashboard", ["admin", "manager", "teacher"]],
  ["/dashboard/requests", ["admin", "manager", "teacher"]],
  ["/dashboard/requests/new", ["teacher"]],
  ["/dashboard/loans", ["teacher"]],
  ["/dashboard/preparations", staff],
  ["/dashboard/deliveries", staff],
  ["/dashboard/inventory", staff],
  ["/dashboard/inventory/manage", staff],
  ["/dashboard/returns", staff],
  ["/dashboard/maintenance", staff],
  ["/dashboard/incidents", staff],
  ["/dashboard/reports", staff],
  ["/dashboard/audit-log", ["admin"]],
  ["/dashboard/users", ["admin"]],
  ["/dashboard/users/new", ["admin"]],
  ["/dashboard/academic", ["admin"]],
];
const endpoints: Array<[string, Role[]]> = [
  ["/requests/form-options", ["teacher"]],
  ["/admin/inventory/items", staff],
  ["/admin/returns/loans", staff],
  ["/admin/maintenance", staff],
  ["/admin/reports/stock", staff],
  ["/admin/audit", ["admin"]],
  ["/admin/users", ["admin"]],
  ["/admin/academic/periods", ["admin"]],
];

describe("QA-AUTH-04 / QA-NAV permisos por rol", () => {
  let scenario: SeedScenario;
  let auditMovementId: string;
  before(() => cy.seedBase().then((value) => {
    scenario = value;
    cy.loginAs(scenario.manager.email, scenario.manager.password);
    cy.visit("/dashboard");
    // El Encargado sigue generando auditoría al operar, aunque no pueda leerla.
    return api<{ id: string }>("/admin/inventory/movements", "POST", {
      inventory_item_id: scenario.inventoryItemId,
      location_id: scenario.locationId,
      movement_type: "ADJUSTMENT_IN",
      quantity: 1,
      notes: `QA auditoría RLS ${scenario.marker}`,
    }, 201).then((movement) => { auditMovementId = movement.id; });
  }));

  it("R-02 Data API rechaza lectura de auditoría sin sesión", () => {
    cy.request({
      url: `${Cypress.expose("supabaseUrl")}/rest/v1/operational_audit_log`,
      qs: { select: "id", entity_id: `eq.${auditMovementId}` },
      headers: { apikey: Cypress.expose("supabasePublishableKey") },
      failOnStatusCode: false,
      log: false,
    }).its("status").should("be.oneOf", [401, 403]);
  });

  for (const role of ["admin", "manager", "teacher"] as const) {
    describe(role, () => {
      beforeEach(() => cy.loginAs(scenario[role].email, scenario[role].password));

      it(`R-02 Data API auditoría ${role}: ${role === "admin" ? "visible" : "sin filas"}`, () => {
        cy.visit("/dashboard");
        cy.window({ log: false }).then((window) => {
          cy.request<Array<{ id: string }>>({
            url: `${Cypress.expose("supabaseUrl")}/rest/v1/operational_audit_log`,
            qs: {
              select: "id",
              entity_id: `eq.${auditMovementId}`,
              action: "eq.INVENTORY_MOVEMENT",
            },
            headers: {
              apikey: Cypress.expose("supabasePublishableKey"),
              Authorization: `Bearer ${window.localStorage.getItem("access_token")}`,
            },
            failOnStatusCode: false,
            log: false,
          }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.have.length(role === "admin" ? 1 : 0);
          });
        });
      });

      for (const [path, allowed] of routes) {
        it(`QA-AUTH-04 UI ${path}: ${allowed.includes(role) ? "permitido" : "403"}`, () => {
          cy.visit(path);
          if (allowed.includes(role)) {
            cy.get("h1").should("be.visible");
            cy.contains("Esta estación no está en tu menú.").should("not.exist");
            cy.contains("No fue posible verificar tu sesión").should("not.exist");
          } else {
            cy.contains("h1", "Esta estación no está en tu menú.").should("be.visible");
            cy.contains("a", "Volver al panel").should("be.visible");
            cy.get("table, form").should("not.exist");
          }
        });
      }

      for (const [path, allowed] of endpoints) {
        it(`QA-AUTH-04 API ${path}: ${allowed.includes(role) ? "200" : "403"}`, () => {
          cy.visit("/dashboard");
          cy.window().then((window) => {
            cy.request({
              url: `http://127.0.0.1:8000/api/v1${path}`,
              headers: { Authorization: `Bearer ${window.localStorage.getItem("access_token")}` },
              failOnStatusCode: false,
              log: false,
            }).its("status").should("eq", allowed.includes(role) ? 200 : 403);
          });
        });
      }

      it("QA-NAV menú corresponde exactamente al rol", () => {
        cy.visit("/dashboard");
        cy.get('aside:visible nav a').should("have.length.at.least", 3).then(($links) => {
          const actual = [...$links].map((link) => link.getAttribute("href"));
          const expected = routes.filter(([path, roles]) => roles.includes(role) && !["/dashboard/requests/new", "/dashboard/inventory/manage", "/dashboard/users/new"].includes(path)).map(([path]) => path);
          expect(actual.sort()).to.deep.equal(expected.sort());
        });
      });
    });
  }
});
