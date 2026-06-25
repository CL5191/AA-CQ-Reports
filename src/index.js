const { readCallQueueCsv, buildSummary } = require("./csv-reader");
const { readAutoAttendantCsv, buildAutoAttendantSummary } = require("./aa-reader");
const {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv
} = require("./reporter");

function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

function formatSummary(summary) {
  return formatSummaryText(summary);
}

function parseCliArgs(argv) {
  let csvPath = "";
  let format = "text";
  let source = "cq";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--format") {
      format = (argv[i + 1] || "").toLowerCase();
      i += 1;
      continue;
    }

    if (arg === "--source") {
      source = (argv[i + 1] || "").toLowerCase();
      i += 1;
      continue;
    }

    if (!csvPath) {
      csvPath = arg;
    }
  }

  return { csvPath, format, source };
}

function renderSummary(summary, format, source = "cq") {
  if (source === "cq") {
    if (format === "json") {
      return formatSummaryJson(summary);
    }

    if (format === "csv") {
      return formatSummaryCsv(summary);
    }

    if (format === "text") {
      return formatSummaryText(summary);
    }
  }

  if (source === "aa") {
    if (format === "json") {
      return formatAutoAttendantSummaryJson(summary);
    }

    if (format === "csv") {
      return formatAutoAttendantSummaryCsv(summary);
    }

    if (format === "text") {
      return formatAutoAttendantSummaryText(summary);
    }
  }

  throw new Error("Invalid source/format. Use --source cq|aa and --format text|json|csv.");
}

if (require.main === module) {
  const { csvPath, format, source } = parseCliArgs(process.argv.slice(2));

  if (!csvPath) {
    console.error("Usage: npm start <path-to-csv> [--source cq|aa] [--format text|json|csv]");
    process.exitCode = 1;
  } else {
    try {
      if (source === "aa") {
        const rows = readAutoAttendantCsv(csvPath);
        const summary = buildAutoAttendantSummary(rows);
        console.log(renderSummary(summary, format, source));
      } else if (source === "cq") {
        const rows = readCallQueueCsv(csvPath);
        const summary = buildSummary(rows);
        console.log(renderSummary(summary, format, source));
      } else {
        throw new Error("Invalid source. Use --source cq or --source aa.");
      }
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
