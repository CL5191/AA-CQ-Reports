const { readCallQueueCsv, buildSummary } = require("./csv-reader");
const { formatSummaryText, formatSummaryJson, formatSummaryCsv } = require("./reporter");

function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

function formatSummary(summary) {
  return formatSummaryText(summary);
}

function parseCliArgs(argv) {
  let csvPath = "";
  let format = "text";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--format") {
      format = (argv[i + 1] || "").toLowerCase();
      i += 1;
      continue;
    }

    if (!csvPath) {
      csvPath = arg;
    }
  }

  return { csvPath, format };
}

function renderSummary(summary, format) {
  if (format === "json") {
    return formatSummaryJson(summary);
  }

  if (format === "csv") {
    return formatSummaryCsv(summary);
  }

  if (format === "text") {
    return formatSummaryText(summary);
  }

  throw new Error("Invalid format. Use --format text, json, or csv.");
}

if (require.main === module) {
  const { csvPath, format } = parseCliArgs(process.argv.slice(2));

  if (!csvPath) {
    console.error("Usage: npm start <path-to-call-queue-csv> [--format text|json|csv]");
    process.exitCode = 1;
  } else {
    try {
      const rows = readCallQueueCsv(csvPath);
      const summary = buildSummary(rows);
      console.log(renderSummary(summary, format));
    } catch (error) {
      console.error(`Failed to read CSV: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

module.exports = {
  hello,
  formatSummary,
  parseCliArgs,
  renderSummary
};
