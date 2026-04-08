# Search + Telegram Status Playbook

## Goal

Render search progress through a shared checkpoint shape so Telegram, API polling, and future dashboards speak the same language.

## Required Status Outputs

- current phase
- current company or page when available
- blocking reason when failed
- next human action only when the system is genuinely blocked

## Rules

- Running jobs should highlight the current company before low-signal counters.
- Failed jobs should surface one normalized blocking reason and the worker error.
- Completed jobs should point to summary artifacts, not replay raw logs.
