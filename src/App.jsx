import { useState } from "react";
import "./App.css";

const runnerTests = [
  {
    id: "pom.smokeTest",
    name: "pom.smokeTest",
    dataCy: "pom-smokeTest",
    group: "pom",
    steps: ["visit /", "verify Login Page title", "verify username field"],
  },
  {
    id: "pom.checkoutFlow",
    name: "pom.checkoutFlow",
    dataCy: "pom-checkoutFlow",
    group: "pom",
    steps: [
      "visit /",
      "login valid user",
      "verify Products Page",
      "add laptop to cart",
      "verify cart item",
      "checkout success",
    ],
  },
  {
    id: "pom.invalidLogin",
    name: "pom.invalidLogin",
    dataCy: "pom-invalidLogin",
    group: "pom",
    steps: [
      "visit /",
      "enter invalid username",
      "enter invalid password",
      "click login",
      "verify login error",
    ],
  },
  {
    id: "pom.addToCartFailure",
    name: "pom.addToCartFailure",
    dataCy: "pom-addToCartFailure",
    group: "pom",
    steps: [
      "visit /",
      "login valid user",
      "mock add-to-cart failure",
      "click add laptop",
      "verify cart error",
    ],
  },
  {
    id: "api.apiSuccess",
    name: "api.apiSuccess",
    dataCy: "api-apiSuccess",
    group: "api",
    steps: [],
  },
  {
    id: "api.apiFailure",
    name: "api.apiFailure",
    dataCy: "api-apiFailure",
    group: "api",
    steps: [],
  },
];

function buildCommands(test) {
  const baseName = test.id.replace(".", "-");

  return test.steps.map((stepName, index) => {
    const stepNumber = index + 1;

    return {
      id: `${baseName}-step-${stepNumber}`,
      command: stepName,
      screenshotUrl: `/tempScreenshots/${baseName}-step-${stepNumber}.png`,
    };
  });
}

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

  const pomTests = runnerTests.filter((test) => test.group === "pom");
  const apiTests = runnerTests.filter((test) => test.group === "api");

  function handleLogin() {
    if (username === "test" && password === "123") {
      setError("");
      setCartError("");
      setPage("products");
    } else {
      setError("Invalid username or password");
    }
  }

  async function addLaptopToCart() {
    setCartError("");

    try {
      const response = await fetch("http://localhost:3001/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item: "Laptop" }),
      });

      if (!response.ok) {
        setCartError("Unable to add item to cart");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCart(["Laptop"]);
      } else {
        setCartError("Unable to add item to cart");
      }
    } catch {
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

  function selectGroup(groupTests) {
    setSelectedTests((prev) => [
      ...new Set([...prev, ...groupTests.map((test) => test.id)]),
    ]);
  }

  function runSelectedTests() {
    const selected = runnerTests
      .filter((test) => selectedTests.includes(test.id))
      .map((test) => ({
        ...test,
        commands: buildCommands(test),
      }));

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
      <main className="runner-page">
        <h1 className="runner-title">Test Runner Page</h1>

        <section className="runner-top-grid">
          <div className="runner-card">
            <h2>POM Tests</h2>

            <label className="checkbox-row">
              <input
                type="checkbox"
                data-cy="pom-group-checkbox"
                onChange={() => selectGroup(pomTests)}
              />
              <span>Select All POM Tests</span>
            </label>

            <div className="test-list">
              {pomTests.map((test) => (
                <label key={test.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    data-cy={test.dataCy}
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                  />
                  <span>{test.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="runner-card">
            <h2>API Tests</h2>

            <label className="checkbox-row">
              <input
                type="checkbox"
                data-cy="api-group-checkbox"
                onChange={() => selectGroup(apiTests)}
              />
              <span>Select All API Tests</span>
            </label>

            <div className="test-list">
              {apiTests.map((test) => (
                <label key={test.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    data-cy={test.dataCy}
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTest(test.id)}
                  />
                  <span>{test.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="runner-card">
            <h2>Selected Tests</h2>

            <div data-cy="selected-tests-list" className="selected-tests-list">
              {selectedTests.length === 0 && <p>No tests selected.</p>}

              {selectedTests.map((testId) => (
                <div key={testId}>{testId}</div>
              ))}
            </div>

            <button
              type="button"
              data-cy="run-selected-tests"
              disabled={selectedTests.length === 0}
              onClick={runSelectedTests}
              className="primary-button"
            >
              Run Selected Tests
            </button>

            <label className="save-row">
              <input
                type="checkbox"
                data-cy="save-test-results"
                checked={saveResults}
                onChange={(e) => setSaveResults(e.target.checked)}
              />
              <span>Save Test Results to MongoDB</span>
            </label>
          </div>
        </section>

        <section className="runner-results-grid">
          <div className="runner-card">
            <h2>Run Results</h2>

            {runResults.length === 0 && <p>No run results yet.</p>}

            {runResults.map((result) => (
              <button
                key={result.id}
                type="button"
                data-cy="run-result"
                className={
                  selectedResult?.id === result.id
                    ? "result-row selected"
                    : "result-row"
                }
                onClick={() => {
                  setSelectedResult(result);
                  setSelectedCommand(result.commands[0] || null);
                }}
              >
                <span className="pass-icon">✓</span>
                <span>{result.name}</span>
              </button>
            ))}
          </div>

          <div className="runner-card">
            <h2>Command Log</h2>

            {!selectedResult && <p>Select a run result.</p>}

            {selectedResult?.commands.length === 0 && (
              <p>No commands for this test yet.</p>
            )}

            {selectedResult?.commands.map((command) => (
              <button
                key={command.id}
                type="button"
                data-cy={`command-${command.id}`}
                className={
                  selectedCommand?.id === command.id
                    ? "command-row selected"
                    : "command-row"
                }
                onClick={() => setSelectedCommand(command)}
              >
                {command.command}
              </button>
            ))}
          </div>

          <div className="runner-card">
            <h2>Captured Image</h2>

            {!selectedCommand && <p>Select a command to see its image.</p>}

            {selectedCommand && (
              <img
                data-cy="captured-step-image"
                className="captured-image"
                src={`${selectedCommand.screenshotUrl}?v=${Date.now()}`}
                alt={selectedCommand.command}
              />
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      {page === "login" && (
        <section className="app-card">
          <button
            type="button"
            data-cy="open-test-runner"
            onClick={() => setPage("test-runner")}
            className="primary-button"
          >
            Open Test Runner
          </button>

          <h1>Login Page</h1>

          <input
            data-cy="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="app-input"
          />

          <input
            data-cy="password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="app-input"
          />

          <button
            type="button"
            data-cy="login-button"
            onClick={handleLogin}
            className="primary-button"
          >
            Login
          </button>

          {error && (
            <p data-cy="login-error" className="error-text">
              {error}
            </p>
          )}
        </section>
      )}

      {page === "products" && (
        <section className="app-card">
          <h1 data-cy="products-title">Products Page</h1>

          <p data-cy="product-name">Laptop</p>

          <button
            type="button"
            data-cy="add-laptop"
            onClick={addLaptopToCart}
            className="primary-button"
          >
            Add Laptop
          </button>

          {cartError && (
            <p data-cy="cart-error" className="error-text">
              {cartError}
            </p>
          )}

          <button
            type="button"
            data-cy="go-to-cart"
            onClick={() => setPage("cart")}
            className="primary-button"
          >
            Go To Cart
          </button>
        </section>
      )}

      {page === "cart" && (
        <section className="app-card">
          <h1 data-cy="cart-title">Cart Page</h1>

          {cart.map((item) => (
            <p data-cy="cart-item" key={item}>
              {item}
            </p>
          ))}

          <button
            type="button"
            data-cy="checkout-button"
            onClick={() => setPage("checkout")}
            className="primary-button"
          >
            Checkout
          </button>
        </section>
      )}

      {page === "checkout" && (
        <section className="app-card">
          <h1 data-cy="order-success">Order Successful</h1>
        </section>
      )}
    </main>
  );
}

export default App;