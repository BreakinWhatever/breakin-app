# Progress

## Current Status
Apply V3 and the repo-canonical ops layer are wired in. Workday auth now has a deterministic `existing account -> sign in -> continue application` branch, and job status payloads expose checkpoints across apply, preflight, and search.

## Last Session (2026-04-08)
- Completed: landed the repo-canonical ops layer (`ops/`), loaders in `src/lib/ops/*`, Workday auth playbook wiring, enriched API payloads, and checkpoint-aware Telegram/search/apply status
- Verified: focused unit coverage is green for ops/apply/telegram/search integration
- Pending: run a real external ATS E2E on Workday/Ares
- Next: capture the first external run artifacts, then tighten any host-specific Workday overrides that remain

## Decisions Made
- Repo Markdown + JSON is the durable source of truth for operational memory.
- The wiki mirrors and indexes repo state; it is not a second canonical source.
- The Skool corpus stays offline knowledge; only distilled methods are promoted into BreakIn docs and playbooks.
- Apply execution is `dev-browser` only; Playwright fallback is removed from the hot path.

## Open Questions
- Which Workday hosts still need host-specific overrides beyond the shared auth playbook?
- Which additional Telegram/search/apply runbooks deserve promotion into `ops/` after the first live ATS validation?
