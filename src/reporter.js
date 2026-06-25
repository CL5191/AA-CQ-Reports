function formatSummaryText(summary) {
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

function formatSummaryJson(summary) {
  return JSON.stringify(summary, null, 2);
}

module.exports = {
  formatSummaryText,
  formatSummaryJson
};
