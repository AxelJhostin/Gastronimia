import { createBrowserClient } from "@supabase/ssr";

import type { PendingReturnScenario, SeedScenario } from "./types";

declare global {
  // Cypress amplía su interfaz Chainable mediante declaración global.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<void>;
      seedBase(): Chainable<SeedScenario>;
      seedPendingReturn(): Chainable<PendingReturnScenario>;
    }
  }
}

Cypress.Commands.add("loginAs", (email: string, password: string) => {
  cy.session(["supabase", email], () => {
    cy.visit("/login");
    cy.window().then(async (window) => {
      const supabase = createBrowserClient(
        Cypress.expose("supabaseUrl"),
        Cypress.expose("supabasePublishableKey"),
      );
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) {
        throw error ?? new Error("Supabase no devolvió una sesión para Cypress.");
      }
      window.localStorage.setItem("access_token", data.session.access_token);
      window.localStorage.setItem("token", data.session.access_token);
    });
    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/dashboard");
  });
});

Cypress.Commands.add("seedBase", () => cy.task<SeedScenario>("seed:base"));
Cypress.Commands.add("seedPendingReturn", () =>
  cy.task<PendingReturnScenario>("seed:pending-return"),
);

export {};
