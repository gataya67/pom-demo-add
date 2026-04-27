import { useState } from "react";

function App() {
  const [page, setPage] = useState("login");
  const [cart, setCart] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  function handleLogin() {
    if (username === "test" && password === "123") {
      setError("");
      setPage("products");
    } else {
      setError("Invalid username or password");
    }
  }

  async function addLaptopToCart() {
    setCartError("");

    const response = await fetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ item: "Laptop" }),
    });

    if (response.ok) {
      setCart(["Laptop"]);
    } else {
      setCartError("Unable to add item to cart");
    }
  }

  return (
    <div>
      {page === "login" && (
        <div>
          <h1>Login Page</h1>

          <input
            data-cy="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            data-cy="password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button data-cy="login-button" onClick={handleLogin}>
            Login
          </button>

          {error && <p data-cy="login-error">{error}</p>}
        </div>
      )}

      {page === "products" && (
        <div>
          <h1 data-cy="products-title">Products Page</h1>

          <p data-cy="product-name">Laptop</p>

          <button data-cy="add-laptop" onClick={addLaptopToCart}>
            Add Laptop
          </button>

          {cartError && <p data-cy="cart-error">{cartError}</p>}

          <button data-cy="go-to-cart" onClick={() => setPage("cart")}>
            Go To Cart
          </button>
        </div>
      )}

      {page === "cart" && (
        <div>
          <h1 data-cy="cart-title">Cart Page</h1>

          {cart.map((item) => (
            <p data-cy="cart-item" key={item}>
              {item}
            </p>
          ))}

          <button data-cy="checkout-button" onClick={() => setPage("checkout")}>
            Checkout
          </button>
        </div>
      )}

      {page === "checkout" && (
        <div>
          <h1 data-cy="order-success">Order Successful</h1>
        </div>
      )}
    </div>
  );
}

export default App;