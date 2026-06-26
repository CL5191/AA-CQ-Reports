const fs = require("node:fs");
const path = require("node:path");
const { readCallQueueCsv, buildSummary } = require("./csv-reader");
const { readAutoAttendantCsv, buildAutoAttendantSummary } = require("./aa-reader");
const {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatSummaryHtml,
  formatSummaryXls,
  formatSummaryXlsx,
  formatSummaryPdf,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv,
  formatAutoAttendantSummaryHtml,
  formatAutoAttendantSummaryXls,
  formatAutoAttendantSummaryXlsx,
  formatAutoAttendantSummaryPdf
} = require("./reporter");

function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

function formatSummary(summary) {
  return formatSummaryText(summary);
}

const VALID_FORMATS = new Set(["text", "json", "csv", "html", "xls", "xlsx", "pdf"]);
const VALID_SOURCES = new Set(["cq", "aa"]);

function getUsageText() {
  return [
    "Usage: npm start -- <path-to-csv> [additional-csv-paths...] [options]",
    "",
    "Options:",
    "  --source cq|aa               Data source type (default: cq)",
    "  --format text|json|csv|html|xls|xlsx|pdf  Output format (default: text)",
    "  --out <path>                 Write report output to file",
    "  --from <timestamp>           Include rows on/after timestamp",
    "  --to <timestamp>             Include rows on/before timestamp",
    "  --help, -h                   Show this help message"
  ].join("\n");
}

function readOptionValue(argv, i, optionName) {
  const value = argv[i + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}.`);
  }

  return value;
}

function parseCliArgs(argv) {
  const csvPaths = [];
  let format = "text";
  let source = "cq";
  let outFilePath = null;
  let from = null;
  let to = null;
  let showHelp = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--format") {
      format = readOptionValue(argv, i, "--format").toLowerCase();
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      continue;
    }

    if (arg === "--source") {
      source = readOptionValue(argv, i, "--source").toLowerCase();
      i += 1;
      continue;
    }

    if (arg === "--out") {
      outFilePath = readOptionValue(argv, i, "--out");
      i += 1;
      continue;
    }

    if (arg === "--from") {
      from = readOptionValue(argv, i, "--from");
      i += 1;
      continue;
    }

    if (arg === "--to") {
      to = readOptionValue(argv, i, "--to");
      i += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    csvPaths.push(arg);
  }

  if (!VALID_FORMATS.has(format)) {
    throw new Error(`Invalid format: ${format}. Use --format text|json|csv|html|xls|xlsx|pdf.`);
  }

  if (!VALID_SOURCES.has(source)) {
    throw new Error(`Invalid source: ${source}. Use --source cq|aa.`);
  }

  return { csvPaths, format, source, outFilePath, from, to, showHelp };
}

function detectSourceFromHeaders(headers) {
  const headerSet = new Set(headers.map((header) => header.trim()));
  const isCq = headerSet.has("QueueName") && headerSet.has("WaitTimeSeconds");
  const isAa = headerSet.has("AutoAttendantName") && headerSet.has("MenuOption") && headerSet.has("TransferDestination");

  if (isCq) {
    return "cq";
  }

  if (isAa) {
    return "aa";
  }

  return null;
}

function validateSourceForFiles(filePaths, source) {
  for (const filePath of filePaths) {
    const normalizedPath = path.resolve(filePath);
    const csvText = fs.readFileSync(normalizedPath, "utf8");
    const [headerLine = ""] = csvText.split(/\r?\n/, 1);
    const headers = headerLine.split(",").map((header) => header.trim()).filter(Boolean);
    const detectedSource = detectSourceFromHeaders(headers);

    if (detectedSource && detectedSource !== source) {
      throw new Error(`Input source mismatch for ${filePath}. Use --source ${detectedSource}.`);
    }
  }
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
      throw new Error("Timestamp column with valid values is required when using --from/--to.");
    }

    const timestamp = new Date(row.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(`Invalid row timestamp value: ${row.timestamp}`);
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

function validateRows(rows, from, to) {
  if (rows.length > 0) {
    return;
  }

  if (from || to) {
    throw new Error("No rows matched the provided --from/--to range.");
  }

  throw new Error("No data rows found in the provided CSV input.");
}

function writeOutput(output, outFilePath) {
  const resolvedPath = path.resolve(outFilePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  if (Buffer.isBuffer(output)) {
    fs.writeFileSync(resolvedPath, output);
  } else {
    fs.writeFileSync(resolvedPath, output, "utf8");
  }
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
  if ((format === "xls" || format === "xlsx" || format === "pdf") && source && typeof source === "string") {
    // Binary formats should generally be written to disk via --out.
  }

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

    if (format === "xls") {
      return formatSummaryXls(summary);
    }

    if (format === "xlsx") {
      return formatSummaryXlsx(summary);
    }

    if (format === "pdf") {
      return formatSummaryPdf(summary);
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

    if (format === "xls") {
      return formatAutoAttendantSummaryXls(summary);
    }

    if (format === "xlsx") {
      return formatAutoAttendantSummaryXlsx(summary);
    }

    if (format === "pdf") {
      return formatAutoAttendantSummaryPdf(summary);
    }

    if (format === "text") {
      return formatAutoAttendantSummaryText(summary);
    }
  }

  throw new Error("Invalid source/format. Use --source cq|aa and --format text|json|csv|html|xls|xlsx|pdf.");
}

if (require.main === module) {
  const { csvPaths, format, source, outFilePath, from, to, showHelp } = parseCliArgs(process.argv.slice(2));

  if (showHelp) {
    console.log(getUsageText());
    process.exitCode = 0;
  } else if (csvPaths.length === 0) {
    console.error(getUsageText());
    process.exitCode = 1;
  } else {
    try {
      let output;
      validateSourceForFiles(csvPaths, source);

      if (source === "aa") {
        const rows = filterRowsByTimestamp(readRowsFromCsvFiles(csvPaths, readAutoAttendantCsv), from, to);
        validateRows(rows, from, to);
        const summary = buildAutoAttendantSummary(rows);
        output = renderSummary(summary, format, source);
      } else if (source === "cq") {
        const rows = filterRowsByTimestamp(readRowsFromCsvFiles(csvPaths, readCallQueueCsv), from, to);
        validateRows(rows, from, to);
        const summary = buildSummary(rows);
        output = renderSummary(summary, format, source);
      } else {
        throw new Error("Invalid source. Use --source cq or --source aa.");
      }

      if (outFilePath) {
        const resolvedPath = writeOutput(output, outFilePath);
        console.log(`Report written to ${resolvedPath}`);
      } else {
        if (Buffer.isBuffer(output)) {
          throw new Error("Binary formats xls/xlsx/pdf require --out <path>.");
        }
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
  getUsageText,
  parseCliArgs,
  renderSummary,
  readRowsFromCsvFiles,
  filterRowsByTimestamp,
  writeOutput,
  validateSourceForFiles,
  validateRows
};
