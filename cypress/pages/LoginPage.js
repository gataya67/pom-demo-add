class LoginPage {
  visit() {
    cy.visit("/");
  }

  login(username, password) {
    cy.get('[data-cy="username"]').clear().type(username);
    cy.get('[data-cy="password"]').clear().type(password);
    cy.get('[data-cy="login-button"]').click();
  }

  verifyLoginError(message) {
    cy.get('[data-cy="login-error"]').should("contain.text", message);
  }
}

export default new LoginPage();