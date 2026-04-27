class CheckoutPage {
  verifyOrderSuccess() {
    cy.get('[data-cy="order-success"]').should("be.visible");
  }
}

export default new CheckoutPage();