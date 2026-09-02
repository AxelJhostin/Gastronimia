describe("autenticación", () => {
  it("protege el dashboard y permite ingresar con una cuenta local", () => {
    cy.seedBase().then(({ admin }) => {
      cy.visit("/dashboard");
      cy.location("pathname").should("eq", "/login");

      cy.get("#email").type(admin.email);
      cy.get("#password").type(admin.password, { log: false });
      cy.contains("button", "Iniciar sesión").click();

      cy.location("pathname").should("eq", "/dashboard");
      cy.contains("h1", `Bienvenido, ${admin.email}`).should("be.visible");
      cy.contains("ADMIN").should("be.visible");
    });
  });
});
