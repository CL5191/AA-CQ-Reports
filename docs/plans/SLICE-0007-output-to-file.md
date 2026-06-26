# SLICE-0007 Output To File

## Goal

Allow report output to be written to disk so stakeholders can consume generated artifacts directly.

## Acceptance Criteria

- Add CLI flag `--out <path>`.
- Write rendered report content to the provided path.
- Create parent directories when missing.
- Keep stdout rendering behavior when `--out` is not supplied.
- Add/extend tests for argument parsing and file writing behavior.

## Status

Completed on 2026-06-26.
