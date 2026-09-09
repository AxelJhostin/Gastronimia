import { api } from "../support/api";
import type { SeedScenario } from "../support/types";

type IndividualScenario = SeedScenario & { individualItemId: string; unitId: string; loanId: string; requestId: string };

describe("QA-INC / QA-MAN equipo individual y evidencia privada", () => {
  it("QA-INC-02 devolución con daño, fotografía, bloqueo y mantenimiento correctivo", () => {
    cy.task<IndividualScenario>("seed:individual-loan").then((scenario) => {
      cy.loginAs(scenario.manager.email, scenario.manager.password);
      cy.visit("/dashboard");
      api("/admin/maintenance", "POST", { inventory_unit_id: scenario.unitId, maintenance_type: "CORRECTIVE", reason: "QA no mantener prestado" }, 409);
      cy.visit(`/dashboard/returns/${scenario.loanId}`);
      cy.contains("label", "Condición observada").find("select").select("DAMAGED");
      cy.contains("label", "Novedad").find("select").select("DAMAGE");
      cy.contains("label", "Severidad").find("select").select("HIGH");
      cy.contains("button", "Registrar devolución e inspección").click();
      cy.get('[role="alert"]').should("be.visible");
      cy.get('[role="dialog"]').should("not.exist");
      cy.contains("label", "Descripción").find("textarea").type(`QA daño probado ${scenario.marker}`);
      cy.get('input[type="file"]').selectFile("public/demo/inventory/batidora-planetaria.webp");
      cy.intercept("POST", "**/api/v1/admin/inspections/incidents/*/evidences").as("evidence");
      cy.contains("button", "Registrar devolución e inspección").click();
      cy.get('[role="dialog"]').contains("button", "Registrar devolución").click();
      cy.contains("Se registraron 1 novedades").should("be.visible");
      cy.wait("@evidence").its("response.statusCode").should("eq", 200);
      api<Array<{ id: string; status: string; condition: string }>>("/admin/inventory/units").then((units) => {
        const unit = units.find((value) => value.id === scenario.unitId);
        expect(unit?.status).to.equal("MAINTENANCE");
        expect(unit?.condition).to.equal("DAMAGED");
      });
      cy.visit("/dashboard/incidents");
      cy.contains("tr", `QA daño probado ${scenario.marker}`).contains("button", "Ver evidencias").click();
      cy.contains("a", "Abrir evidencia 1").should("have.attr", "href").then((href) => {
        const url = new URL(String(href));
        expect(url.pathname).to.include("/storage/v1/object/sign/evidence/");
        cy.request({ url: String(href), log: false }).its("status").should("eq", 200);
        cy.request({ url: `${url.origin}${url.pathname.replace("/sign/", "/public/")}`, failOnStatusCode: false, log: false }).its("status").should("not.eq", 200);
      });
      api<{ id: string }>("/admin/maintenance", "POST", { inventory_unit_id: scenario.unitId, maintenance_type: "CORRECTIVE", reason: `QA reparar ${scenario.marker}` }).then((maintenance) => {
        api(`/admin/maintenance/${maintenance.id}/complete`, "POST", { resolution: "QA reparada", final_status: "AVAILABLE", final_condition: "GOOD" }).its("status").should("eq", "COMPLETED");
      });
    });
  });

  it("QA-DOC-02/03 aislamiento entre dos docentes en API", () => {
    cy.task<IndividualScenario>("seed:individual-loan").then((owner) => {
      cy.seedBase().then((other) => {
        cy.loginAs(other.teacher.email, other.teacher.password);
        cy.visit("/dashboard");
        api<Array<{ id: string }>>("/requests/mine").then((rows) => expect(rows).to.have.length(0));
        api<Array<{ id: string }>>("/requests/my-loans").then((rows) => expect(rows).to.have.length(0));
        api(`/requests/${owner.requestId}`, "GET", undefined, 403);
      });
    });
  });
});
