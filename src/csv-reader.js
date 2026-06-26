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
  const resourceAccountIndex = headers.indexOf("Resource Account");
  const totalCallCountIndex = headers.indexOf("Total Call Count");
  const lastActivityDateIndex = headers.indexOf("Last Activity Date");
  const timestampIndex = headers.indexOf("Timestamp");
  const agentNameIndex = headers.indexOf("AgentName") >= 0
    ? headers.indexOf("AgentName")
    : headers.indexOf("AnsweringAgent");
  const isAggregateSchema = resourceAccountIndex >= 0 && totalCallCountIndex >= 0;

  if (!isAggregateSchema && (queueNameIndex < 0 || waitTimeIndex < 0)) {
    throw new Error("CSV is missing required headers: QueueName, WaitTimeSeconds.");
  }

  return lines.slice(1).filter(Boolean).map((line) => {
    const columns = parseCsvLine(line);
    const queueName = isAggregateSchema
      ? (columns[resourceAccountIndex] || "").trim()
      : (columns[queueNameIndex] || "").trim();
    const waitTimeRaw = isAggregateSchema ? "0" : (columns[waitTimeIndex] || "0").trim();
    const callCountRaw = isAggregateSchema ? (columns[totalCallCountIndex] || "1").trim() : "1";
    const waitTimeSeconds = Number.parseInt(waitTimeRaw, 10);
    const callCount = Number.parseInt(callCountRaw, 10);

    return {
      queueName,
      waitTimeSeconds: Number.isFinite(waitTimeSeconds) ? waitTimeSeconds : 0,
      callCount: Number.isFinite(callCount) && callCount > 0 ? callCount : 1,
      timestamp: isAggregateSchema
        ? (lastActivityDateIndex >= 0 ? (columns[lastActivityDateIndex] || "").trim() : "")
        : (timestampIndex >= 0 ? (columns[timestampIndex] || "").trim() : ""),
      agentName: agentNameIndex >= 0 ? ((columns[agentNameIndex] || "").trim() || "Unknown") : "Unknown"
    };
  });
}

function buildSummary(rows) {
  const totalCalls = rows.reduce((sum, row) => {
    const rowCallCount = Number.isFinite(row.callCount) ? row.callCount : 1;
    return sum + rowCallCount;
  }, 0);
  const totalWaitTime = rows.reduce((sum, row) => {
    const rowCallCount = Number.isFinite(row.callCount) ? row.callCount : 1;
    return sum + (row.waitTimeSeconds * rowCallCount);
  }, 0);
  const callsPerQueue = rows.reduce((acc, row) => {
    const key = row.queueName || "Unknown";
    const rowCallCount = Number.isFinite(row.callCount) ? row.callCount : 1;
    acc[key] = (acc[key] || 0) + rowCallCount;
    return acc;
  }, {});
  const callsAnsweredByAgent = rows.reduce((acc, row) => {
    const key = row.agentName && row.agentName !== "Unknown" ? row.agentName : null;
    if (!key) {
      return acc;
    }
    const rowCallCount = Number.isFinite(row.callCount) ? row.callCount : 1;
    acc[key] = (acc[key] || 0) + rowCallCount;
    return acc;
  }, {});
  const callsAnsweredByQueueAndAgent = rows.reduce((acc, row) => {
    const queueKey = row.queueName || "Unknown";
    const agentKey = row.agentName && row.agentName !== "Unknown" ? row.agentName : null;

    if (!agentKey) {
      return acc;
    }

    if (!acc[queueKey]) {
      acc[queueKey] = {};
    }

    const rowCallCount = Number.isFinite(row.callCount) ? row.callCount : 1;
    acc[queueKey][agentKey] = (acc[queueKey][agentKey] || 0) + rowCallCount;
    return acc;
  }, {});

  return {
    totalCalls,
    averageWaitTimeSeconds: totalCalls > 0 ? Math.round(totalWaitTime / totalCalls) : 0,
    callsPerQueue,
    callsAnsweredByAgent,
    callsAnsweredByQueueAndAgent
  };
}

module.exports = {
  readCallQueueCsv,
  buildSummary
};
