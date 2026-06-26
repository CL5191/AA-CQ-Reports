const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { readCallQueueCsv, buildSummary } = require("../src/csv-reader");

test("readCallQueueCsv parses queue rows from sample CSV", () => {
  const filePath = path.join(__dirname, "..", "data", "sample-cq.csv");
  const rows = readCallQueueCsv(filePath);

  assert.equal(rows.length, 5);
  assert.equal(rows[0].queueName, "Sales");
  assert.equal(rows[0].waitTimeSeconds, 12);
  assert.equal(rows[0].agentName, "Alice");
  assert.equal(rows[0].timestamp, "2026-06-20T10:00:00Z");
  assert.equal(rows[4].queueName, "Support");
  assert.equal(rows[4].waitTimeSeconds, 0);
  assert.equal(rows[4].agentName, "Eli");
  assert.equal(rows[4].timestamp, "2026-06-20T10:04:00Z");
});

test("buildSummary returns total calls, average wait, and calls per queue", () => {
  const rows = [
    { queueName: "Sales", waitTimeSeconds: 10, agentName: "Alice" },
    { queueName: "Sales", waitTimeSeconds: 30, agentName: "Bob" },
    { queueName: "Support", waitTimeSeconds: 20, agentName: "Alice" }
  ];

  const summary = buildSummary(rows);

  assert.equal(summary.totalCalls, 3);
  assert.equal(summary.averageWaitTimeSeconds, 20);
  assert.deepEqual(summary.callsPerQueue, {
    Sales: 2,
    Support: 1
  });
  assert.deepEqual(summary.callsAnsweredByAgent, {
    Alice: 2,
    Bob: 1
  });
});

test("readCallQueueCsv validates required file path", () => {
  assert.throws(() => readCallQueueCsv(), /CSV file path is required/);
});

test("readCallQueueCsv throws when required headers are missing", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-cq-missing-headers-"));
  const filePath = path.join(tempDir, "missing-headers.csv");

  try {
    fs.writeFileSync(filePath, "CallId,Queue\n1001,Sales\n", "utf8");

    assert.throws(
      () => readCallQueueCsv(filePath),
      /CSV is missing required headers: QueueName, WaitTimeSeconds\./
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("readCallQueueCsv returns empty rows for header-only CSV", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-cq-header-only-"));
  const filePath = path.join(tempDir, "header-only.csv");

  try {
    fs.writeFileSync(filePath, "QueueName,WaitTimeSeconds\n", "utf8");

    const rows = readCallQueueCsv(filePath);
    assert.deepEqual(rows, []);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
