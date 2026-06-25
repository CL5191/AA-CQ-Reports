const test = require("node:test");
const assert = require("node:assert/strict");
const { hello, formatSummary, parseCliArgs, renderSummary, readRowsFromCsvFiles } = require("../src/index");

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
    csvPaths: ["data/sample-cq.csv"],
    format: "json",
    source: "cq"
  });
});

test("parseCliArgs supports csv output format", () => {
  const options = parseCliArgs(["data/sample-cq.csv", "--format", "csv"]);
  assert.deepEqual(options, {
    csvPaths: ["data/sample-cq.csv"],
    format: "csv",
    source: "cq"
  });
});

test("parseCliArgs supports source selection", () => {
  const options = parseCliArgs(["data/sample-aa.csv", "--source", "aa", "--format", "json"]);
  assert.deepEqual(options, {
    csvPaths: ["data/sample-aa.csv"],
    format: "json",
    source: "aa"
  });
});

test("parseCliArgs supports multiple csv inputs", () => {
  const options = parseCliArgs(["data/a.csv", "data/b.csv", "--format", "json"]);
  assert.deepEqual(options, {
    csvPaths: ["data/a.csv", "data/b.csv"],
    format: "json",
    source: "cq"
  });
});

test("readRowsFromCsvFiles combines rows from all files", () => {
  const rows = readRowsFromCsvFiles(["first.csv", "second.csv"], (filePath) => {
    if (filePath === "first.csv") {
      return [{ id: 1 }];
    }

    return [{ id: 2 }, { id: 3 }];
  });

  assert.deepEqual(rows, [{ id: 1 }, { id: 2 }, { id: 3 }]);
});

test("readRowsFromCsvFiles validates required files", () => {
  assert.throws(
    () => readRowsFromCsvFiles([], () => []),
    /At least one CSV file path is required/
  );
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
    /text\|json\|csv\|html/
  );
});

test("renderSummary supports csv output", () => {
  const output = renderSummary(
    {
      totalCalls: 1,
      averageWaitTimeSeconds: 3,
      callsPerQueue: { Sales: 1 }
    },
    "csv"
  );

  assert.match(output, /^Metric,Value/m);
  assert.match(output, /TotalCalls,1/);
  assert.match(output, /CallsPerQueue\.Sales,1/);
});

test("renderSummary supports AA text output", () => {
  const output = renderSummary(
    {
      totalCalls: 2,
      callsPerAutoAttendant: { "Main AA": 2 },
      menuSelections: { Sales: 2 },
      transfersByDestination: { "Sales Queue": 2 }
    },
    "text",
    "aa"
  );

  assert.match(output, /Auto Attendant Summary/);
  assert.match(output, /Main AA: 2/);
});

test("renderSummary supports CQ html output", () => {
  const output = renderSummary(
    {
      totalCalls: 1,
      averageWaitTimeSeconds: 3,
      callsPerQueue: { Sales: 1 }
    },
    "html",
    "cq"
  );

  assert.match(output, /<!doctype html>/i);
  assert.match(output, /AA-CQ Summary/);
});

test("renderSummary supports AA html output", () => {
  const output = renderSummary(
    {
      totalCalls: 1,
      callsPerAutoAttendant: { "Main AA": 1 },
      menuSelections: { Sales: 1 },
      transfersByDestination: { "Sales Queue": 1 }
    },
    "html",
    "aa"
  );

  assert.match(output, /<!doctype html>/i);
  assert.match(output, /Auto Attendant Summary/);
});
