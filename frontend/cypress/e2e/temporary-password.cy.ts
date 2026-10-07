import { api } from "../support/api";

type ProvisionedUser = {
  email: string;
  temporary_password: string;
};

describe("R-01 activación con contraseña temporal", () => {
  it("impide omitir el cambio y permite activar, renovar sesión e ingresar con la nueva clave", () => {
    cy.seedBase().then((scenario) => {
      cy.loginAs(scenario.admin.email, scenario.admin.password);
      cy.visit("/dashboard");
      api<ProvisionedUser>("/admin/users", "POST", {
        email: `cypress-temporary-${scenario.marker}@example.test`,
        full_name: "QA contraseña temporal",
        roles: ["MANAGER"],
      }, 201).then((user) => {
        const personalPassword = `Personal-${scenario.marker}-Safe9!`;
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.visit("/login");
        cy.get("#email").type(user.email);
        cy.get("#password").type(user.temporary_password, { log: false });
        cy.contains("button", "Iniciar sesión").click();
        cy.location("pathname").should("eq", "/change-password");

        // La llamada antigua sin contraseña no puede quitar la obligación.
        api("/auth/password-change-complete", "POST", undefined, 422);
        api("/auth/password-change-complete", "POST", {
          password: user.temporary_password,
        }, 422);
        api<{ must_change_password: boolean }>("/auth/me")
          .its("must_change_password").should("eq", true);
        api("/admin/inventory/items", "GET", undefined, 403);

        cy.get("#new-password").type(personalPassword, { log: false });
        cy.get("#confirmation").type(personalPassword, { log: false });
        cy.contains("button", "Actualizar contraseña").click();
        cy.location("pathname").should("eq", "/dashboard");
        // Usa el token de localStorage: prueba también que la UI lo renueva.
        api<{ must_change_password: boolean }>("/auth/me")
          .its("must_change_password").should("eq", false);
        api("/admin/inventory/items");

        cy.contains("button", "Cerrar sesión").click();
        cy.location("pathname").should("eq", "/login");
        cy.get("#email").type(user.email);
        cy.get("#password").type(user.temporary_password, { log: false });
        cy.contains("button", "Iniciar sesión").click();
        cy.contains("No fue posible iniciar sesión").should("be.visible");
        cy.get("#password").clear({ log: false }).type(personalPassword, { log: false });
        cy.contains("button", "Iniciar sesión").click();
        cy.location("pathname").should("eq", "/dashboard");
      });
    });
  });
});
