function formatSummaryText(summary) {
  const queueLines = Object.entries(summary.callsPerQueue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([queue, calls]) => `- ${queue}: ${calls}`)
    .join("\n");
  const agentLines = Object.entries(summary.callsAnsweredByAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([agent, calls]) => `- ${agent}: ${calls}`)
    .join("\n");

  return [
    "AA-CQ Summary",
    `Total Calls: ${summary.totalCalls}`,
    `Average Wait Time (seconds): ${summary.averageWaitTimeSeconds}`,
    "Calls Per Queue:",
    queueLines || "- None",
    "Calls Answered By Agent:",
    agentLines || "- None"
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

  for (const [agent, calls] of Object.entries(summary.callsAnsweredByAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsAnsweredByAgent.${agent}`, calls]);
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
  const agentRows = Object.entries(summary.callsAnsweredByAgent || {})
    .sort(([a], [b]) => a.localeCompare(b));

  const sections = [
    rowsToHtmlTable("Overview", [
      ["Total Calls", summary.totalCalls],
      ["Average Wait Time (seconds)", summary.averageWaitTimeSeconds]
    ]),
    rowsToHtmlTable("Calls Per Queue", queueRows.length > 0 ? queueRows : [["None", 0]]),
    rowsToHtmlTable("Calls Answered By Agent", agentRows.length > 0 ? agentRows : [["None", 0]])
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
  const agentLines = Object.entries(summary.callsAnsweredByAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([agent, calls]) => `- ${agent}: ${calls}`)
    .join("\n");

  return [
    "Auto Attendant Summary",
    `Total Calls: ${summary.totalCalls}`,
    "Calls Per Auto Attendant:",
    autoAttendantLines || "- None",
    "Menu Selections:",
    menuLines || "- None",
    "Transfers By Destination:",
    transferLines || "- None",
    "Calls Answered By Agent:",
    agentLines || "- None"
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

  for (const [agent, calls] of Object.entries(summary.callsAnsweredByAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsAnsweredByAgent.${agent}`, calls]);
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
    ),
    rowsToHtmlTable(
      "Calls Answered By Agent",
      Object.entries(summary.callsAnsweredByAgent || {}).sort(([a], [b]) => a.localeCompare(b))
    )
  ];

  return buildHtmlDocument("Auto Attendant Summary", sections);
}

function toCqMetricRows(summary) {
  const rows = [
    ["TotalCalls", summary.totalCalls],
    ["AverageWaitTimeSeconds", summary.averageWaitTimeSeconds]
  ];

  for (const [queue, calls] of Object.entries(summary.callsPerQueue).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsPerQueue.${queue}`, calls]);
  }

  for (const [agent, calls] of Object.entries(summary.callsAnsweredByAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsAnsweredByAgent.${agent}`, calls]);
  }

  return rows;
}

function toAaMetricRows(summary) {
  const rows = [["TotalCalls", summary.totalCalls]];

  for (const [name, calls] of Object.entries(summary.callsPerAutoAttendant).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsPerAutoAttendant.${name}`, calls]);
  }

  for (const [selection, calls] of Object.entries(summary.menuSelections).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`MenuSelections.${selection}`, calls]);
  }

  for (const [destination, calls] of Object.entries(summary.transfersByDestination).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`TransfersByDestination.${destination}`, calls]);
  }

  for (const [agent, calls] of Object.entries(summary.callsAnsweredByAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    rows.push([`CallsAnsweredByAgent.${agent}`, calls]);
  }

  return rows;
}

function valueType(value) {
  return typeof value === "number" ? "Number" : "String";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXlsWorkbook(title, rows) {
  const xmlRows = [["Metric", "Value"], ...rows]
    .map((columns) => {
      const cells = columns
        .map((column) => `<Cell><Data ss:Type="${valueType(column)}">${escapeXml(column)}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return Buffer.from([
    "<?xml version=\"1.0\"?>",
    "<?mso-application progid=\"Excel.Sheet\"?>",
    "<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">",
    `<Worksheet ss:Name=\"${escapeXml(title).slice(0, 31)}\">`,
    "<Table>",
    xmlRows,
    "</Table>",
    "</Worksheet>",
    "</Workbook>"
  ].join("\n"), "utf8");
}

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(title, rows) {
  const lines = [title, "", ...rows.map(([metric, value]) => `${metric}: ${value}`)];
  const maxLines = 45;
  const visibleLines = lines.slice(0, maxLines);

  const textOps = ["BT", "/F1 10 Tf", "50 760 Td"];
  for (let i = 0; i < visibleLines.length; i += 1) {
    if (i > 0) {
      textOps.push("0 -14 Td");
    }
    textOps.push(`(${escapePdfText(visibleLines[i])}) Tj`);
  }
  textOps.push("ET");
  const stream = textOps.join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`
  ];

  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(output, "utf8"));
    output += object;
  }

  const xrefStart = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    output += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(output, "utf8");
}

function formatSummaryXls(summary) {
  return buildXlsWorkbook("CQ Summary", toCqMetricRows(summary));
}

function formatSummaryPdf(summary) {
  return buildSimplePdf("AA-CQ Summary", toCqMetricRows(summary));
}

function formatAutoAttendantSummaryXls(summary) {
  return buildXlsWorkbook("AA Summary", toAaMetricRows(summary));
}

function formatAutoAttendantSummaryPdf(summary) {
  return buildSimplePdf("Auto Attendant Summary", toAaMetricRows(summary));
}

module.exports = {
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
};
