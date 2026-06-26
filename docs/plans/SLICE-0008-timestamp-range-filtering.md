# SLICE-0008 Timestamp Range Filtering

## Goal

Support date/time filtering to constrain report rows to a specific reporting window.

## Acceptance Criteria

- Add CLI flags `--from <timestamp>` and `--to <timestamp>`.
- Apply inclusive filtering to CQ and AA sources before summary aggregation.
- Validate malformed timestamps and invalid range ordering.
- Support date-only (`YYYY-MM-DD`) and full timestamp values.
- Add tests for filter behavior and range validation.

## Status

Completed on 2026-06-26.
