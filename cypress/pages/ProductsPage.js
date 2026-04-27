class ProductsPage {
  verifyPageLoaded() {
    cy.get('[data-cy="products-title"]').should("be.visible");
  }

  addLaptop() {
    cy.get('[data-cy="add-laptop"]').click();
  }

  goToCart() {
    cy.get('[data-cy="go-to-cart"]').click();
  }

  verifyCartError(message) {
    cy.get('[data-cy="cart-error"]').should("contain.text", message);
  }
}

export default new ProductsPage();