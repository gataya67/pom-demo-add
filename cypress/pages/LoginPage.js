class LoginPage {
  visit() {
    cy.visit("/");
  }

  enterUsername(username) {
    cy.get('[data-cy="username"]').clear().type(username);
  }

  enterPassword(password) {
    cy.get('[data-cy="password"]').clear().type(password);
  }

  submit() {
    cy.get('[data-cy="login-button"]').click();
  }

  login(username, password) {
    this.enterUsername(username);
    this.enterPassword(password);
    this.submit();
  }

  verifyPageLoaded() {
    cy.get("h1").should("contain.text", "Login Page");
    cy.get('[data-cy="username"]').should("be.visible");
    cy.get('[data-cy="password"]').should("be.visible");
    cy.get('[data-cy="login-button"]').should("be.visible");
  }

  verifyLoginError(message) {
    cy.get('[data-cy="login-error"]').should("contain.text", message);
  }
}

export default new LoginPage();