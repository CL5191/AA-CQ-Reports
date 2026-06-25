const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { readCallQueueCsv, buildSummary } = require("../src/csv-reader");

test("readCallQueueCsv parses queue rows from sample CSV", () => {
  const filePath = path.join(__dirname, "..", "data", "sample-cq.csv");
  const rows = readCallQueueCsv(filePath);

  assert.equal(rows.length, 5);
  assert.equal(rows[0].queueName, "Sales");
  assert.equal(rows[0].waitTimeSeconds, 12);
  assert.equal(rows[4].queueName, "Support");
  assert.equal(rows[4].waitTimeSeconds, 0);
});

test("buildSummary returns total calls, average wait, and calls per queue", () => {
  const rows = [
    { queueName: "Sales", waitTimeSeconds: 10 },
    { queueName: "Sales", waitTimeSeconds: 30 },
    { queueName: "Support", waitTimeSeconds: 20 }
  ];

  const summary = buildSummary(rows);

  assert.equal(summary.totalCalls, 3);
  assert.equal(summary.averageWaitTimeSeconds, 20);
  assert.deepEqual(summary.callsPerQueue, {
    Sales: 2,
    Support: 1
  });
});

test("readCallQueueCsv validates required file path", () => {
  assert.throws(() => readCallQueueCsv(), /CSV file path is required/);
});
