---
description: Persist the decisions and outcomes from a completed slice so the next session starts informed. The Memory phase of the Dev Loop.
agent: implementer
model: ['Claude Sonnet', 'GPT-5 mini']
tools: ['codebase', 'editFiles', 'githubRepo']
---

# /update-memory

A slice just shipped. Capture what's durable so future sessions don't re-derive it.

## Do this

1. **`CONTEXT.md`** — append/adjust any architecture decision, constraint, or convention
   this slice established or changed. Keep it terse and current; delete anything now false.
2. **`docs/memory/<YYYY-MM-DD>.md`** — write a short dated entry: what shipped, key
   decisions (link the ADRs), anything that caused rework, and what's next.
3. **`docs/memory/project-context.md`** — update "current focus" and the slice checklist.
4. If a decision contradicts an earlier memory, fix the earlier note rather than stacking
   a duplicate.

Keep it factual — only what actually happened in this slice. Then summarize what you
recorded and which slice is next per the plan.
