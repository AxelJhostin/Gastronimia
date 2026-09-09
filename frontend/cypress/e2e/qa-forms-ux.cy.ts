import type { SeedScenario } from "../support/types";

describe("QA autenticación, formularios y UX", () => {
  let scenario: SeedScenario;
  before(() => cy.seedBase().then((value) => { scenario = value; }));

  it("QA-AUTH-02 credenciales inválidas", () => {
    cy.visit("/login");
    cy.get("#email").type(scenario.teacher.email);
    cy.get("#password").type("Incorrecta-2026!", { log: false });
    cy.contains("button", "Iniciar sesión").click();
    cy.get('[role="alert"]').should("be.visible");
    cy.location("pathname").should("eq", "/login");
    cy.get("body").should("not.contain", "Traceback");
  });

  it("SMK-03 / QA-AUTH-03 cerrar sesión bloquea acceso posterior", () => {
    cy.loginAs(scenario.teacher.email, scenario.teacher.password);
    cy.visit("/dashboard");
    cy.get('aside:visible').contains("button", "Cerrar sesión").click();
    cy.location("pathname").should("eq", "/login");
    cy.visit("/dashboard/requests");
    cy.location("pathname").should("eq", "/login");
  });

  describe("QA-DOC-04", () => {
    beforeEach(() => {
      cy.loginAs(scenario.teacher.email, scenario.teacher.password);
      cy.visit("/dashboard/requests/new");
      cy.contains("button", "Consultar disponibilidad").should("be.enabled");
    });

    it("requiere horario y artículo", () => {
      cy.contains("button", "Consultar disponibilidad").click();
      cy.get('[role="alert"]').should("contain", "Selecciona el horario y al menos un artículo");
    });

    it("rechaza intervalo inválido y conserva los campos", () => {
      cy.contains("label", "Inicio").find("input").type("2035-06-01T13:00");
      cy.contains("label", "Fin").find("input").type("2035-06-01T12:00");
      cy.contains("label", /^Artículo/).find("select").select(scenario.inventoryItemId);
      cy.contains("label", "Propósito").find("textarea").type("QA conservar datos");
      cy.contains("button", "Consultar disponibilidad").click();
      cy.get('[role="alert"]').should("contain", "posterior al inicio");
      cy.contains("label", "Propósito").find("textarea").should("have.value", "QA conservar datos");
      cy.contains("label", /^Artículo/).find("select").should("have.value", scenario.inventoryItemId);
    });

    it("rechaza cantidad cero mediante validación HTML", () => {
      cy.contains("label", "Cantidad").find("input").clear().type("0").then(($input) => {
        expect(($input[0] as HTMLInputElement).validity.rangeUnderflow).to.equal(true);
      });
      cy.location("pathname").should("eq", "/dashboard/requests/new");
    });

    it("impide duplicar artículo", () => {
      cy.contains("label", /^Artículo/).find("select").select(scenario.inventoryItemId);
      cy.contains("button", "Agregar artículo").click();
      cy.get(`option[value="${scenario.inventoryItemId}"]`).last().should("be.disabled");
    });
  });

  for (const role of ["admin", "manager", "teacher"] as const) {
    it(`SMK-06 ${role} conserva identidad después de recargar`, () => {
      cy.loginAs(scenario[role].email, scenario[role].password);
      cy.visit("/dashboard");
      cy.reload();
      cy.get("h1").should("contain", "Hola,");
      cy.get('aside:visible').should("contain", scenario[role].email);
    });

    it(`QA-NAV-04 ${role} menú móvil abre, navega y cierra`, () => {
      cy.viewport(390, 844);
      cy.loginAs(scenario[role].email, scenario[role].password);
      cy.visit("/dashboard");
      cy.get('aside[aria-label="Navegación"]').should("have.attr", "inert");
      cy.get('button[aria-label="Abrir menú"]').click();
      cy.get('aside[aria-label="Navegación"]').should("not.have.attr", "inert");
      cy.get('aside[aria-label="Navegación"]').contains("a", "Solicitudes").click();
      cy.location("pathname").should("eq", "/dashboard/requests");
      cy.get('aside[aria-label="Navegación"]').should("have.attr", "inert");
    });
  }

  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
    for (const path of ["/dashboard", "/dashboard/requests/new", "/dashboard/loans"]) {
      it(`QA-UX-01 docente ${path} sin desbordamiento ${width}x${height}`, () => {
        cy.viewport(width, height);
        cy.loginAs(scenario.teacher.email, scenario.teacher.password);
        cy.visit(path);
        cy.get("h1").should("be.visible");
        if (path.endsWith("/new")) cy.contains("button", "Enviar solicitud").should("be.enabled");
        cy.document().should((document) => {
          expect(document.documentElement.scrollWidth).to.be.at.most(width + 1);
        });
      });
    }
  }

  it("QA-ERR-01 error controlado y recuperación de API (red simulada)", () => {
    cy.loginAs(scenario.teacher.email, scenario.teacher.password);
    cy.intercept("GET", "**/api/v1/requests/mine", { forceNetworkError: true }).as("offline");
    cy.visit("/dashboard/loans");
    cy.contains("No pudimos cargar tus préstamos").should("be.visible");
    cy.location("pathname").should("eq", "/dashboard/loans");
    cy.intercept("GET", "**/api/v1/requests/mine", (request) => request.continue());
    cy.reload();
    cy.contains("Todavía no tienes préstamos").should("be.visible");
  });
});
