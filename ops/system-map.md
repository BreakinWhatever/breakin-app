# BreakIn Ops System Map

## Canonical Layers

1. `ops/`
   Durable operational memory: progress, system map, playbooks, runbooks, retrieval index, standard answers.
2. `src/lib/ops/*`
   Loaders and helpers that turn repo docs/data into runtime hints, checkpoints, and status payloads.
3. `src/lib/apply/*` and `src/lib/sourcing/*`
   Deterministic engines that consume playbooks/manifests/checkpoints.
4. `.runtime/*` and DB jobs
   Runtime state only: live progress, artifacts, summaries, worker logs, and persisted execution results.

## Apply Flow

`offer -> preflight -> manifest -> playbook merge -> answer bundle -> apply execution -> checkpoint -> summary`

- `preflight` observes the site and produces a manifest candidate.
- `ops` playbooks inject durable routing rules before execution.
- `.runtime/apply-preflight/*` and `.runtime/apply-jobs/*` store checkpoints and artifacts.
- DB rows keep queueing, status, and summary pointers, not long-lived operational rules.

## Search + Telegram Flow

`search request -> job file -> progress -> checkpoint -> Telegram status -> summary`

- Search jobs persist to `.runtime/search-jobs/*`.
- Telegram renders checkpoint-driven status instead of ad hoc strings.
- A future `ops/status` snapshot aggregates apply, preflight, and search.

## Retrieval Rules

- Load `ops/PROGRESS.md` and `ops/system-map.md` first.
- Load only targeted playbooks/runbooks from `ops/retrieval/index.json`.
- Never inject raw Skool dumps or runtime artifacts as durable memory.
