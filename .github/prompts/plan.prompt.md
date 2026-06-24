---
description: Plan a project or feature — decompose into the smallest shippable slices, write ADRs, and produce a file manifest with acceptance criteria. The entry point of the Dev Loop.
agent: planner
model: ['Claude Opus 4.5', 'GPT-5.4']
tools: ['search', 'codebase', 'fetch', 'githubRepo', 'usages']
---

# /plan

You are planning the project described below. Run the **Plan** phase of the Dev Loop.

**What I want to build:**
> ${input:goal:Describe the project or feature in plain English}

## Do this

1. Read the current repo with `@workspace` — structure, conventions, `CONTEXT.md`,
   existing `docs/plans/`. Build on what's here; don't reinvent it.
2. Produce the full **planner output format**: restated goal → ADRs → numbered slice plan
   (with files touched + acceptance criteria + dependencies) → drafted Issue for slice 1 →
   open questions.
3. Keep every slice independently shippable and reviewable (~≤200 changed lines).
4. Save the plan to `docs/plans/` and each ADR as `docs/plans/ADR-NNN-<slug>.md`.

When I approve, use the **Implement Plan** handoff to pass slice 1 to Brady.
Do not write implementation code in this phase.
