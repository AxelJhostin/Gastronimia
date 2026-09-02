describe("ciclo completo de préstamo", () => {
  it("recorre solicitud, aprobación, preparación, entrega y devolución", () => {
    cy.seedBase().then((scenario) => {
      let requestId = "";

      cy.loginAs(scenario.teacher.email, scenario.teacher.password);
      cy.visit("/dashboard/requests/new");
      cy.contains("h2", "Nueva solicitud").should("be.visible");
      cy.contains("label", "Sección").find("select").select(scenario.courseSectionId);
      cy.contains("label", "Laboratorio").find("select").select(scenario.laboratoryId);
      cy.contains("label", "Inicio").find("input").type("2035-06-01T13:00");
      cy.contains("label", "Fin").find("input").type("2035-06-01T15:00");
      cy.contains("label", "Propósito").find("textarea").type(`Cypress lifecycle ${scenario.marker}`);
      cy.contains("label", /^Artículo/).find("select").select(scenario.inventoryItemId);
      cy.contains("label", "Cantidad").find("input").clear().type("2");
      cy.contains("button", "Enviar solicitud").click();

      cy.location("pathname")
        .should("match", /^\/dashboard\/requests\/[0-9a-f-]+$/)
        .then((pathname) => {
          requestId = pathname.split("/").at(-1) ?? "";
          expect(requestId).not.to.equal("");
        });
      cy.contains("strong", "PENDING").should("be.visible");

      cy.then(() => {
        cy.loginAs(scenario.admin.email, scenario.admin.password);
        cy.visit(`/dashboard/requests/${requestId}`);
      });
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
      cy.contains("button", "Registrar inspección de salida").click();
      cy.get('[role="dialog"]').contains("button", "Registrar inspección").click();
      cy.contains("Registrada").should("be.visible");
      cy.contains("button", "Generar token temporal").click();
      cy.contains("Código de entrega").should("be.visible");
      cy.contains("label", "Nombre de quien retira")
        .find("input")
        .type("Cypress Teacher");
      cy.contains("button", "Confirmar entrega").click();
      cy.get('[role="dialog"]').contains("button", "Registrar entrega").click();
      cy.contains(/Préstamo #[0-9a-f]+ activo/).should("be.visible");

      cy.contains("a", "Abrir devolución").click();
      cy.contains("h1", "Recepcionar préstamo").should("be.visible");
      cy.contains("button", "Registrar devolución e inspección").click();
      cy.get('[role="dialog"]').contains("button", "Registrar devolución").click();
      cy.contains("h2", "Devolución e inspección registradas").should("be.visible");
      cy.contains("Se registraron 0 novedades").should("be.visible");
    });
  });
});
