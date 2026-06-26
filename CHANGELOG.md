# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-06-26

### Added

- CLI output file support (`--out`) with automatic directory creation.
- Timestamp range filtering (`--from`, `--to`) for CQ and AA reports.
- HTML output format for CQ and AA summaries.
- CI sample report artifact publishing for each run.
- CLI hardening for unknown flags, missing option values, and source/file mismatch detection.
- CLI help text support (`--help`, `-h`).
- Agent answered-call rollups for CQ and AA summaries (`Calls Answered By Agent`).
- Native downloadable Excel-compatible `.xls` and `.pdf` report formats.
- Added detailed answered-call breakdowns by AA/CQ and agent pairing.
- Added visual Answered vs Missed charts in HTML report outputs.

### Changed

- Improved empty-data and no-match range error handling.
- Consolidated sample artifact generation into `npm run generate:sample-reports`.
