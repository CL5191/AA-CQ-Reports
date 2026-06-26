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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rowsToHtmlTable(title, rows) {
  const bodyRows = rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");

  return `<section><h2>${escapeHtml(title)}</h2><table><tbody>${bodyRows}</tbody></table></section>`;
}

function buildHtmlDocument(title, sections) {
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    `<title>${escapeHtml(title)}</title>`,
    "<style>body{font-family:Segoe UI,Tahoma,sans-serif;margin:24px;line-height:1.5}h1{margin-bottom:16px}section{margin-bottom:16px}table{border-collapse:collapse;min-width:420px}th,td{border:1px solid #d0d7de;padding:8px 10px;text-align:left}th{background:#f6f8fa;width:260px}</style>",
    "</head>",
    "<body>",
    `<h1>${escapeHtml(title)}</h1>`,
    sections.join(""),
    "</body>",
    "</html>"
  ].join("\n");
}

function formatSummaryHtml(summary) {
  const queueRows = Object.entries(summary.callsPerQueue)
    .sort(([a], [b]) => a.localeCompare(b));

  const sections = [
    rowsToHtmlTable("Overview", [
      ["Total Calls", summary.totalCalls],
      ["Average Wait Time (seconds)", summary.averageWaitTimeSeconds]
    ]),
    rowsToHtmlTable("Calls Per Queue", queueRows.length > 0 ? queueRows : [["None", 0]])
  ];

  return buildHtmlDocument("AA-CQ Summary", sections);
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

function formatAutoAttendantSummaryHtml(summary) {
  const sections = [
    rowsToHtmlTable("Overview", [["Total Calls", summary.totalCalls]]),
    rowsToHtmlTable(
      "Calls Per Auto Attendant",
      Object.entries(summary.callsPerAutoAttendant).sort(([a], [b]) => a.localeCompare(b))
    ),
    rowsToHtmlTable(
      "Menu Selections",
      Object.entries(summary.menuSelections).sort(([a], [b]) => a.localeCompare(b))
    ),
    rowsToHtmlTable(
      "Transfers By Destination",
      Object.entries(summary.transfersByDestination).sort(([a], [b]) => a.localeCompare(b))
    )
  ];

  return buildHtmlDocument("Auto Attendant Summary", sections);
}

module.exports = {
  formatSummaryText,
  formatSummaryJson,
  formatSummaryCsv,
  formatSummaryHtml,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv,
  formatAutoAttendantSummaryHtml
};
