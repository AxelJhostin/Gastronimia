export function api<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: object,
  expectedStatus = 200,
): Cypress.Chainable<T> {
  return cy.window({ log: false }).then((window) =>
    cy.request<T>({
      url: `http://127.0.0.1:8000/api/v1${path}`,
      method,
      body,
      headers: { Authorization: `Bearer ${window.localStorage.getItem("access_token")}` },
      failOnStatusCode: false,
      log: false,
    }).then((response) => {
      expect(response.status, `${method} ${path}`).to.equal(expectedStatus);
      return cy.wrap<T>(response.body, { log: false });
    }),
  );
}
