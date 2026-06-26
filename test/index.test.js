const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  hello,
  formatSummary,
  parseCliArgs,
  renderSummary,
  readRowsFromCsvFiles,
  filterRowsByTimestamp,
  writeOutput
} = require("../src/index");

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
    source: "cq",
    outFilePath: null,
    from: null,
    to: null
  });
});

test("parseCliArgs supports csv output format", () => {
  const options = parseCliArgs(["data/sample-cq.csv", "--format", "csv"]);
  assert.deepEqual(options, {
    csvPaths: ["data/sample-cq.csv"],
    format: "csv",
    source: "cq",
    outFilePath: null,
    from: null,
    to: null
  });
});

test("parseCliArgs supports source selection", () => {
  const options = parseCliArgs(["data/sample-aa.csv", "--source", "aa", "--format", "json"]);
  assert.deepEqual(options, {
    csvPaths: ["data/sample-aa.csv"],
    format: "json",
    source: "aa",
    outFilePath: null,
    from: null,
    to: null
  });
});

test("parseCliArgs supports multiple csv inputs", () => {
  const options = parseCliArgs(["data/a.csv", "data/b.csv", "--format", "json"]);
  assert.deepEqual(options, {
    csvPaths: ["data/a.csv", "data/b.csv"],
    format: "json",
    source: "cq",
    outFilePath: null,
    from: null,
    to: null
  });
});

test("parseCliArgs supports output and timestamp filters", () => {
  const options = parseCliArgs([
    "data/sample-cq.csv",
    "--from",
    "2026-06-20T10:00:00Z",
    "--to",
    "2026-06-20T10:03:00Z",
    "--out",
    "reports/daily.html"
  ]);

  assert.deepEqual(options, {
    csvPaths: ["data/sample-cq.csv"],
    format: "text",
    source: "cq",
    outFilePath: "reports/daily.html",
    from: "2026-06-20T10:00:00Z",
    to: "2026-06-20T10:03:00Z"
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

test("filterRowsByTimestamp returns all rows when no range is provided", () => {
  const rows = [{ timestamp: "2026-06-20T10:00:00Z" }];
  assert.deepEqual(filterRowsByTimestamp(rows, null, null), rows);
});

test("filterRowsByTimestamp applies inclusive time range", () => {
  const rows = [
    { id: 1, timestamp: "2026-06-20T10:00:00Z" },
    { id: 2, timestamp: "2026-06-20T10:02:00Z" },
    { id: 3, timestamp: "2026-06-20T10:05:00Z" }
  ];

  const filtered = filterRowsByTimestamp(rows, "2026-06-20T10:00:00Z", "2026-06-20T10:02:00Z");
  assert.deepEqual(filtered.map((row) => row.id), [1, 2]);
});

test("filterRowsByTimestamp validates range ordering", () => {
  assert.throws(
    () => filterRowsByTimestamp([], "2026-06-20T10:03:00Z", "2026-06-20T10:01:00Z"),
    /--from must be earlier than or equal to --to/
  );
});

test("writeOutput writes report to nested path", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-cq-output-"));

  try {
    const outputPath = path.join(tempDir, "reports", "report.txt");
    const resolvedPath = writeOutput("hello", outputPath);

    assert.equal(fs.readFileSync(resolvedPath, "utf8"), "hello");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
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
