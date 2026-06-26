const test = require("node:test");
const assert = require("node:assert/strict");
const {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatSummaryHtml,
  formatSummaryXls,
  formatSummaryPdf,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv,
  formatAutoAttendantSummaryHtml,
  formatAutoAttendantSummaryXls,
  formatAutoAttendantSummaryPdf
} = require("../src/reporter");

test("formatSummaryText renders human-readable metrics", () => {
  const output = formatSummaryText({
    totalCalls: 4,
    averageWaitTimeSeconds: 11,
    callsPerQueue: {
      Support: 3,
      Sales: 1
    },
    callsAnsweredByAgent: {
      Alice: 2,
      Bob: 2
    }
  });

  assert.match(output, /AA-CQ Summary/);
  assert.match(output, /Total Calls: 4/);
  assert.match(output, /Average Wait Time \(seconds\): 11/);
  assert.match(output, /- Sales: 1/);
  assert.match(output, /- Support: 3/);
  assert.match(output, /Calls Answered By Agent:/);
  assert.match(output, /- Alice: 2/);
});

test("formatSummaryJson renders the summary object as JSON", () => {
  const summary = {
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: {
      Sales: 2
    },
    callsAnsweredByAgent: {
      Alice: 2
    }
  };

  const output = formatSummaryJson(summary);
  assert.deepEqual(JSON.parse(output), summary);
});

test("formatSummaryCsv renders summary rows as CSV", () => {
  const output = formatSummaryCsv({
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: {
      Support: 1,
      Sales: 1
    },
    callsAnsweredByAgent: {
      Alice: 1,
      Bob: 1
    }
  });

  const lines = output.split("\n");
  assert.equal(lines[0], "Metric,Value");
  assert.equal(lines[1], "TotalCalls,2");
  assert.equal(lines[2], "AverageWaitTimeSeconds,15");
  assert.equal(lines[3], "CallsPerQueue.Sales,1");
  assert.equal(lines[4], "CallsPerQueue.Support,1");
  assert.equal(lines[5], "CallsAnsweredByAgent.Alice,1");
  assert.equal(lines[6], "CallsAnsweredByAgent.Bob,1");
});

test("formatAutoAttendantSummaryText renders AA-specific metrics", () => {
  const output = formatAutoAttendantSummaryText({
    totalCalls: 3,
    callsPerAutoAttendant: {
      "Main AA": 2,
      "After Hours AA": 1
    },
    menuSelections: {
      Support: 2,
      Operator: 1
    },
    transfersByDestination: {
      "Support Queue": 2,
      "Operator Line": 1
    },
    callsAnsweredByAgent: {
      Alice: 2,
      Bob: 1
    }
  });

  assert.match(output, /Auto Attendant Summary/);
  assert.match(output, /Total Calls: 3/);
  assert.match(output, /- Main AA: 2/);
  assert.match(output, /- Operator: 1/);
  assert.match(output, /- Support Queue: 2/);
  assert.match(output, /Calls Answered By Agent:/);
  assert.match(output, /- Alice: 2/);
});

test("formatAutoAttendantSummaryJson renders AA summary object as JSON", () => {
  const summary = {
    totalCalls: 2,
    callsPerAutoAttendant: { "Main AA": 2 },
    menuSelections: { Sales: 2 },
    transfersByDestination: { "Sales Queue": 2 },
    callsAnsweredByAgent: { Alice: 2 }
  };

  const output = formatAutoAttendantSummaryJson(summary);
  assert.deepEqual(JSON.parse(output), summary);
});

test("formatAutoAttendantSummaryCsv renders AA summary rows as CSV", () => {
  const output = formatAutoAttendantSummaryCsv({
    totalCalls: 2,
    callsPerAutoAttendant: { "Main AA": 2 },
    menuSelections: { Sales: 2 },
    transfersByDestination: { "Sales Queue": 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  const lines = output.split("\n");
  assert.equal(lines[0], "Metric,Value");
  assert.equal(lines[1], "TotalCalls,2");
  assert.equal(lines[2], "CallsPerAutoAttendant.Main AA,2");
  assert.equal(lines[3], "MenuSelections.Sales,2");
  assert.equal(lines[4], "TransfersByDestination.Sales Queue,2");
  assert.equal(lines[5], "CallsAnsweredByAgent.Alice,2");
});

test("formatSummaryHtml renders HTML for CQ summary", () => {
  const output = formatSummaryHtml({
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: {
      Sales: 1,
      Support: 1
    },
    callsAnsweredByAgent: {
      Alice: 1,
      Bob: 1
    }
  });

  assert.match(output, /<!doctype html>/i);
  assert.match(output, /<h1>AA-CQ Summary<\/h1>/);
  assert.match(output, /Average Wait Time \(seconds\)/);
  assert.match(output, /Sales/);
  assert.match(output, /Calls Answered By Agent/);
});

test("formatAutoAttendantSummaryHtml renders HTML for AA summary", () => {
  const output = formatAutoAttendantSummaryHtml({
    totalCalls: 2,
    callsPerAutoAttendant: { "Main AA": 2 },
    menuSelections: { Sales: 2 },
    transfersByDestination: { "Sales Queue": 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  assert.match(output, /<!doctype html>/i);
  assert.match(output, /<h1>Auto Attendant Summary<\/h1>/);
  assert.match(output, /Calls Per Auto Attendant/);
  assert.match(output, /Sales Queue/);
  assert.match(output, /Calls Answered By Agent/);
});

test("formatSummaryXls renders excel workbook xml", () => {
  const output = formatSummaryXls({
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: { Sales: 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  const text = output.toString("utf8");
  assert.match(text, /<Workbook/);
  assert.match(text, /CallsAnsweredByAgent\.Alice/);
});

test("formatSummaryPdf renders pdf bytes", () => {
  const output = formatSummaryPdf({
    totalCalls: 2,
    averageWaitTimeSeconds: 15,
    callsPerQueue: { Sales: 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  assert.equal(output.subarray(0, 4).toString("utf8"), "%PDF");
});

test("formatAutoAttendantSummaryXls renders excel workbook xml", () => {
  const output = formatAutoAttendantSummaryXls({
    totalCalls: 2,
    callsPerAutoAttendant: { "Main AA": 2 },
    menuSelections: { Sales: 2 },
    transfersByDestination: { "Sales Queue": 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  const text = output.toString("utf8");
  assert.match(text, /<Workbook/);
  assert.match(text, /CallsAnsweredByAgent\.Alice/);
});

test("formatAutoAttendantSummaryPdf renders pdf bytes", () => {
  const output = formatAutoAttendantSummaryPdf({
    totalCalls: 2,
    callsPerAutoAttendant: { "Main AA": 2 },
    menuSelections: { Sales: 2 },
    transfersByDestination: { "Sales Queue": 2 },
    callsAnsweredByAgent: { Alice: 2 }
  });

  assert.equal(output.subarray(0, 4).toString("utf8"), "%PDF");
});
