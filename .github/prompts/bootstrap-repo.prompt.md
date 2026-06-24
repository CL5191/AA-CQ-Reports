---
description: Scaffold an empty or new repo into the Dev Loop layout so Copilot has full context from day one. Run this once, before the first /plan.
agent: implementer
model: ['GPT-5.3-Codex', 'Claude Sonnet']
tools: ['codebase', 'editFiles', 'runCommands', 'githubRepo']
---

# /bootstrap-repo

Scaffold this repo into the **Dev Loop layout**. Create only what's missing — never
overwrite an existing file without showing me the diff first.

**Project basics (used to fill templates):**
- Name: ${input:name:Project name}
- Stack: ${input:stack:Primary language / framework / runtime}

## Create

1. **Top level:** `README.md` (project name + purpose + how to run the Dev Loop),
   `.gitignore` (stack-specific), `LICENSE` (ask which), `.editorconfig`, `CONTEXT.md`
   (architecture decisions + constraints — start with the stack and guardrails).
2. **`.github/`:** keep the existing `copilot-instructions.md`, `agents/`, and `prompts/`
   from this pack. Add: `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/` (bug, feature, task),
   `CODEOWNERS`, `dependabot.yml`, and `workflows/ci.yml` (lint + test + build).
3. **`docs/`:** `docs/plans/` (with a `README.md` explaining ADR numbering) and
   `docs/memory/project-context.md` (squad roster + current focus).
4. **`.vscode/mcp.json`:** a commented starter with the GitHub MCP server, ready for the
   team to extend.
5. **Source layout:** the conventional entry-point folder for ${input:stack} with a
   minimal runnable "hello" so CI has something green to check.

Then fill the `<!-- FILL -->` blanks in `copilot-instructions.md` from what you scaffolded,
show me the tree, and tell me the next step is `/plan`.
