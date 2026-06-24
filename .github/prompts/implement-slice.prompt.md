---
description: Build one planned slice end-to-end with tests, then open a PR that closes the linked issue. The Build phase of the Dev Loop.
agent: implementer
model: ['GPT-5.3-Codex', 'Claude Sonnet']
tools: ['codebase', 'search', 'usages', 'editFiles', 'runCommands', 'runTests', 'problems', 'githubRepo']
---

# /implement-slice

Implement **one** slice from the approved plan. Default to the next unbuilt slice unless I
name one here:

> ${input:slice:Which slice? (leave blank for the next unbuilt slice)}

## Do this

1. Read `CONTEXT.md`, the slice's acceptance criteria, and the linked issue.
2. If the plan is ambiguous or the slice has grown, **stop** and use *Back to Planner*.
3. Implement only the files this slice lists. TDD where it fits. No out-of-scope refactors.
4. Respect guardrails: no edits to secrets, `.env*`, or `infra/terraform/prod/**` unless
   I explicitly named that path above.
5. Run lint + tests locally until green.
6. Commit with Conventional Commits, open a PR using `PULL_REQUEST_TEMPLATE.md`, include
   `Closes #N`, and summarize how you verified it.
7. Use the **Request Review** handoff to pass the PR to the `reviewer` agent.
