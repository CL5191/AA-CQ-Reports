const fs = require("node:fs");
const path = require("node:path");

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function readCallQueueCsv(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("CSV file path is required.");
  }

  const normalizedPath = path.resolve(filePath);
  const csvText = fs.readFileSync(normalizedPath, "utf8").trim();

  if (!csvText) {
    return [];
  }

  const lines = csvText.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  const queueNameIndex = headers.indexOf("QueueName");
  const waitTimeIndex = headers.indexOf("WaitTimeSeconds");
  const timestampIndex = headers.indexOf("Timestamp");
  const agentNameIndex = headers.indexOf("AgentName") >= 0
    ? headers.indexOf("AgentName")
    : headers.indexOf("AnsweringAgent");

  if (queueNameIndex < 0 || waitTimeIndex < 0) {
    throw new Error("CSV is missing required headers: QueueName, WaitTimeSeconds.");
  }

  return lines.slice(1).filter(Boolean).map((line) => {
    const columns = parseCsvLine(line);
    const queueName = (columns[queueNameIndex] || "").trim();
    const waitTimeRaw = (columns[waitTimeIndex] || "0").trim();
    const waitTimeSeconds = Number.parseInt(waitTimeRaw, 10);

    return {
      queueName,
      waitTimeSeconds: Number.isFinite(waitTimeSeconds) ? waitTimeSeconds : 0,
      timestamp: timestampIndex >= 0 ? (columns[timestampIndex] || "").trim() : "",
      agentName: agentNameIndex >= 0 ? ((columns[agentNameIndex] || "").trim() || "Unknown") : "Unknown"
    };
  });
}

function buildSummary(rows) {
  const totalCalls = rows.length;
  const totalWaitTime = rows.reduce((sum, row) => sum + row.waitTimeSeconds, 0);
  const callsPerQueue = rows.reduce((acc, row) => {
    const key = row.queueName || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const callsAnsweredByAgent = rows.reduce((acc, row) => {
    const key = row.agentName || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCalls,
    averageWaitTimeSeconds: totalCalls > 0 ? Math.round(totalWaitTime / totalCalls) : 0,
    callsPerQueue,
    callsAnsweredByAgent
  };
}

module.exports = {
  readCallQueueCsv,
  buildSummary
};
