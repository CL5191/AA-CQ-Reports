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

function readAutoAttendantCsv(filePath) {
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

  const autoAttendantNameIndex = headers.indexOf("AutoAttendantName");
  const menuOptionIndex = headers.indexOf("MenuOption");
  const transferDestinationIndex = headers.indexOf("TransferDestination");
  const timestampIndex = headers.indexOf("Timestamp");

  if (autoAttendantNameIndex < 0 || menuOptionIndex < 0 || transferDestinationIndex < 0) {
    throw new Error("CSV is missing required headers: AutoAttendantName, MenuOption, TransferDestination.");
  }

  return lines.slice(1).filter(Boolean).map((line) => {
    const columns = parseCsvLine(line);

    return {
      autoAttendantName: (columns[autoAttendantNameIndex] || "Unknown").trim() || "Unknown",
      menuOption: (columns[menuOptionIndex] || "Unknown").trim() || "Unknown",
      transferDestination: (columns[transferDestinationIndex] || "Unknown").trim() || "Unknown",
      timestamp: timestampIndex >= 0 ? (columns[timestampIndex] || "").trim() : ""
    };
  });
}

function buildAutoAttendantSummary(rows) {
  const totalCalls = rows.length;
  const callsPerAutoAttendant = {};
  const menuSelections = {};
  const transfersByDestination = {};

  for (const row of rows) {
    callsPerAutoAttendant[row.autoAttendantName] = (callsPerAutoAttendant[row.autoAttendantName] || 0) + 1;
    menuSelections[row.menuOption] = (menuSelections[row.menuOption] || 0) + 1;
    transfersByDestination[row.transferDestination] = (transfersByDestination[row.transferDestination] || 0) + 1;
  }

  return {
    totalCalls,
    callsPerAutoAttendant,
    menuSelections,
    transfersByDestination
  };
}

module.exports = {
  readAutoAttendantCsv,
  buildAutoAttendantSummary
};
