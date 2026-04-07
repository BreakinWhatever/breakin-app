# Telegram Fallback Router

This replaces the direct Claude Telegram channel with a VPS-side router:

- first try `claude -p`
- if Claude fails, times out, or returns nothing, fallback to `codex exec`
- send the final reply back through the same Telegram bot

## Files

- `scripts/telegram-router.ts` — long-polling daemon
- `src/lib/telegram-router.ts` — pure helpers + prompt/state logic
- `tests/lib/telegram-router.test.ts` — helper coverage

## Required env

- `TELEGRAM_BOT_TOKEN`
- `BREAKIN_WORKSPACE_DIR=/root/breakin`

Optional:

- `TELEGRAM_ALLOWED_CHAT_IDS=6232011371`
- `CLAUDE_MODEL=claude-opus-4-6`
- `CODEX_MODEL=gpt-5-codex`
- `CLAUDE_TIMEOUT_MS=120000`
- `CODEX_TIMEOUT_MS=180000`
- `AGENT_ROUTER_STATE_FILE=/root/breakin/.runtime/telegram-router-state.json`

## Start manually

```bash
cd /root/breakin
TELEGRAM_BOT_TOKEN=... \
BREAKIN_WORKSPACE_DIR=/root/breakin \
npx tsx scripts/telegram-router.ts
```

## Production switch on the same bot

1. Backup the current Claude Telegram setup.
2. Stop the current consumer before starting the router.
3. Start the router.
4. Test from Telegram.
5. If needed, rollback by stopping the router and restarting the old Claude service.

Example stop/start sequence:

```bash
systemctl stop breakin-telegram.service || true
tmux kill-session -t breakin-agent || true

cd /root/breakin
nohup npx tsx scripts/telegram-router.ts \
  > /var/log/breakin-telegram-router.log 2>&1 &
echo $! > /var/run/breakin-telegram-router.pid
```

## Rollback

```bash
kill "$(cat /var/run/breakin-telegram-router.pid)" || true
rm -f /var/run/breakin-telegram-router.pid
systemctl start breakin-telegram.service
```

## Important constraint

Do not run the direct Claude Telegram channel and this router at the same time on the same bot token. Telegram updates must have a single active consumer.
