import type { PendingReturnScenario } from "../support/types";

describe("QA límites de acceso, accesibilidad y estados", () => {
  let scenario: PendingReturnScenario;
  before(() => cy.seedPendingReturn().then((value) => { scenario = value; }));

  for (const route of ["preparations", "deliveries", "returns", "inventory", "inventory/units", "returns/inspections"]) {
    it(`QA-AUTH-04 docente no queda cargando al abrir detalle ${route}`, () => {
      cy.loginAs(scenario.teacher.email, scenario.teacher.password);
      const id = route === "returns" ? scenario.loanId : route === "returns/inspections" ? scenario.returnId : route === "inventory" ? scenario.inventoryItemId : scenario.requestId;
      cy.visit(`/dashboard/${route}/${id}`);
      cy.contains("h1", "Esta estación no está en tu menú.").should("be.visible");
      cy.get("form, table").should("not.exist");
    });
  }

  it("QA-A11Y-01 confirmación recibe foco al abrir", () => {
    cy.loginAs(scenario.manager.email, scenario.manager.password);
    cy.visit(`/dashboard/returns/inspections/${scenario.returnId}`);
    cy.contains("button", "Completar inspección").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.focused().closest('[role="dialog"]').should("exist");
  });

  it("QA-A11Y-01 confirmación cierra con Escape y devuelve foco", () => {
    cy.loginAs(scenario.manager.email, scenario.manager.password);
    cy.visit(`/dashboard/returns/inspections/${scenario.returnId}`);
    cy.contains("button", "Completar inspección").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get('[role="dialog"]').should("not.exist");
    cy.focused().should("contain", "Completar inspección");
  });

  it("QA-NAV-04 el menú móvil bloquea el scroll del contenido de fondo", () => {
    cy.viewport(390, 844);
    cy.loginAs(scenario.admin.email, scenario.admin.password);
    cy.visit("/dashboard");
    cy.get('button[aria-label="Abrir menú"]').click();
    cy.document().then((document) => {
      const styles = document.defaultView!;
      const body = styles.getComputedStyle(document.body);
      const html = styles.getComputedStyle(document.documentElement);
      const locked = [body.overflowY, html.overflowY].some((value) => ["hidden", "clip"].includes(value)) || body.position === "fixed";
      expect(locked, "scroll del fondo bloqueado").to.equal(true);
    });
  });

  for (const role of ["admin", "manager"] as const) {
    for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
      it(`QA-UX-01 ${role} inventario ${width}x${height} sin desbordamiento`, () => {
        cy.viewport(width, height);
        cy.loginAs(scenario[role].email, scenario[role].password);
        cy.visit("/dashboard/inventory");
        cy.contains(scenario.inventoryItemName).should("exist");
        cy.document().should((document) => expect(document.documentElement.scrollWidth).to.be.at.most(width + 1));
      });
    }
  }

  it("QA-INV-01 búsqueda y estado vacío con datos propios", () => {
    cy.loginAs(scenario.manager.email, scenario.manager.password);
    cy.visit("/dashboard/inventory");
    cy.get('input[type="search"]').type(scenario.marker);
    cy.contains(scenario.inventoryItemName).should("be.visible");
    cy.get('input[type="search"]').clear().type(`inexistente-${scenario.marker}`);
    cy.contains("No encontramos").should("be.visible");
  });

  it("QA-A11Y-02 encabezados principales únicos y etiquetas en nueva solicitud", () => {
    cy.loginAs(scenario.teacher.email, scenario.teacher.password);
    cy.visit("/dashboard/requests/new");
    cy.contains("button", "Enviar solicitud").should("be.enabled");
    cy.get("h1").should("have.length", 1);
    cy.get("input, select, textarea").each(($control) => {
      const control = $control[0] as HTMLInputElement;
      expect(Boolean(control.labels?.length || control.getAttribute("aria-label"))).to.equal(true);
    });
  });

  it("QA-ERR-02 login controla indisponibilidad de Auth (red simulada)", () => {
    cy.intercept("POST", "**/auth/v1/token*", { forceNetworkError: true });
    cy.visit("/login");
    cy.get("#email").type(scenario.teacher.email);
    cy.get("#password").type(scenario.teacher.password, { log: false });
    cy.contains("button", "Iniciar sesión").click();
    cy.get('[role="alert"]', { timeout: 20000 }).should("be.visible");
    cy.location("pathname").should("eq", "/login");
    cy.get("body").should("not.contain", "Traceback");
  });
});
