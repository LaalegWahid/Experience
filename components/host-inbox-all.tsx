"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";
import { formatMessageTime } from "@/shared/utils/datetime";

type Conversation = {
  offeringId: string;
  offeringTitle: string;
  guestId: string;
  guestName: string;
  lastBody: string;
  lastAt: string;
};

type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

const POLL_MS = 5000;

/** Stable key for a conversation: a guest's thread about one listing. */
function convKey(c: Pick<Conversation, "offeringId" | "guestId">): string {
  return `${c.offeringId}:${c.guestId}`;
}

/**
 * The host's unified inbox: every guest conversation across all listings in one
 * place. Conversations are loaded from the provider-wide endpoint; individual
 * threads and replies reuse the per-listing message API, keyed by the listing
 * each conversation belongs to.
 */
export function HostInboxAll() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => convKey(c) === selectedKey) ?? null;

  const loadConversations = useCallback(async () => {
    const res = await tryCatch(
      fetch("/api/host/conversations", { cache: "no-store" }),
    );
    if (!res.ok || !res.data.ok) return;
    const parsed = await tryCatch(
      res.data.json() as Promise<{ conversations?: Conversation[] }>,
    );
    if (parsed.ok && Array.isArray(parsed.data.conversations)) {
      setConversations(parsed.data.conversations);
    }
  }, []);

  const loadThread = useCallback(
    async (offeringId: string, guestId: string) => {
      const res = await tryCatch(
        fetch(
          `/api/host/listings/${offeringId}/messages?guestId=${encodeURIComponent(guestId)}`,
          { cache: "no-store" },
        ),
      );
      if (!res.ok || !res.data.ok) return;
      const parsed = await tryCatch(
        res.data.json() as Promise<{ messages?: ChatMessage[] }>,
      );
      if (parsed.ok && Array.isArray(parsed.data.messages)) {
        setMessages(parsed.data.messages);
      }
    },
    [],
  );

  // Poll the conversation list.
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Default to the most recent conversation.
  useEffect(() => {
    if (!selectedKey && conversations.length) {
      setSelectedKey(convKey(conversations[0]));
    }
  }, [conversations, selectedKey]);

  // Poll the selected thread.
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    const { offeringId, guestId } = selected;
    loadThread(offeringId, guestId);
    const t = setInterval(() => loadThread(offeringId, guestId), 4000);
    return () => clearInterval(t);
  }, [selected, loadThread]);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !selected || sending) return;

    setSending(true);
    setError(null);
    const res = await tryCatch(
      fetch(`/api/host/listings/${selected.offeringId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: selected.guestId, body }),
      }),
    );
    if (!res.ok) {
      setError("Network error. Please try again.");
      setSending(false);
      return;
    }
    const parsed = await tryCatch(
      res.data.json() as Promise<{ message?: ChatMessage; error?: string }>,
    );
    const data = parsed.ok ? parsed.data : {};
    setSending(false);
    if (!res.data.ok) {
      setError(data.error ?? "Could not send your reply.");
      return;
    }
    setInput("");
    if (data.message)
      setMessages((prev) => [...prev, data.message as ChatMessage]);
    loadConversations();
  }

  if (conversations.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-background p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No guest messages yet. When someone messages you about one of your
        listings, their conversation will appear here.
      </p>
    );
  }

  return (
    <div className="grid h-[32rem] grid-cols-1 overflow-hidden rounded-2xl border border-zinc-200 bg-background sm:grid-cols-[260px_1fr] dark:border-zinc-800">
      {/* Conversation list */}
      <div className="flex flex-col overflow-y-auto border-b border-zinc-200 sm:border-b-0 sm:border-r dark:border-zinc-800">
        {conversations.map((c) => {
          const key = convKey(c);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`flex flex-col gap-0.5 border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-zinc-800/70 ${
                selectedKey === key
                  ? "bg-accent/10"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {c.guestName}
                </span>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {formatMessageTime(c.lastAt)}
                </span>
              </div>
              <span className="truncate text-xs font-medium text-accent">
                {c.offeringTitle}
              </span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {c.lastBody}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-0.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <span className="text-sm font-medium text-foreground">
            {selected?.guestName ?? "Select a conversation"}
          </span>
          {selected && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              about {selected.offeringTitle}
            </span>
          )}
        </div>
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
            >
              <span
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.mine
                    ? "bg-accent text-accent-foreground"
                    : "bg-zinc-100 text-foreground dark:bg-zinc-800"
                }`}
              >
                {m.body}
              </span>
              <span className="mt-1 px-1 text-[11px] text-zinc-400">
                {formatMessageTime(m.createdAt)}
              </span>
            </div>
          ))}
        </div>
        {error && (
          <p className="px-4 pb-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <form
          onSubmit={send}
          className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selected ? `Reply to ${selected.guestName}…` : "Reply…"
            }
            disabled={!selected}
            maxLength={2000}
            className="flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent disabled:opacity-50 dark:border-zinc-700 dark:focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !selected}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-200"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
