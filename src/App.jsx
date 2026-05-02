import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./App.css";

const API_BASE = "http://localhost:3001";

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

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
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
  const [runnerCompletedSuccessfully, setRunnerCompletedSuccessfully] =
    useState(false);
  const [runnerSaveMessage, setRunnerSaveMessage] = useState("");

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
      const response = await fetch(`${API_BASE}/api/cart`, {
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
    setRunnerCompletedSuccessfully(false);
    setRunnerSaveMessage("");

    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  }

  function selectGroup(groupTests) {
    setRunnerCompletedSuccessfully(false);
    setRunnerSaveMessage("");

    setSelectedTests((prev) => [
      ...new Set([...prev, ...groupTests.map((test) => test.id)]),
    ]);
  }

  function runSelectedTests() {
    setRunnerCompletedSuccessfully(false);
    setRunnerSaveMessage("");

    try {
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
        setRunnerCompletedSuccessfully(true);
      }
    } catch (runError) {
      console.error("Run Selected Tests failed", runError);
      setRunnerCompletedSuccessfully(false);
      setRunnerSaveMessage("Run failed. Results were not saved.");
    }
  }

  async function saveSelectedRunResults() {
    if (!runnerCompletedSuccessfully || runResults.length === 0) {
      setRunnerSaveMessage("Run tests successfully before saving.");
      return;
    }

    try {
      const payload = {
        buildId: `local-${Date.now()}`,
        executedAt: new Date().toISOString(),
        results: runResults.map((test) => ({
          FeatureName: test.group.toUpperCase(),
          TestName: test.name,
          Result: true,
          commands: test.commands,
        })),
      };

      const response = await fetch(`${API_BASE}/api/test-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save results");
      }

      setRunnerSaveMessage("Results saved to MongoDB.");
    } catch (saveError) {
      console.error("Save Test Results failed", saveError);
      setRunnerSaveMessage(saveError.message);
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

            {runnerCompletedSuccessfully && (
              <button
                type="button"
                data-cy="save-run-results"
                onClick={saveSelectedRunResults}
                className="primary-button"
              >
                Save Results
              </button>
            )}

            {runnerSaveMessage && (
              <p className="error-text">{runnerSaveMessage}</p>
            )}
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

  if (page === "test-reporter") {
    return <TestReporterPage setPage={setPage} />;
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

          <button
            type="button"
            data-cy="open-test-reporter"
            onClick={() => setPage("test-reporter")}
            className="primary-button"
          >
            Open Test Reporter
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

function TestReporterPage({ setPage }) {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [runs, setRuns] = useState([]);
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedSummaryRun, setSelectedSummaryRun] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setMessage("");

      const response = await fetch(`${API_BASE}/api/reporter/tests`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load tests");
      }

      setTests(data.tests || []);
    } catch (error) {
      setTests([]);
      setMessage(error.message);
    }
  }

  async function loadRuns(testId) {
    setSelectedTestId(testId);
    setSelectedRunIds([]);
    setRuns([]);
    setReport(null);
    setSelectedSummaryRun(null);
    setSelectedCommand(null);

    if (!testId) return;

    try {
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/reporter/test-runs/${testId}`
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load test runs");
      }

      setRuns(data.runs || []);
    } catch (error) {
      setRuns([]);
      setMessage(error.message);
    }
  }

  function toggleRun(runId) {
    setSelectedRunIds((prev) =>
      prev.includes(runId)
        ? prev.filter((id) => id !== runId)
        : [...prev, runId]
    );
  }

  function selectSummaryRun(run) {
    const commands = Array.isArray(run.commands) ? run.commands : [];

    setSelectedSummaryRun(run);
    setSelectedCommand(commands[0] || null);
  }

  async function generateReport() {
    if (!selectedTestId || selectedRunIds.length === 0) {
      setMessage("Select a test and at least one run.");
      return;
    }

    try {
      setMessage("");
      setReport(null);
      setSelectedSummaryRun(null);
      setSelectedCommand(null);

      const response = await fetch(`${API_BASE}/api/reporter/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTestId,
          runIds: selectedRunIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to generate report");
      }

      const nextReport = data.report;
      const firstRun = nextReport?.runs?.[0] || null;
      const firstCommand = firstRun?.commands?.[0] || null;

      setReport(nextReport);
      setSelectedSummaryRun(firstRun);
      setSelectedCommand(firstCommand);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function saveReportToXlsx() {
    if (!report?.runs?.length) return;

    const rows = report.runs.map((run) => {
      const failedCommand =
        run.result === false
          ? run.commands?.find((command) => command.status === "failed")
              ?.name || "Unknown failed command"
          : "N/A";

      return {
        "Feature Name": run.featureName,
        "Test Name": run.testName,
        "Build ID": run.summary?.buildId || run.buildId || "N/A",
        "Date Ran": formatDate(run.summary?.dateRan || run.dateRan),
        Result: run.result ? "Passed" : "Failed",
        "Failed Command": failedCommand,
        "Command Count": run.summary?.commandCount ?? 0,
        "Image Count": run.summary?.imageCount ?? 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `test-report-${Date.now()}.xlsx`);
  }

  const visibleCommands = selectedSummaryRun?.commands || [];

  return (
    <main className="runner-page">
      <h1 className="runner-title">Test Reporter Page</h1>

      <section className="runner-top-grid">
        <div className="runner-card">
          <h2>Select Test</h2>

          <select
            data-cy="reporter-test-select"
            value={selectedTestId}
            onChange={(e) => loadRuns(e.target.value)}
            className="app-input"
          >
            <option value="">Select Test</option>

            {tests.map((test) => (
              <option key={test._id} value={test._id}>
                {test.FeatureName} / {test.TestName}
              </option>
            ))}
          </select>

          <button type="button" className="primary-button" onClick={loadTests}>
            Refresh Tests
          </button>
        </div>

        <div className="runner-card">
          <h2>Select Runs</h2>

          {runs.length === 0 && <p>No runs loaded.</p>}

          {runs.map((run) => (
            <label key={run._id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedRunIds.includes(run._id)}
                onChange={() => toggleRun(run._id)}
              />
              <span>
                {formatDate(run.DateRan)} - {run.Result ? "Passed" : "Failed"}
              </span>
            </label>
          ))}
        </div>

        <div className="runner-card">
          <h2>Actions</h2>

          <button type="button" className="primary-button" onClick={generateReport}>
            Generate Report
          </button>

          {report && (
            <button
              type="button"
              className="primary-button"
              onClick={saveReportToXlsx}
            >
              Save Results
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={() => setPage("login")}
          >
            Back To Login
          </button>

          {message && <p className="error-text">{message}</p>}
        </div>
      </section>

      {report && (
        <section className="runner-results-grid">
          <div className="runner-card">
            <h2>Summary</h2>

            {report.runs.map((run) => (
              <button
                key={run._id}
                type="button"
                className={
                  selectedSummaryRun?._id === run._id
                    ? "result-row selected"
                    : "result-row"
                }
                onClick={() => selectSummaryRun(run)}
              >
                <div>
                  <strong>
                    {run.featureName} / {run.testName}
                  </strong>

                  <div className="summary-details">
                    <div className="summary-row">
                      <span className="summary-label">Result:</span>
                      <span>{run.result ? "Passed" : "Failed"}</span>
                    </div>

                    <div className="summary-row">
                      <span className="summary-label">Build:</span>
                      <span>{run.summary?.buildId || run.buildId || "N/A"}</span>
                    </div>

                    <div className="summary-row">
                      <span className="summary-label">Date Ran:</span>
                      <span>{formatDate(run.summary?.dateRan || run.dateRan)}</span>
                    </div>

                    <div className="summary-row">
                      <span className="summary-label">Commands:</span>
                      <span>{run.summary?.commandCount ?? 0}</span>
                    </div>

                    <div className="summary-row">
                      <span className="summary-label">Images:</span>
                      <span>{run.summary?.imageCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="runner-card">
            <h2>Commands</h2>

            {!selectedSummaryRun && <p>Select a run from Summary.</p>}

            {selectedSummaryRun && visibleCommands.length === 0 && (
              <p>No commands for this selected run.</p>
            )}

            {visibleCommands.map((command, commandIndex) => {
              const commandNumber = command.index ?? commandIndex + 1;
              const commandName =
                command.name || command.command || "Unnamed command";
              const localCommandKey = `${selectedSummaryRun._id}-command-${commandNumber}-${commandName}`;

              return (
                <button
                  key={localCommandKey}
                  type="button"
                  className={
                    selectedCommand?.localCommandKey === localCommandKey
                      ? "command-row selected"
                      : "command-row"
                  }
                  onClick={() =>
                    setSelectedCommand({
                      ...command,
                      index: commandNumber,
                      name: commandName,
                      localCommandKey,
                    })
                  }
                >
                  {commandNumber}. {commandName}
                </button>
              );
            })}
          </div>

          <div className="runner-card">
            <h2>Images</h2>

            {!selectedCommand && <p>Select a command to see its image.</p>}

            {selectedCommand && !selectedCommand.imageId && (
              <p>No stored image for this command.</p>
            )}

            {selectedCommand?.imageId && (
              <img
                data-cy="reporter-command-image"
                className="captured-image"
                src={`${API_BASE}/api/reporter/image/${selectedCommand.imageId}`}
                alt={selectedCommand.name}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;