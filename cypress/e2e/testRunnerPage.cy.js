import LoginPage from "../pages/LoginPage";
import TestRunnerPage from "../pages/TestRunnerPage";

describe("Test Runner Page", () => {
  it("expands POM group and selects all POM tests", () => {
    LoginPage.visit();

    TestRunnerPage.open();
    TestRunnerPage.verifyPageLoaded();

    TestRunnerPage.expandPomGroup();
    TestRunnerPage.selectAllPomTests();

    TestRunnerPage.verifySelectedTest("pom.smokeTest");
    TestRunnerPage.verifySelectedTest("pom.checkoutFlow");
    TestRunnerPage.verifySelectedTest("pom.invalidLogin");
    TestRunnerPage.verifySelectedTest("pom.addToCartFailure");
  });

  it("allows user to deselect one POM test after selecting all", () => {
    LoginPage.visit();

    TestRunnerPage.open();
    TestRunnerPage.verifyPageLoaded();

    TestRunnerPage.expandPomGroup();
    TestRunnerPage.selectAllPomTests();
    TestRunnerPage.deselectPomCheckoutFlow();

    TestRunnerPage.verifySelectedTest("pom.smokeTest");
    TestRunnerPage.verifyTestNotSelected("pom.checkoutFlow");
    TestRunnerPage.verifySelectedTest("pom.invalidLogin");
    TestRunnerPage.verifySelectedTest("pom.addToCartFailure");
  });

  it("selects all tests from all groups", () => {
    LoginPage.visit();

    TestRunnerPage.open();
    TestRunnerPage.verifyPageLoaded();

    TestRunnerPage.expandPomGroup();
    TestRunnerPage.selectAllPomTests();

    TestRunnerPage.expandApiGroup();
    TestRunnerPage.selectAllApiTests();

    TestRunnerPage.verifySelectedTest("pom.smokeTest");
    TestRunnerPage.verifySelectedTest("pom.checkoutFlow");
    TestRunnerPage.verifySelectedTest("pom.invalidLogin");
    TestRunnerPage.verifySelectedTest("pom.addToCartFailure");

    TestRunnerPage.verifySelectedTest("api.apiSuccess");
    TestRunnerPage.verifySelectedTest("api.apiFailure");
  });

  it("captures real app screenshots first, then displays them in Test Runner", () => {
    cy.visit("/");
    cy.screenshot("pom-smokeTest-step-1", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get("h1").should("contain.text", "Login Page");
    cy.screenshot("pom-smokeTest-step-2", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get('[data-cy="username"]').should("be.visible");
    cy.screenshot("pom-smokeTest-step-3", {
      capture: "viewport",
      overwrite: true,
    });

    cy.visit("/");
    cy.screenshot("pom-checkoutFlow-step-1", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get('[data-cy="username"]').clear().type("test");
    cy.get('[data-cy="password"]').clear().type("123");
    cy.get('[data-cy="login-button"]').click();
    cy.screenshot("pom-checkoutFlow-step-2", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get('[data-cy="products-title"]').should("be.visible");
    cy.screenshot("pom-checkoutFlow-step-3", {
      capture: "viewport",
      overwrite: true,
    });

    cy.intercept("POST", "/api/cart", {
      statusCode: 200,
      body: { success: true },
    }).as("addToCart");

    cy.get('[data-cy="add-laptop"]').click();
    cy.wait("@addToCart");
    cy.screenshot("pom-checkoutFlow-step-4", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get('[data-cy="go-to-cart"]').click();
    cy.get('[data-cy="cart-item"]').should("contain.text", "Laptop");
    cy.screenshot("pom-checkoutFlow-step-5", {
      capture: "viewport",
      overwrite: true,
    });

    cy.get('[data-cy="checkout-button"]').click();
    cy.get('[data-cy="order-success"]').should("be.visible");
    cy.screenshot("pom-checkoutFlow-step-6", {
      capture: "viewport",
      overwrite: true,
    });

    cy.visit("/");
    TestRunnerPage.open();
    TestRunnerPage.verifyPageLoaded();

    TestRunnerPage.expandPomGroup();
    TestRunnerPage.selectAllPomTests();

    cy.get('[data-cy="run-selected-tests"]').click();
    cy.get('[data-cy="command-pom-smokeTest-step-1"]').click();

    cy.get('[data-cy="captured-step-image"]')
      .should("be.visible")
      .and("have.attr", "src")
      .and("include", "/tempScreenshots/steps/pom-smokeTest-step-1.png");
  });
});