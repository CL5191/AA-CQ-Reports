const test = require("node:test");
const assert = require("node:assert/strict");
const { formatSummaryText, formatSummaryJson } = require("../src/reporter");

test("formatSummaryText renders human-readable metrics", () => {
  const output = formatSummaryText({
    totalCalls: 4,
    averageWaitTimeSeconds: 11,
    callsPerQueue: {
      Support: 3,
      Sales: 1
    }
  });

  assert.match(output, /AA-CQ Summary/);
  assert.match(output, /Total Calls: 4/);
  assert.match(output, /Average Wait Time \(seconds\): 11/);
  assert.match(output, /- Sales: 1/);
  assert.match(output, /- Support: 3/);
});

test("formatSummaryJson renders the summary object as JSON", () => {
  const summary = {
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: {
      Sales: 2
    }
  };

  const output = formatSummaryJson(summary);
  assert.deepEqual(JSON.parse(output), summary);
});
