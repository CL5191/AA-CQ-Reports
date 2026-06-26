function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colName(index) {
  let n = index;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function cellRef(colIndex, rowIndex) {
  return `${colName(colIndex)}${rowIndex}`;
}

function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

function crc32(buffer) {
  const table = crc32.table || (crc32.table = buildCrc32Table());
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8");
    const crc = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function rowToXml(rowIndex, cells) {
  const items = cells.map((cell) => {
    const ref = cellRef(cell.col, rowIndex);
    if (typeof cell.value === "number") {
      return `<c r="${ref}" s="${cell.style || 0}"><v>${cell.value}</v></c>`;
    }

    return `<c r="${ref}" t="inlineStr" s="${cell.style || 0}"><is><t>${escapeXml(cell.value)}</t></is></c>`;
  }).join("");

  return `<row r="${rowIndex}">${items}</row>`;
}

function buildStylesXml() {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
    "<fonts count=\"4\">",
    "<font><sz val=\"11\"/><color rgb=\"FF000000\"/><name val=\"Calibri\"/><family val=\"2\"/></font>",
    "<font><b/><sz val=\"18\"/><color rgb=\"FF111827\"/><name val=\"Calibri\"/><family val=\"2\"/></font>",
    "<font><b/><sz val=\"11\"/><color rgb=\"FFFFFFFF\"/><name val=\"Calibri\"/><family val=\"2\"/></font>",
    "<font><b/><sz val=\"11\"/><color rgb=\"FF111827\"/><name val=\"Calibri\"/><family val=\"2\"/></font>",
    "</fonts>",
    "<fills count=\"4\">",
    "<fill><patternFill patternType=\"none\"/></fill>",
    "<fill><patternFill patternType=\"gray125\"/></fill>",
    "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF157FCC\"/><bgColor indexed=\"64\"/></patternFill></fill>",
    "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFEAF0F2\"/><bgColor indexed=\"64\"/></patternFill></fill>",
    "</fills>",
    "<borders count=\"2\">",
    "<border><left/><right/><top/><bottom/><diagonal/></border>",
    "<border><left style=\"thin\"><color rgb=\"FFD1D5DB\"/></left><right style=\"thin\"><color rgb=\"FFD1D5DB\"/></right><top style=\"thin\"><color rgb=\"FFD1D5DB\"/></top><bottom style=\"thin\"><color rgb=\"FFD1D5DB\"/></bottom><diagonal/></border>",
    "</borders>",
    "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
    "<cellXfs count=\"6\">",
    "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>",
    "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/>",
    "<xf numFmtId=\"0\" fontId=\"2\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/>",
    "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyBorder=\"1\"/>",
    "<xf numFmtId=\"0\" fontId=\"3\" fillId=\"3\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/>",
    "<xf numFmtId=\"10\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyBorder=\"1\"/>",
    "</cellXfs>",
    "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>",
    "</styleSheet>"
  ].join("");
}

function buildWorksheetXml(reportTitle, subtitle, entities, chartTitle, hasAnsweredData) {
  const rows = [];
  const lastCol = hasAnsweredData ? "E" : "B";
  rows.push(rowToXml(1, [{ col: 1, value: reportTitle, style: 1 }]));
  rows.push(rowToXml(2, [{ col: 1, value: subtitle, style: 0 }]));
  rows.push(rowToXml(4, [{ col: 1, value: chartTitle, style: 4 }]));

  rows.push(rowToXml(7, hasAnsweredData
    ? [
      { col: 1, value: "Entity", style: 2 },
      { col: 2, value: "Total Calls", style: 2 },
      { col: 3, value: "Answered Calls", style: 2 },
      { col: 4, value: "Missed Calls", style: 2 },
      { col: 5, value: "Answered %", style: 2 }
    ]
    : [
      { col: 1, value: "Entity", style: 2 },
      { col: 2, value: "Total Calls", style: 2 }
    ]));

  entities.forEach((entity, index) => {
    const row = 8 + index;
    if (hasAnsweredData) {
      const pct = entity.totalCalls > 0 ? entity.answeredCalls / entity.totalCalls : 0;
      rows.push(rowToXml(row, [
        { col: 1, value: entity.name, style: 3 },
        { col: 2, value: entity.totalCalls, style: 3 },
        { col: 3, value: entity.answeredCalls, style: 3 },
        { col: 4, value: entity.missedCalls, style: 3 },
        { col: 5, value: pct, style: 5 }
      ]));
      return;
    }

    rows.push(rowToXml(row, [
      { col: 1, value: entity.name, style: 3 },
      { col: 2, value: entity.totalCalls, style: 3 }
    ]));
  });

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
    "<sheetViews><sheetView workbookViewId=\"0\" showGridLines=\"0\"><pane ySplit=\"7\" topLeftCell=\"A8\" activePane=\"bottomLeft\" state=\"frozen\"/></sheetView></sheetViews>",
    hasAnsweredData
      ? "<cols><col min=\"1\" max=\"1\" width=\"34\" customWidth=\"1\"/><col min=\"2\" max=\"5\" width=\"14\" customWidth=\"1\"/></cols>"
      : "<cols><col min=\"1\" max=\"1\" width=\"48\" customWidth=\"1\"/><col min=\"2\" max=\"2\" width=\"14\" customWidth=\"1\"/></cols>",
    "<sheetData>",
    rows.join(""),
    "</sheetData>",
    `<mergeCells count="3"><mergeCell ref="A1:${lastCol}1"/><mergeCell ref="A2:${lastCol}2"/><mergeCell ref="A4:${lastCol}4"/></mergeCells>`,
    "<drawing r:id=\"rId1\"/>",
    "</worksheet>"
  ].join("");
}

function buildChartXml(chartTitle, rowCount, hasAnsweredData) {
  const start = 8;
  const end = start + Math.max(1, rowCount) - 1;

  const seriesXml = hasAnsweredData
    ? [
      "<c:ser><c:idx val=\"0\"/><c:order val=\"0\"/><c:tx><c:v>Answered Calls</c:v></c:tx>",
      `<c:cat><c:strRef><c:f>Sheet1!$A$${start}:$A$${end}</c:f></c:strRef></c:cat>`,
      `<c:val><c:numRef><c:f>Sheet1!$C$${start}:$C$${end}</c:f></c:numRef></c:val></c:ser>`,
      "<c:ser><c:idx val=\"1\"/><c:order val=\"1\"/><c:tx><c:v>Missed Calls</c:v></c:tx>",
      `<c:cat><c:strRef><c:f>Sheet1!$A$${start}:$A$${end}</c:f></c:strRef></c:cat>`,
      `<c:val><c:numRef><c:f>Sheet1!$D$${start}:$D$${end}</c:f></c:numRef></c:val></c:ser>`
    ].join("")
    : [
      "<c:ser><c:idx val=\"0\"/><c:order val=\"0\"/><c:tx><c:v>Total Calls</c:v></c:tx>",
      `<c:cat><c:strRef><c:f>Sheet1!$A$${start}:$A$${end}</c:f></c:strRef></c:cat>`,
      `<c:val><c:numRef><c:f>Sheet1!$B$${start}:$B$${end}</c:f></c:numRef></c:val></c:ser>`
    ].join("");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<c:chartSpace xmlns:c=\"http://schemas.openxmlformats.org/drawingml/2006/chart\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
    "<c:chart>",
    `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang=\"en-US\"/><a:t>${escapeXml(chartTitle)}</a:t></a:r></a:p></c:rich></c:tx></c:title>`,
    "<c:plotArea><c:layout/>",
    "<c:barChart><c:barDir val=\"col\"/><c:grouping val=\"clustered\"/>",
    seriesXml,
    "<c:axId val=\"50010001\"/><c:axId val=\"50010002\"/></c:barChart>",
    "<c:catAx><c:axId val=\"50010001\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:axPos val=\"b\"/><c:tickLblPos val=\"nextTo\"/><c:crossAx val=\"50010002\"/><c:crosses val=\"autoZero\"/></c:catAx>",
    "<c:valAx><c:axId val=\"50010002\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:axPos val=\"l\"/><c:majorGridlines/><c:tickLblPos val=\"nextTo\"/><c:crossAx val=\"50010001\"/><c:crosses val=\"autoZero\"/></c:valAx>",
    "</c:plotArea><c:legend><c:legendPos val=\"r\"/><c:layout/></c:legend><c:plotVisOnly val=\"1\"/></c:chart>",
    "</c:chartSpace>"
  ].join("");
}

function buildDrawingXml() {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:c=\"http://schemas.openxmlformats.org/drawingml/2006/chart\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
    "<xdr:twoCellAnchor>",
    "<xdr:from><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>",
    "<xdr:to><xdr:col>15</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>20</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>",
    "<xdr:graphicFrame macro=\"\"><xdr:nvGraphicFramePr><xdr:cNvPr id=\"2\" name=\"AnsweredMissedChart\"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>",
    "<xdr:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"0\" cy=\"0\"/></xdr:xfrm>",
    "<a:graphic><a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/chart\"><c:chart r:id=\"rId1\"/></a:graphicData></a:graphic>",
    "</xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>"
  ].join("");
}

function entityChartRows(entityTotals, answeredByEntityAndAgent) {
  const answeredDataAvailable = Object.values(answeredByEntityAndAgent || {})
    .some((agentMap) => Object.keys(agentMap || {}).length > 0);

  return Object.entries(entityTotals || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, totalCalls]) => {
      const answeredCalls = Object.values((answeredByEntityAndAgent || {})[name] || {})
        .reduce((sum, calls) => sum + calls, 0);
      const answered = answeredDataAvailable
        ? Math.max(0, Math.min(totalCalls, answeredCalls))
        : totalCalls;
      return {
        name,
        totalCalls,
        answeredCalls: answered,
        missedCalls: answeredDataAvailable ? Math.max(0, totalCalls - answered) : 0,
        answeredDataAvailable
      };
    });
}

function buildXlsxBuffer(options) {
  const hasAnsweredData = options.hasAnsweredData;
  const entities = options.entities.length > 0 ? options.entities : [{ name: "None", totalCalls: 0, answeredCalls: 0, missedCalls: 0 }];

  const entries = [
    {
      name: "[Content_Types].xml",
      data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/><Override PartName=\"/xl/charts/chart1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawingml.chart+xml\"/><Override PartName=\"/xl/drawings/drawing1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawing+xml\"/><Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/><Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/></Types>"
    },
    {
      name: "_rels/.rels",
      data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/></Relationships>"
    },
    { name: "docProps/core.xml", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:title>AA-CQ Report</dc:title><dc:creator>AA-CQ-Reports</dc:creator></cp:coreProperties>" },
    { name: "docProps/app.xml", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"><Application>AA-CQ-Reports</Application></Properties>" },
    { name: "xl/workbook.xml", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><bookViews><workbookView/></bookViews><sheets><sheet name=\"Sheet1\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>" },
    { name: "xl/_rels/workbook.xml.rels", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/></Relationships>" },
    { name: "xl/styles.xml", data: buildStylesXml() },
    { name: "xl/worksheets/sheet1.xml", data: buildWorksheetXml(options.reportTitle, options.subtitle, entities, options.chartTitle, hasAnsweredData) },
    { name: "xl/worksheets/_rels/sheet1.xml.rels", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing\" Target=\"../drawings/drawing1.xml\"/></Relationships>" },
    { name: "xl/drawings/drawing1.xml", data: buildDrawingXml() },
    { name: "xl/drawings/_rels/drawing1.xml.rels", data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart\" Target=\"../charts/chart1.xml\"/></Relationships>" },
    { name: "xl/charts/chart1.xml", data: buildChartXml(options.chartTitle, entities.length, hasAnsweredData) }
  ];

  return toZip(entries);
}

function buildCqXlsx(summary) {
  const entities = entityChartRows(summary.callsPerQueue, summary.callsAnsweredByQueueAndAgent);
  const hasAnsweredData = entities.some((entity) => entity.answeredDataAvailable);
  return buildXlsxBuffer({
    reportTitle: "AA-CQ Weekly Service Report",
    subtitle: "Call Queue View",
    chartTitle: hasAnsweredData
      ? "Answered vs Missed by Queue"
      : "Total Calls by Queue (Answered Breakdown Unavailable)",
    hasAnsweredData,
    entities
  });
}

function buildAaXlsx(summary) {
  const entities = entityChartRows(summary.callsPerAutoAttendant, summary.callsAnsweredByAutoAttendantAndAgent);
  const hasAnsweredData = entities.some((entity) => entity.answeredDataAvailable);
  return buildXlsxBuffer({
    reportTitle: "AA-CQ Weekly Service Report",
    subtitle: "Auto Attendant View",
    chartTitle: hasAnsweredData
      ? "Answered vs Missed by Auto Attendant"
      : "Total Calls by Auto Attendant (Answered Breakdown Unavailable)",
    hasAnsweredData,
    entities
  });
}

module.exports = {
  buildCqXlsx,
  buildAaXlsx
};
