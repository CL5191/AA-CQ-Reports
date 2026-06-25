const test = require("node:test");
const assert = require("node:assert/strict");
const { hello, formatSummary, parseCliArgs, renderSummary } = require("../src/index");

test("hello uses default value", () => {
  assert.equal(hello(), "Hello, AA-CQ reports are ready.");
});

test("hello accepts custom name", () => {
  assert.equal(hello("Team"), "Hello, Team reports are ready.");
});

test("formatSummary renders core metrics for stakeholders", () => {
  const summaryText = formatSummary({
    totalCalls: 5,
    averageWaitTimeSeconds: 15,
    callsPerQueue: {
      Support: 3,
      Sales: 2
    }
  });

  assert.match(summaryText, /Total Calls: 5/);
  assert.match(summaryText, /Average Wait Time \(seconds\): 15/);
  assert.match(summaryText, /- Sales: 2/);
  assert.match(summaryText, /- Support: 3/);
});

test("parseCliArgs reads csv path and format flag", () => {
  const options = parseCliArgs(["data/sample-cq.csv", "--format", "json"]);
  assert.deepEqual(options, {
    csvPath: "data/sample-cq.csv",
    format: "json"
  });
});

test("renderSummary supports json output", () => {
  const output = renderSummary(
    {
      totalCalls: 1,
      averageWaitTimeSeconds: 3,
      callsPerQueue: { Sales: 1 }
    },
    "json"
  );

  assert.equal(JSON.parse(output).totalCalls, 1);
});

test("renderSummary rejects unsupported format", () => {
  assert.throws(
    () => renderSummary({ totalCalls: 0, averageWaitTimeSeconds: 0, callsPerQueue: {} }, "xml"),
    /Invalid format/
  );
});
