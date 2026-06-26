# SLICE-0010 Input Validation Hardening

## Goal

Strengthen CLI and runtime validation to make failures explicit and actionable for operators.

## Acceptance Criteria

- Reject unknown CLI options.
- Reject missing values for known options.
- Validate allowed values for `--source` and `--format` before execution.
- Detect source/file mismatch and provide corrective guidance.
- Return explicit errors for empty data sets and range filters that match no rows.
- Return explicit errors for malformed row timestamps when filtering is enabled.
- Add tests for malformed timestamps, empty files, and mixed-source mistakes.

## Status

Completed on 2026-06-26.
