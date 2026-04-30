import { useState } from "react";

const runnerTests = [
  {
    id: "pom.smokeTest",
    name: "pom.smokeTest",
    dataCy: "pom-smokeTest",
    commands: [
      {
        id: "pom-smokeTest-step-1",
        command: "visit /",
        screenshotUrl: "/tempScreenshots/steps/pom-smokeTest-step-1.png",
      },
      {
        id: "pom-smokeTest-step-2",
        command: "get h1",
        screenshotUrl: "/tempScreenshots/steps/pom-smokeTest-step-2.png",
      },
      {
        id: "pom-smokeTest-step-3",
        command: "get username",
        screenshotUrl: "/tempScreenshots/steps/pom-smokeTest-step-3.png",
      },
    ],
  },
  {
    id: "pom.checkoutFlow",
    name: "pom.checkoutFlow",
    dataCy: "pom-checkoutFlow",
    commands: [],
  },
  {
    id: "pom.invalidLogin",
    name: "pom.invalidLogin",
    dataCy: "pom-invalidLogin",
    commands: [],
  },
  {
    id: "pom.addToCartFailure",
    name: "pom.addToCartFailure",
    dataCy: "pom-addToCartFailure",
    commands: [],
  },
  {
    id: "api.apiSuccess",
    name: "api.apiSuccess",
    dataCy: "api-apiSuccess",
    commands: [],
  },
  {
    id: "api.apiFailure",
    name: "api.apiFailure",
    dataCy: "api-apiFailure",
    commands: [],
  },
];

function App() {
  const [page, setPage] = useState("login");
  const [cart, setCart] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  const [selectedTests, setSelectedTests] = useState([]);
  const [runResults, setRunResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [saveResults, setSaveResults] = useState(false);

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

  function toggleTest(testId) {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  }

  function selectPomTests() {
    setSelectedTests((prev) => [
      ...new Set([
        ...prev,
        "pom.smokeTest",
        "pom.checkoutFlow",
        "pom.invalidLogin",
        "pom.addToCartFailure",
      ]),
    ]);
  }

  function selectApiTests() {
    setSelectedTests((prev) => [
      ...new Set([...prev, "api.apiSuccess", "api.apiFailure"]),
    ]);
  }

  function runSelectedTests() {
    const selected = runnerTests.filter((test) =>
      selectedTests.includes(test.id)
    );

    setRunResults(selected);

    if (selected.length > 0) {
      setSelectedResult(selected[0]);
      setSelectedCommand(selected[0].commands[0] || null);
    }

    if (saveResults) {
      console.log("Save Test Results enabled", {
        executedAt: new Date().toISOString(),
        results: selected,
      });
    }
  }

  if (page === "test-runner") {
    return (
      <div>
        <h1>Test Runner Page</h1>

        <h2>POM Tests</h2>

        <label>
          <input
            type="checkbox"
            data-cy="pom-group-checkbox"
            onChange={selectPomTests}
          />
          Select All POM Tests
        </label>

        {runnerTests
          .filter((test) => test.id.startsWith("pom."))
          .map((test) => (
            <label key={test.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                data-cy={test.dataCy}
                checked={selectedTests.includes(test.id)}
                onChange={() => toggleTest(test.id)}
              />
              {test.name}
            </label>
          ))}

        <h2>API Tests</h2>

        <label>
          <input
            type="checkbox"
            data-cy="api-group-checkbox"
            onChange={selectApiTests}
          />
          Select All API Tests
        </label>

        {runnerTests
          .filter((test) => test.id.startsWith("api."))
          .map((test) => (
            <label key={test.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                data-cy={test.dataCy}
                checked={selectedTests.includes(test.id)}
                onChange={() => toggleTest(test.id)}
              />
              {test.name}
            </label>
          ))}

       <h2>Selected Tests</h2>

        <div data-cy="selected-tests-list">
          {selectedTests.map((testId) => (
            <div key={testId}>{testId}</div>
          ))}
        </div>

        <button
          data-cy="run-selected-tests"
          disabled={selectedTests.length === 0}
          onClick={runSelectedTests}
        >
          Run Selected Tests
        </button>

        <label style={{ display: "block", marginTop: "10px" }}>
          <input
            type="checkbox"
            data-cy="save-test-results"
            checked={saveResults}
            onChange={(e) => setSaveResults(e.target.checked)}
          />
          Save Test Results to MongoDB
        </label>

        <h2>Run Results</h2>

        {runResults.map((result) => (
          <button
            key={result.id}
            data-cy="run-result"
            onClick={() => {
              setSelectedResult(result);
              setSelectedCommand(result.commands[0] || null);
            }}
          >
            {result.name}
          </button>
        ))}

        <h2>Command Log</h2>

        {selectedResult?.commands.map((command) => (
          <button
            key={command.id}
            data-cy={`command-${command.id}`}
            onClick={() => setSelectedCommand(command)}
          >
            {command.command}
          </button>
        ))}

        <h2>Captured Image</h2>

        {selectedCommand && (
          <img
            data-cy="captured-step-image"
            className="captured-image"
            src={selectedCommand.screenshotUrl}
            alt={selectedCommand.command}
            style={{ width: "600px", border: "1px solid black" }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {page === "login" && (
        <div>
          <button
            data-cy="open-test-runner"
            onClick={() => setPage("test-runner")}
          >
            Open Test Runner
          </button>

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

          <button
            data-cy="checkout-button"
            onClick={() => setPage("checkout")}
          >
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