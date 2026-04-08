import { describe, expect, it } from "vitest";
import {
  appendHistory,
  buildAgentPrompt,
  EMPTY_ROUTER_STATE,
  isUpdateProcessed,
  markUpdateProcessed,
  MAX_PROCESSED_UPDATE_IDS,
  normalizeAgentOutput,
  parseAllowedChatIds,
  parseRouterState,
  type RouterState,
} from "@/lib/telegram-router";

describe("telegram-router helpers", () => {
  it("parses allowed chat ids from env syntax", () => {
    expect(parseAllowedChatIds(undefined)).toBeNull();
    expect(Array.from(parseAllowedChatIds("123, 456,789") ?? [])).toEqual([
      "123",
      "456",
      "789",
    ]);
  });

  it("strips ansi codes and truncates long replies", () => {
    const raw = "\u001b[31mHello\u001b[0m\n" + "x".repeat(30);
    expect(normalizeAgentOutput(raw, 20)).toBe("Hello\nx\n\n[truncated]");
  });

  it("builds a prompt with history and the latest message", () => {
    const prompt = buildAgentPrompt({
      message: "on en est ou ?",
      history: [
        { role: "user", text: "Salut", at: "2026-04-07T10:00:00.000Z" },
        {
          role: "assistant",
          text: "Je regarde.",
          at: "2026-04-07T10:00:10.000Z",
          agent: "claude",
        },
      ],
      now: new Date("2026-04-07T10:30:00.000Z"),
      workspaceDir: "/root/breakin",
    });

    expect(prompt).toContain("Workspace: /root/breakin.");
    expect(prompt).toContain("Assistant (claude) [2026-04-07T10:00:10.000Z]");
    expect(prompt).toContain("Latest user message:\non en est ou ?");
  });

  it("parses stored state defensively", () => {
    const state = parseRouterState(
      JSON.stringify({
        offset: 12,
        chats: {
          "123": [
            {
              role: "assistant",
              text: "ok",
              at: "2026-04-07T10:00:10.000Z",
              agent: "codex",
            },
          ],
        },
      })
    );

    expect(state.offset).toBe(12);
    expect(state.chats["123"]?.[0]?.agent).toBe("codex");
  });

  it("keeps only the most recent turns per chat", () => {
    const initial: RouterState = { offset: 0, chats: {}, processedUpdateIds: [] };
    const next = appendHistory(
      appendHistory(
        appendHistory(
          initial,
          "123",
          { role: "user", text: "1", at: "a" },
          2
        ),
        "123",
        { role: "assistant", text: "2", at: "b", agent: "claude" },
        2
      ),
      "123",
      { role: "user", text: "3", at: "c" },
      2
    );

    expect(next.chats["123"]).toEqual([
      { role: "assistant", text: "2", at: "b", agent: "claude" },
      { role: "user", text: "3", at: "c" },
    ]);
  });

  it("tracks processed update ids and detects duplicates", () => {
    let state = EMPTY_ROUTER_STATE;
    expect(isUpdateProcessed(state, 100)).toBe(false);

    state = markUpdateProcessed(state, 100);
    expect(isUpdateProcessed(state, 100)).toBe(true);
    expect(state.processedUpdateIds).toEqual([100]);

    // Marking the same id again is idempotent
    state = markUpdateProcessed(state, 100);
    expect(state.processedUpdateIds).toEqual([100]);

    state = markUpdateProcessed(state, 101);
    state = markUpdateProcessed(state, 102);
    expect(state.processedUpdateIds).toEqual([100, 101, 102]);
  });

  it("caps processed update ids to MAX_PROCESSED_UPDATE_IDS", () => {
    let state = EMPTY_ROUTER_STATE;
    for (let i = 0; i < MAX_PROCESSED_UPDATE_IDS + 50; i++) {
      state = markUpdateProcessed(state, i);
    }
    expect(state.processedUpdateIds.length).toBe(MAX_PROCESSED_UPDATE_IDS);
    // Oldest IDs are dropped, newest are kept
    expect(state.processedUpdateIds[0]).toBe(50);
    expect(state.processedUpdateIds[state.processedUpdateIds.length - 1]).toBe(
      MAX_PROCESSED_UPDATE_IDS + 49
    );
    expect(isUpdateProcessed(state, 0)).toBe(false);
    expect(isUpdateProcessed(state, MAX_PROCESSED_UPDATE_IDS + 49)).toBe(true);
  });

  it("parses processed update ids defensively from stored state", () => {
    const state = parseRouterState(
      JSON.stringify({
        offset: 5,
        chats: {},
        processedUpdateIds: [1, 2, 3, "bogus", null, 4],
      })
    );
    expect(state.processedUpdateIds).toEqual([1, 2, 3, 4]);
  });

  it("returns empty processed update ids array on legacy state without the field", () => {
    const state = parseRouterState(JSON.stringify({ offset: 5, chats: {} }));
    expect(state.processedUpdateIds).toEqual([]);
  });
});
