const fs = require("node:fs");
const path = require("node:path");
const { readCallQueueCsv, buildSummary } = require("./csv-reader");
const { readAutoAttendantCsv, buildAutoAttendantSummary } = require("./aa-reader");
const {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatSummaryHtml,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv,
  formatAutoAttendantSummaryHtml
} = require("./reporter");

function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

function formatSummary(summary) {
  return formatSummaryText(summary);
}

function parseCliArgs(argv) {
  const csvPaths = [];
  let format = "text";
  let source = "cq";
  let outFilePath = null;
  let from = null;
  let to = null;

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

    if (arg === "--out") {
      outFilePath = argv[i + 1] || null;
      i += 1;
      continue;
    }

    if (arg === "--from") {
      from = argv[i + 1] || null;
      i += 1;
      continue;
    }

    if (arg === "--to") {
      to = argv[i + 1] || null;
      i += 1;
      continue;
    }

    csvPaths.push(arg);
  }

  return { csvPaths, format, source, outFilePath, from, to };
}

function parseDateBoundary(value, label, endOfDay = false) {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  let parsed;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    parsed = endOfDay
      ? new Date(`${trimmed}T23:59:59.999Z`)
      : new Date(`${trimmed}T00:00:00.000Z`);
  } else {
    parsed = new Date(trimmed);
  }

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} timestamp: ${value}`);
  }

  return parsed;
}

function filterRowsByTimestamp(rows, from, to) {
  const fromDate = parseDateBoundary(from, "--from");
  const toDate = parseDateBoundary(to, "--to", true);

  if (!fromDate && !toDate) {
    return rows;
  }

  if (fromDate && toDate && fromDate > toDate) {
    throw new Error("--from must be earlier than or equal to --to.");
  }

  return rows.filter((row) => {
    if (!row.timestamp) {
      return false;
    }

    const timestamp = new Date(row.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      return false;
    }

    if (fromDate && timestamp < fromDate) {
      return false;
    }

    if (toDate && timestamp > toDate) {
      return false;
    }

    return true;
  });
}

function writeOutput(output, outFilePath) {
  const resolvedPath = path.resolve(outFilePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, output, "utf8");
  return resolvedPath;
}

function readRowsFromCsvFiles(filePaths, readRowsFn) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error("At least one CSV file path is required.");
  }

  const allRows = [];
  for (const filePath of filePaths) {
    const rows = readRowsFn(filePath);
    allRows.push(...rows);
  }

  return allRows;
}

function renderSummary(summary, format, source = "cq") {
  if (source === "cq") {
    if (format === "json") {
      return formatSummaryJson(summary);
    }

    if (format === "csv") {
      return formatSummaryCsv(summary);
    }

    if (format === "html") {
      return formatSummaryHtml(summary);
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

    if (format === "html") {
      return formatAutoAttendantSummaryHtml(summary);
    }

    if (format === "text") {
      return formatAutoAttendantSummaryText(summary);
    }
  }

  throw new Error("Invalid source/format. Use --source cq|aa and --format text|json|csv|html.");
}

if (require.main === module) {
  const { csvPaths, format, source, outFilePath, from, to } = parseCliArgs(process.argv.slice(2));

  if (csvPaths.length === 0) {
    console.error("Usage: npm start <path-to-csv> [additional-csv-paths...] [--source cq|aa] [--format text|json|csv|html]");
    process.exitCode = 1;
  } else {
    try {
      let output;

      if (source === "aa") {
        const rows = filterRowsByTimestamp(readRowsFromCsvFiles(csvPaths, readAutoAttendantCsv), from, to);
        const summary = buildAutoAttendantSummary(rows);
        output = renderSummary(summary, format, source);
      } else if (source === "cq") {
        const rows = filterRowsByTimestamp(readRowsFromCsvFiles(csvPaths, readCallQueueCsv), from, to);
        const summary = buildSummary(rows);
        output = renderSummary(summary, format, source);
      } else {
        throw new Error("Invalid source. Use --source cq or --source aa.");
      }

      if (outFilePath) {
        const resolvedPath = writeOutput(output, outFilePath);
        console.log(`Report written to ${resolvedPath}`);
      } else {
        console.log(output);
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
  renderSummary,
  readRowsFromCsvFiles,
  filterRowsByTimestamp,
  writeOutput
};
