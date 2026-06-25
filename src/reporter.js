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

function toCsvValue(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function formatSummaryCsv(summary) {
  const rows = [
    ["Metric", "Value"],
    ["TotalCalls", summary.totalCalls],
    ["AverageWaitTimeSeconds", summary.averageWaitTimeSeconds]
  ];

  for (const [queue, calls] of Object.entries(summary.callsPerQueue).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsPerQueue.${queue}`, calls]);
  }

  return rows
    .map((columns) => columns.map(toCsvValue).join(","))
    .join("\n");
}

function formatAutoAttendantSummaryText(summary) {
  const autoAttendantLines = Object.entries(summary.callsPerAutoAttendant)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, calls]) => `- ${name}: ${calls}`)
    .join("\n");
  const menuLines = Object.entries(summary.menuSelections)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([selection, calls]) => `- ${selection}: ${calls}`)
    .join("\n");
  const transferLines = Object.entries(summary.transfersByDestination)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([destination, calls]) => `- ${destination}: ${calls}`)
    .join("\n");

  return [
    "Auto Attendant Summary",
    `Total Calls: ${summary.totalCalls}`,
    "Calls Per Auto Attendant:",
    autoAttendantLines || "- None",
    "Menu Selections:",
    menuLines || "- None",
    "Transfers By Destination:",
    transferLines || "- None"
  ].join("\n");
}

function formatAutoAttendantSummaryJson(summary) {
  return JSON.stringify(summary, null, 2);
}

function formatAutoAttendantSummaryCsv(summary) {
  const rows = [
    ["Metric", "Value"],
    ["TotalCalls", summary.totalCalls]
  ];

  for (const [name, calls] of Object.entries(summary.callsPerAutoAttendant).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsPerAutoAttendant.${name}`, calls]);
  }

  for (const [selection, calls] of Object.entries(summary.menuSelections).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`MenuSelections.${selection}`, calls]);
  }

  for (const [destination, calls] of Object.entries(summary.transfersByDestination).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`TransfersByDestination.${destination}`, calls]);
  }

  return rows
    .map((columns) => columns.map(toCsvValue).join(","))
    .join("\n");
}

module.exports = {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv
};
