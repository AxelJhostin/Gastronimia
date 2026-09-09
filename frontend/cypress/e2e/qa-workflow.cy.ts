import { api } from "../support/api";
import type { SeedScenario } from "../support/types";

function createRequest(scenario: SeedScenario) {
  cy.loginAs(scenario.teacher.email, scenario.teacher.password);
  cy.visit("/dashboard/requests/new");
  cy.contains("label", "Sección").find("select").select(scenario.courseSectionId);
  cy.contains("label", "Laboratorio").find("select").select(scenario.laboratoryId);
  cy.contains("label", "Inicio").find("input").type("2035-07-01T13:00");
  cy.contains("label", "Fin").find("input").type("2035-07-01T16:00");
  cy.contains("label", "Propósito").find("textarea").type(`QA recorrido ${scenario.marker}`);
  cy.contains("label", /^Artículo/).find("select").select(scenario.inventoryItemId);
  cy.contains("label", "Cantidad").find("input").clear().type("2");
  cy.contains("button", "Consultar disponibilidad").click();
  cy.contains("Disponibilidad preliminar: 10").should("be.visible");
  cy.contains("button", "Enviar solicitud").click();
  cy.location("pathname").should("match", /\/requests\/[0-9a-f-]{36}$/);
  cy.contains("strong", "PENDING").should("be.visible");
  return cy.location("pathname").then((path) => path.split("/").at(-1)!);
}

function expectStock(scenario: SeedScenario, quantity: number) {
  api<Array<{ inventory_item_id: string; quantity: number }>>("/admin/inventory/stock").then((rows) => {
    expect(Number(rows.find((row) => row.inventory_item_id === scenario.inventoryItemId)?.quantity)).to.equal(quantity);
  });
}

describe("QA-DOC / QA-ENC flujo con encargado y consistencia", () => {
  it("QA-DOC-05/06 QA-ENC-01/03–09 parcial, historial, stock y cierre", () => {
    cy.seedBase().then((scenario) => {
      createRequest(scenario).then((id) => {
        cy.contains("button", "Aprobar solicitud").should("not.exist");
        cy.contains("a", "Iniciar preparación").should("not.exist");
        cy.loginAs(scenario.manager.email, scenario.manager.password);
        cy.visit("/dashboard/requests");
        cy.contains(`QA recorrido ${scenario.marker}`).should("be.visible");
        cy.contains("a", "Nueva solicitud").should("not.exist");
        cy.visit(`/dashboard/requests/${id}`);
        cy.contains("button", "Aprobar solicitud").click();
        cy.get('[role="dialog"]').contains("button", "Aprobar solicitud").click();
        cy.contains("strong", "APPROVED").should("be.visible");
        cy.contains("a", "Iniciar preparación").click();
        cy.contains("button", "Iniciar preparación").click();
        cy.get('[role="dialog"]').contains("button", "Iniciar preparación").click();
        cy.contains("PREPARING").should("be.visible");
        cy.contains("button", "Registrar y finalizar preparación").click();
        cy.get('[role="dialog"]').contains("button", "Finalizar preparación").click();
        cy.contains("strong", "PREPARED").should("be.visible");
        cy.contains("a", "Inspeccionar y entregar").click();
        cy.contains("button", "Generar token temporal").should("be.disabled");
        cy.contains("button", "Registrar inspección de salida").click();
        cy.get('[role="dialog"]').contains("button", "Registrar inspección").click();
        cy.contains("Registrada").should("be.visible");
        cy.contains("button", "Generar token temporal").click();
        cy.contains("Código de entrega").should("be.visible");
        cy.contains("label", "Nombre de quien retira").find("input").type("Estudiante QA autorizado");
        cy.contains("button", "Confirmar entrega").click();
        cy.get('[role="dialog"]').contains("button", "Registrar entrega").click();
        cy.contains(/Préstamo #[0-9a-f]+ activo/).should("be.visible");
        expectStock(scenario, 8);
        cy.contains("a", "Abrir devolución").invoke("attr", "href").then((returnUrl) => {
          const loanId = returnUrl!.split("/").at(-1)!;
          cy.loginAs(scenario.teacher.email, scenario.teacher.password);
          cy.visit("/dashboard/loans");
          cy.contains(`QA recorrido ${scenario.marker}`).should("be.visible");
          cy.contains("Estudiante QA autorizado").should("be.visible");
          cy.contains("button", "Registrar devolución").should("not.exist");
          cy.loginAs(scenario.manager.email, scenario.manager.password);
          cy.visit(returnUrl!);
          cy.get('input[aria-label="Cantidad devuelta"]').type("{selectall}3").then(($input) => {
            expect(($input[0] as HTMLInputElement).validity.rangeOverflow).to.equal(true);
          });
          cy.get('input[aria-label="Cantidad devuelta"]').type("{selectall}1").should("have.value", "1");
          cy.contains("button", "Registrar devolución e inspección").click();
          cy.get('[role="dialog"]').contains("button", "Registrar devolución").click();
          cy.contains("Devolución e inspección registradas").should("be.visible");
          expectStock(scenario, 9);
          api<{ loan: { status: string }; quantity_details: Array<{ pending_quantity: number }> }>(`/admin/returns/loans/${loanId}/pending`).then((pending) => {
            expect(pending.loan.status).to.equal("PARTIALLY_RETURNED");
            expect(Number(pending.quantity_details[0].pending_quantity)).to.equal(1);
          });
          cy.visit(returnUrl!);
          cy.get('input[aria-label="Cantidad devuelta"]').should("have.value", "1");
          cy.contains("button", "Registrar devolución e inspección").click();
          cy.get('[role="dialog"]').contains("button", "Registrar devolución").click();
          cy.contains("Devolución e inspección registradas").should("be.visible");
          expectStock(scenario, 10);
          api<{ request: { status: string } }>(`/requests/${id}`).its("request.status").should("eq", "CLOSED");
          api<Array<{ id: string }>>("/admin/returns/loans").then((loans) => expect(loans.map((loan) => loan.id)).not.to.include(loanId));
          cy.loginAs(scenario.teacher.email, scenario.teacher.password);
          cy.visit("/dashboard/loans");
          cy.contains(`QA recorrido ${scenario.marker}`).should("be.visible");
          cy.contains("Devuelto").should("be.visible");
        });
      });
    });
  });

  it("QA-ENC-02 rechazo exige motivo, confirma y conserva revisión", () => {
    cy.seedBase().then((scenario) => {
      createRequest(scenario).then((id) => {
        cy.loginAs(scenario.manager.email, scenario.manager.password);
        cy.visit(`/dashboard/requests/${id}`);
        cy.contains("button", "Rechazar").click();
        cy.get('[role="alert"]').should("contain", "Indica el motivo");
        cy.contains("strong", "PENDING").should("be.visible");
        cy.contains("label", "Motivo de rechazo").find("textarea").type("QA horario no autorizado");
        cy.contains("button", "Rechazar").click();
        cy.get('[role="dialog"]').contains("button", "Rechazar solicitud").click();
        cy.contains("strong", "REJECTED").should("be.visible");
        cy.reload();
        cy.contains("QA horario no autorizado").should("be.visible");
        api<Array<{ id: string }>>("/admin/requests/pending").then((rows) => expect(rows.map((row) => row.id)).not.to.include(id));
      });
    });
  });

  it("QA-ENC-03 aprobación parcial y rechazo de cantidad excesiva", () => {
    cy.seedBase().then((scenario) => {
      createRequest(scenario).then((id) => {
        cy.loginAs(scenario.manager.email, scenario.manager.password);
        cy.visit(`/dashboard/requests/${id}`);
        cy.get('input[id^="approved-"]').clear().type("3");
        cy.contains("button", "Aprobar solicitud").click();
        cy.get('[role="dialog"]').contains("button", "Aprobar solicitud").click();
        cy.get('[role="alert"]').should("be.visible");
        cy.contains("strong", "PENDING").should("be.visible");
        cy.get('[role="dialog"]').contains("button", "Cancelar").click();
        cy.get('input[id^="approved-"]').clear().type("1");
        cy.contains("button", "Aprobar solicitud").click();
        cy.get('[role="dialog"]').contains("button", "Aprobar solicitud").click();
        cy.contains("strong", "PARTIALLY_APPROVED").should("be.visible");
      });
    });
  });
});
