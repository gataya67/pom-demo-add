Cypress.Commands.add("loginAsValidUser", () => {
  cy.get('[data-cy="username"]').clear().type("test");
  cy.get('[data-cy="password"]').clear().type("123");
  cy.get('[data-cy="login-button"]').click();
});