class TestRunnerPage {
  open() {
    cy.get('[data-cy="open-test-runner"]').click();
  }

  verifyPageLoaded() {
    cy.contains("h1", "Test Runner Page").should("be.visible");
  }

  expandPomGroup() {
    cy.contains("h2", "POM Tests").should("be.visible");
  }

  selectAllPomTests() {
    cy.get('[data-cy="pom-group-checkbox"]').check();
  }

  deselectPomCheckoutFlow() {
    cy.get('[data-cy="pom-checkoutFlow"]').uncheck();
  }

  expandApiGroup() {
    cy.contains("h2", "API Tests").should("be.visible");
  }

  selectAllApiTests() {
    cy.get('[data-cy="api-group-checkbox"]').check();
  }

  verifySelectedTest(testName) {
    cy.get('[data-cy="selected-tests-list"]').should("contain.text", testName);
  }

  verifyTestNotSelected(testName) {
    cy.get('[data-cy="selected-tests-list"]').should(
      "not.contain.text",
      testName
    );
  }
}

export default new TestRunnerPage();