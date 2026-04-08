# Telegram Status Runbook

## Purpose

Keep Telegram status replies short, operational, and aligned with repo-canonical checkpoints.

## Rendering Order

1. Job id and coarse status
2. Current phase or blocking reason
3. Current platform/company when relevant
4. Next action only if human intervention is required
5. Artifact path or poll command

## Avoid

- dumping raw stack traces unless the worker fully failed
- repeating counters when the blocking reason already explains the state
- inventing next steps that are not encoded in the checkpoint
