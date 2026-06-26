# SLICE-0014 Native XLSX with Embedded Chart

## Goal

Add a native OpenXML `.xlsx` output path with workbook styling, frozen panes, column widths, and embedded Answered vs Missed charting.

## Acceptance Criteria

- Add `xlsx` CLI format support for CQ and AA sources.
- Generate valid `.xlsx` zip package with worksheet, styles, drawing, and chart parts.
- Include frozen panes and readable column sizing.
- Include embedded chart (`xl/charts/chart1.xml`) linked to worksheet data.
- Keep existing `xls` and `pdf` support intact.
- Add tests for xlsx buffer output and chart part presence.

## Status

Completed on 2026-06-26.
