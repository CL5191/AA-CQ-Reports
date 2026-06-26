const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { readAutoAttendantCsv, buildAutoAttendantSummary } = require("../src/aa-reader");

test("readAutoAttendantCsv parses rows from sample AA CSV", () => {
  const filePath = path.join(__dirname, "..", "data", "sample-aa.csv");
  const rows = readAutoAttendantCsv(filePath);

  assert.equal(rows.length, 5);
  assert.equal(rows[0].autoAttendantName, "Main AA");
  assert.equal(rows[0].menuOption, "Sales");
  assert.equal(rows[0].transferDestination, "Sales Queue");
  assert.equal(rows[0].agentName, "Alice");
  assert.equal(rows[0].timestamp, "2026-06-20T10:00:00Z");
});

test("buildAutoAttendantSummary returns expected AA metrics", () => {
  const rows = [
    { autoAttendantName: "Main AA", menuOption: "Sales", transferDestination: "Sales Queue", agentName: "Alice" },
    { autoAttendantName: "Main AA", menuOption: "Support", transferDestination: "Support Queue", agentName: "Bob" },
    { autoAttendantName: "After Hours AA", menuOption: "Operator", transferDestination: "Operator Line", agentName: "Alice" }
  ];

  const summary = buildAutoAttendantSummary(rows);

  assert.equal(summary.totalCalls, 3);
  assert.deepEqual(summary.callsPerAutoAttendant, {
    "After Hours AA": 1,
    "Main AA": 2
  });
  assert.deepEqual(summary.menuSelections, {
    Operator: 1,
    Sales: 1,
    Support: 1
  });
  assert.deepEqual(summary.transfersByDestination, {
    "Operator Line": 1,
    "Sales Queue": 1,
    "Support Queue": 1
  });
  assert.deepEqual(summary.callsAnsweredByAgent, {
    Alice: 2,
    Bob: 1
  });
  assert.deepEqual(summary.callsAnsweredByAutoAttendantAndAgent, {
    "After Hours AA": {
      Alice: 1
    },
    "Main AA": {
      Alice: 1,
      Bob: 1
    }
  });
});

test("readAutoAttendantCsv validates required file path", () => {
  assert.throws(() => readAutoAttendantCsv(), /CSV file path is required/);
});

test("readAutoAttendantCsv throws when required headers are missing", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-missing-headers-"));
  const filePath = path.join(tempDir, "missing-headers.csv");

  try {
    fs.writeFileSync(filePath, "CallId,Queue\n1001,Main\n", "utf8");

    assert.throws(
      () => readAutoAttendantCsv(filePath),
      /CSV is missing required headers: AutoAttendantName, MenuOption, TransferDestination\./
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
