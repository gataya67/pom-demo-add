import LoginPage from "../pages/LoginPage";
import ProductsPage from "../pages/ProductsPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";

function captureStep(name) {
  cy.screenshot(name, {
    capture: "viewport",
    overwrite: true,
  });
}

describe("POM Demo Test", () => {
  let testData;

  beforeEach(() => {
    cy.fixture("users").then((data) => {
      testData = data;
    });
  });

  it("smoke test - app loads login page", () => {
    LoginPage.visit();
    captureStep("pom-smokeTest-step-1");

    LoginPage.verifyPageLoaded();
    captureStep("pom-smokeTest-step-2");

    cy.get('[data-cy="username"]').should("be.visible");
    captureStep("pom-smokeTest-step-3");
  });

  it("logs in, adds laptop to cart using mocked API, and checks out", () => {
    LoginPage.visit();
    captureStep("pom-checkoutFlow-step-1");

    LoginPage.login(testData.validUser.username, testData.validUser.password);
    captureStep("pom-checkoutFlow-step-2");

    ProductsPage.verifyPageLoaded();
    captureStep("pom-checkoutFlow-step-3");

    cy.intercept("POST", "http://localhost:3001/api/cart", {
      statusCode: 200,
      body: { success: true, item: "Laptop" },
    }).as("addToCart");

    ProductsPage.addLaptop();
    cy.wait("@addToCart");
    captureStep("pom-checkoutFlow-step-4");

    ProductsPage.goToCart();
    CartPage.verifyItemInCart("Laptop");
    captureStep("pom-checkoutFlow-step-5");

    CartPage.checkout();
    CheckoutPage.verifyOrderSuccess();
    captureStep("pom-checkoutFlow-step-6");
  });

  it("shows error for invalid login", () => {
    LoginPage.visit();
    captureStep("pom-invalidLogin-step-1");

    LoginPage.enterUsername(testData.invalidUser.username);
    captureStep("pom-invalidLogin-step-2");

    LoginPage.enterPassword(testData.invalidUser.password);
    captureStep("pom-invalidLogin-step-3");

    LoginPage.submit();
    captureStep("pom-invalidLogin-step-4");

    LoginPage.verifyLoginError(testData.messages.invalidLogin);
    captureStep("pom-invalidLogin-step-5");
  });

  it("shows error when add to cart API fails", () => {
    LoginPage.visit();
    captureStep("pom-addToCartFailure-step-1");

    LoginPage.login(testData.validUser.username, testData.validUser.password);
    ProductsPage.verifyPageLoaded();
    captureStep("pom-addToCartFailure-step-2");

    cy.intercept("POST", "http://localhost:3001/api/cart", {
      statusCode: 500,
      body: { success: false },
    }).as("addToCartFailure");

    ProductsPage.addLaptop();
    cy.wait("@addToCartFailure");
    captureStep("pom-addToCartFailure-step-3");

    ProductsPage.verifyCartError(testData.messages.cartError);
    captureStep("pom-addToCartFailure-step-4");

    cy.get('[data-cy="cart-error"]').should("be.visible");
    captureStep("pom-addToCartFailure-step-5");
  });
});