const { buildCqXlsx, buildAaXlsx } = require("./xlsx-writer");

function formatSummaryText(summary) {
  const queueLines = Object.entries(summary.callsPerQueue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([queue, calls]) => `- ${queue}: ${calls}`)
    .join("\n");
  const agentLines = Object.entries(summary.callsAnsweredByAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([agent, calls]) => `- ${agent}: ${calls}`)
    .join("\n");
  const queueAgentLines = Object.entries(summary.callsAnsweredByQueueAndAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([queue, agents]) => Object.entries(agents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agent, calls]) => `- ${queue} -> ${agent}: ${calls}`))
    .join("\n");

  return [
    "AA-CQ Summary",
    `Total Calls: ${summary.totalCalls}`,
    `Average Wait Time (seconds): ${summary.averageWaitTimeSeconds}`,
    "Calls Per Queue:",
    queueLines || "- None",
    "Calls Answered By Agent:",
    agentLines || "- None",
    "Calls Answered By Queue And Agent:",
    queueAgentLines || "- None"
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

  for (const [queue, agents] of Object.entries(summary.callsAnsweredByQueueAndAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [agent, calls] of Object.entries(agents).sort(([a], [b]) => a.localeCompare(b))) {
      rows.push([`CallsAnsweredByQueueAndAgent.${queue}.${agent}`, calls]);
    }
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

function buildAnsweredMissedRows(entityTotals, answeredByEntityAndAgent) {
  return Object.entries(entityTotals || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([entity, totalCalls]) => {
      const answeredCalls = Object.values((answeredByEntityAndAgent || {})[entity] || {})
        .reduce((sum, calls) => sum + calls, 0);
      const clampedAnswered = Math.max(0, Math.min(totalCalls, answeredCalls));
      return {
        entity,
        totalCalls,
        answeredCalls: clampedAnswered,
        missedCalls: Math.max(0, totalCalls - clampedAnswered)
      };
    });
}

function buildAnsweredMissedChartSection(title, rows) {
  if (!rows || rows.length === 0) {
    return `<section><h2>${escapeHtml(title)}</h2><p>No chart data available.</p></section>`;
  }

  const chartRows = rows.slice(0, 12);
  const width = 980;
  const marginLeft = 240;
  const marginRight = 30;
  const barAreaWidth = width - marginLeft - marginRight;
  const barHeight = 20;
  const rowGap = 34;
  const topPadding = 56;
  const height = topPadding + chartRows.length * rowGap + 34;
  const maxCalls = Math.max(1, ...chartRows.map((row) => row.totalCalls));

  const bars = chartRows.map((row, index) => {
    const y = topPadding + index * rowGap;
    const answeredWidth = Math.round((row.answeredCalls / maxCalls) * barAreaWidth);
    const missedWidth = Math.round((row.missedCalls / maxCalls) * barAreaWidth);
    const label = `${row.entity} (${row.answeredCalls}/${row.totalCalls})`;

    return [
      `<text x="12" y="${y + 14}" font-size="12" fill="#1f2937">${escapeHtml(label)}</text>`,
      `<rect x="${marginLeft}" y="${y}" width="${answeredWidth}" height="${barHeight}" fill="#157FCC" rx="3" ry="3"></rect>`,
      `<rect x="${marginLeft + answeredWidth}" y="${y}" width="${missedWidth}" height="${barHeight}" fill="#9CA3AF" rx="3" ry="3"></rect>`
    ].join("");
  }).join("");

  const ticks = [0, 0.25, 0.5, 0.75, 1]
    .map((pct) => {
      const x = marginLeft + Math.round(pct * barAreaWidth);
      const value = Math.round(pct * maxCalls);
      return [
        `<line x1="${x}" y1="42" x2="${x}" y2="${height - 20}" stroke="#E5E7EB" stroke-width="1"></line>`,
        `<text x="${x}" y="34" text-anchor="middle" font-size="11" fill="#6b7280">${value}</text>`
      ].join("");
    })
    .join("");

  const svg = [
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} chart">`,
    `<text x="12" y="22" font-size="13" fill="#111827">Answered vs Missed Calls</text>`,
    `<rect x="${marginLeft}" y="10" width="12" height="12" fill="#157FCC"></rect>`,
    `<text x="${marginLeft + 18}" y="20" font-size="11" fill="#374151">Answered</text>`,
    `<rect x="${marginLeft + 96}" y="10" width="12" height="12" fill="#9CA3AF"></rect>`,
    `<text x="${marginLeft + 114}" y="20" font-size="11" fill="#374151">Missed</text>`,
    ticks,
    bars,
    "</svg>"
  ].join("");

  return `<section><h2>${escapeHtml(title)}</h2><div style="overflow:auto;border:1px solid #d1d5db;border-radius:8px;padding:10px;background:#ffffff">${svg}</div></section>`;
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
  const queueAgentRows = Object.entries(summary.callsAnsweredByQueueAndAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([queue, agents]) => Object.entries(agents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agent, calls]) => [`${queue} -> ${agent}`, calls]));

  const sections = [
    buildAnsweredMissedChartSection(
      "Queue Performance Chart",
      buildAnsweredMissedRows(summary.callsPerQueue, summary.callsAnsweredByQueueAndAgent)
    ),
    rowsToHtmlTable("Overview", [
      ["Total Calls", summary.totalCalls],
      ["Average Wait Time (seconds)", summary.averageWaitTimeSeconds]
    ]),
    rowsToHtmlTable("Calls Per Queue", queueRows.length > 0 ? queueRows : [["None", 0]]),
    rowsToHtmlTable("Calls Answered By Agent", agentRows.length > 0 ? agentRows : [["None", 0]]),
    rowsToHtmlTable("Calls Answered By Queue And Agent", queueAgentRows.length > 0 ? queueAgentRows : [["None", 0]])
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
  const aaAgentLines = Object.entries(summary.callsAnsweredByAutoAttendantAndAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([autoAttendant, agents]) => Object.entries(agents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agent, calls]) => `- ${autoAttendant} -> ${agent}: ${calls}`))
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
    agentLines || "- None",
    "Calls Answered By Auto Attendant And Agent:",
    aaAgentLines || "- None"
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

  for (const [autoAttendant, agents] of Object.entries(summary.callsAnsweredByAutoAttendantAndAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [agent, calls] of Object.entries(agents).sort(([a], [b]) => a.localeCompare(b))) {
      rows.push([`CallsAnsweredByAutoAttendantAndAgent.${autoAttendant}.${agent}`, calls]);
    }
  }

  return rows
    .map((columns) => columns.map(toCsvValue).join(","))
    .join("\n");
}

function formatAutoAttendantSummaryHtml(summary) {
  const aaAgentRows = Object.entries(summary.callsAnsweredByAutoAttendantAndAgent || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([autoAttendant, agents]) => Object.entries(agents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([agent, calls]) => [`${autoAttendant} -> ${agent}`, calls]));

  const sections = [
    buildAnsweredMissedChartSection(
      "Auto Attendant Performance Chart",
      buildAnsweredMissedRows(summary.callsPerAutoAttendant, summary.callsAnsweredByAutoAttendantAndAgent)
    ),
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
    ),
    rowsToHtmlTable(
      "Calls Answered By Auto Attendant And Agent",
      aaAgentRows.length > 0 ? aaAgentRows : [["None", 0]]
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

  for (const [queue, agents] of Object.entries(summary.callsAnsweredByQueueAndAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [agent, calls] of Object.entries(agents).sort(([a], [b]) => a.localeCompare(b))) {
      rows.push([`CallsAnsweredByQueueAndAgent.${queue}.${agent}`, calls]);
    }
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

  for (const [autoAttendant, agents] of Object.entries(summary.callsAnsweredByAutoAttendantAndAgent || {}).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [agent, calls] of Object.entries(agents).sort(([a], [b]) => a.localeCompare(b))) {
      rows.push([`CallsAnsweredByAutoAttendantAndAgent.${autoAttendant}.${agent}`, calls]);
    }
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

function formatSummaryXlsx(summary) {
  return buildCqXlsx(summary);
}

function formatSummaryPdf(summary) {
  return buildSimplePdf("AA-CQ Summary", toCqMetricRows(summary));
}

function formatAutoAttendantSummaryXls(summary) {
  return buildXlsWorkbook("AA Summary", toAaMetricRows(summary));
}

function formatAutoAttendantSummaryXlsx(summary) {
  return buildAaXlsx(summary);
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
  formatSummaryXlsx,
  formatSummaryPdf,
  formatAutoAttendantSummaryText,
  formatAutoAttendantSummaryJson,
  formatAutoAttendantSummaryCsv,
  formatAutoAttendantSummaryHtml,
  formatAutoAttendantSummaryXls,
  formatAutoAttendantSummaryXlsx,
  formatAutoAttendantSummaryPdf
};
