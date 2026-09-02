describe("recuperación de devoluciones", () => {
  it("mantiene y completa una inspección pendiente después de recargar", () => {
    cy.seedPendingReturn().then((scenario) => {
      cy.loginAs(scenario.admin.email, scenario.admin.password);
      cy.visit("/dashboard/returns");

      cy.contains("h2", "Inspecciones pendientes").should("be.visible");
      cy.contains("Cypress Recovery Teacher").should("be.visible");
      cy.contains("a", "Continuar inspección").click();
      cy.location("pathname").should(
        "eq",
        `/dashboard/returns/inspections/${scenario.returnId}`,
      );

      cy.reload();
      cy.contains("h1", `Completar inspección #${scenario.returnId.slice(0, 8)}`).should(
        "be.visible",
      );
      cy.contains("únicamente recursos por cantidad").should("be.visible");
      cy.contains("button", "Completar inspección").click();
      cy.get('[role="dialog"]').contains("button", "Completar inspección").click();
      cy.contains("h2", "Inspección completada").should("be.visible");

      cy.visit("/dashboard/returns");
      cy.contains("Cypress Recovery Teacher").should("not.exist");
    });
  });
});
