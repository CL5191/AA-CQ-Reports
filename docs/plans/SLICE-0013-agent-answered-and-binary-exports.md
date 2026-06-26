# SLICE-0013 Agent Answered Calls + XLS/PDF Exports

## Goal

Add visibility into which agents answered calls for CQ/AA reporting and provide downloadable Excel/PDF report formats.

## Acceptance Criteria

- CQ summary includes `Calls Answered By Agent` metrics.
- AA summary includes `Calls Answered By Agent` metrics when agent fields exist.
- Text/JSON/CSV/HTML outputs include the new agent answered-call section.
- Add native `.xls` and `.pdf` output formats without external runtime dependencies.
- `generate:sample-reports` emits html/json/csv/xls/pdf artifacts for CQ and AA.
- Tests cover agent metrics and binary output generation.

## Status

Completed on 2026-06-26.
