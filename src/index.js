const { readCallQueueCsv, buildSummary } = require("./csv-reader");

function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

function formatSummary(summary) {
  const queueLines = Object.entries(summary.callsPerQueue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([queue, calls]) => `- ${queue}: ${calls}`)
    .join("\n");

  return [
    "AA-CQ Summary",
    `Total Calls: ${summary.totalCalls}`,
    `Average Wait Time (seconds): ${summary.averageWaitTimeSeconds}`,
    "Calls Per Queue:",
    queueLines || "- None"
  ].join("\n");
}

if (require.main === module) {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error("Usage: npm start <path-to-call-queue-csv>");
    process.exitCode = 1;
  } else {
    try {
      const rows = readCallQueueCsv(csvPath);
      const summary = buildSummary(rows);
      console.log(formatSummary(summary));
    } catch (error) {
      console.error(`Failed to read CSV: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

module.exports = {
  hello,
  formatSummary
};
