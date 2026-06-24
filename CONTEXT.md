# Context

## Architecture Baseline

- Runtime: Node.js 20 LTS
- Language: JavaScript (CommonJS)
- Layout: single app entrypoint at `src/index.js`
- CI checks: lint, test, build on each push and pull request

## Constraints

- Build in small, reviewable slices only.
- Keep all changes aligned to the current approved plan/ADR.
- Validate input at boundaries and avoid logging sensitive data.
- Avoid direct edits to production infrastructure and secret material.

## Guardrails

- Never commit secrets, credentials, tokens, or key material.
- Treat `docs/memory/` and this file as durable project context.
- Prefer first-party Node.js capabilities before adding dependencies.
