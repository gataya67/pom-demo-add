class CartPage {
  verifyItemInCart(itemName) {
    cy.get('[data-cy="cart-item"]').should("contain.text", itemName);
  }

  checkout() {
    cy.get('[data-cy="checkout-button"]').click();
  }
}

export default new CartPage();