import LoginPage from "../pages/LoginPage";
import ProductsPage from "../pages/ProductsPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";

describe("POM Demo Test", () => {
  let testData;

  beforeEach(() => {
    cy.fixture("users").then((data) => {
      testData = data;
    });
  });

  it("smoke test - app loads login page", () => {
    LoginPage.visit();

    cy.get("h1").should("contain.text", "Login Page");
    cy.get('[data-cy="username"]').should("be.visible");
    cy.get('[data-cy="password"]').should("be.visible");
    cy.get('[data-cy="login-button"]').should("be.visible");
  });

  it("logs in, adds laptop to cart using mocked API, and checks out", () => {
    LoginPage.visit();
    LoginPage.login(testData.validUser.username, testData.validUser.password);

    ProductsPage.verifyPageLoaded();

    cy.intercept("POST", "/api/cart", {
      statusCode: 200,
      body: { success: true },
    }).as("addToCart");

    ProductsPage.addLaptop();
    cy.wait("@addToCart");

    ProductsPage.goToCart();

    CartPage.verifyItemInCart("Laptop");
    CartPage.checkout();

    CheckoutPage.verifyOrderSuccess();
  });

  it("shows error for invalid login", () => {
    LoginPage.visit();
    LoginPage.login(testData.invalidUser.username, testData.invalidUser.password);

    LoginPage.verifyLoginError(testData.messages.invalidLogin);
  });

  it("shows error when add to cart API fails", () => {
    LoginPage.visit();
    LoginPage.login(testData.validUser.username, testData.validUser.password);

    ProductsPage.verifyPageLoaded();

    cy.intercept("POST", "/api/cart", {
      statusCode: 500,
      body: { success: false },
    }).as("addToCartFailure");

    ProductsPage.addLaptop();
    cy.wait("@addToCartFailure");

    ProductsPage.verifyCartError(testData.messages.cartError);
  });
});