# AA-CQ-Reports

Comprehensive reporting solution for Teams AA-CQ, enabling efficient data analysis and visualization for stakeholders.

## Dev Loop

This repository follows:

Plan -> Prompt -> Build -> Review -> Memory -> repeat.

Start with `/plan` and build one small shippable slice at a time.

## Quick Start

Prerequisites:

- Node.js 20+

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Example usage:

```bash
# CQ summary in text
npm start -- data/sample-cq.csv --source cq --format text

# Show CLI help
npm start -- --help

# AA summary in HTML written to file
npm start -- data/sample-aa.csv --source aa --format html --out reports/aa-summary.html

# CQ summary in PDF
npm start -- data/sample-cq.csv --source cq --format pdf --out reports/cq-summary.pdf

# AA summary in Excel-compatible XLS
npm start -- data/sample-aa.csv --source aa --format xls --out reports/aa-summary.xls

# CQ summary for a date/time range (inclusive)
npm start -- data/sample-cq.csv --source cq --format json --from 2026-06-20T10:00:00Z --to 2026-06-20T10:03:00Z
```

CLI options:

- `--source cq|aa` selects call queue or auto attendant input semantics.
- `--format text|json|csv|html|xls|pdf` controls output format.
- `--out <path>` writes the rendered report to a file (directories are created automatically).
- `--from <timestamp>` includes rows on/after the timestamp.
- `--to <timestamp>` includes rows on/before the timestamp.
- `--help` or `-h` prints usage guidance.

Run checks:

```bash
npm run lint
npm test
npm run build
```

Generate sample reports locally:

```bash
npm run generate:sample-reports
```

## Release Checklist

- Run `npm run lint`, `npm test`, and `npm run build`.
- Run `npm run generate:sample-reports` and verify `reports/` contents.
- Update `CHANGELOG.md` with release notes.
- Bump version in `package.json`.
- Push to `main` and confirm CI artifact upload.

## CI Artifacts

The CI workflow now generates sample report files and uploads them as run artifacts.

- Artifact name format: `aa-cq-reports-<run_number>`
- Included files:
	- `reports/cq-summary.html`
	- `reports/cq-summary.json`
	- `reports/cq-summary.xls`
	- `reports/cq-summary.pdf`
	- `reports/aa-summary.html`
	- `reports/aa-summary.csv`
	- `reports/aa-summary.xls`
	- `reports/aa-summary.pdf`

Download artifacts from the GitHub Actions run summary page.