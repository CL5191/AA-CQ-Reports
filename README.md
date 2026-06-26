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

# AA summary in HTML written to file
npm start -- data/sample-aa.csv --source aa --format html --out reports/aa-summary.html

# CQ summary for a date/time range (inclusive)
npm start -- data/sample-cq.csv --source cq --format json --from 2026-06-20T10:00:00Z --to 2026-06-20T10:03:00Z
```

CLI options:

- `--source cq|aa` selects call queue or auto attendant input semantics.
- `--format text|json|csv|html` controls output format.
- `--out <path>` writes the rendered report to a file (directories are created automatically).
- `--from <timestamp>` includes rows on/after the timestamp.
- `--to <timestamp>` includes rows on/before the timestamp.

Run checks:

```bash
npm run lint
npm test
npm run build
```