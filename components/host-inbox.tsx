"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";
import { formatMessageTime } from "@/shared/utils/datetime";

type Conversation = {
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

export function HostInbox({ offeringId }: { offeringId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const base = `/api/host/listings/${offeringId}`;

  const loadConversations = useCallback(async () => {
    const res = await tryCatch(
      fetch(`${base}/conversations`, { cache: "no-store" }),
    );
    if (!res.ok || !res.data.ok) return;
    const parsed = await tryCatch(
      res.data.json() as Promise<{ conversations?: Conversation[] }>,
    );
    if (parsed.ok && Array.isArray(parsed.data.conversations)) {
      setConversations(parsed.data.conversations);
    }
  }, [base]);

  const loadThread = useCallback(
    async (guestId: string) => {
      const res = await tryCatch(
        fetch(`${base}/messages?guestId=${encodeURIComponent(guestId)}`, {
          cache: "no-store",
        }),
      );
      if (!res.ok || !res.data.ok) return;
      const parsed = await tryCatch(
        res.data.json() as Promise<{ messages?: ChatMessage[] }>,
      );
      if (parsed.ok && Array.isArray(parsed.data.messages)) {
        setMessages(parsed.data.messages);
      }
    },
    [base],
  );

  // Poll the conversation list.
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Default to the most recent conversation.
  useEffect(() => {
    if (!selected && conversations.length) setSelected(conversations[0].guestId);
  }, [conversations, selected]);

  // Poll the selected guest's thread.
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    loadThread(selected);
    const t = setInterval(() => loadThread(selected), 4000);
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
      fetch(`${base}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: selected, body }),
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
    if (data.message) setMessages((prev) => [...prev, data.message as ChatMessage]);
    loadConversations();
  }

  if (conversations.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-orange-200 bg-[#fff7f1] p-10 text-center text-sm text-zinc-500 dark:border-orange-900/40 dark:bg-[#1e1a15] dark:text-zinc-400">
        No guest messages yet. When someone messages you about this listing,
        their conversation will appear here.
      </p>
    );
  }

  const selectedConv = conversations.find((c) => c.guestId === selected);

  return (
    <div className="grid h-[26rem] grid-cols-1 overflow-hidden rounded-2xl border border-black/5 bg-[#fff7f1] sm:grid-cols-[220px_1fr] dark:border-white/10 dark:bg-[#1e1a15]">
      {/* Conversation list */}
      <div className="flex flex-col overflow-y-auto border-b border-black/5 sm:border-b-0 sm:border-r dark:border-white/10">
        {conversations.map((c) => (
          <button
            key={c.guestId}
            type="button"
            onClick={() => setSelected(c.guestId)}
            className={`flex flex-col gap-0.5 border-b border-black/5 px-4 py-3 text-left transition-colors duration-200 ease-out last:border-b-0 dark:border-white/10 ${
              selected === c.guestId
                ? "bg-accent/10"
                : "hover:bg-orange-50 dark:hover:bg-white/5"
            }`}
          >
            <span className="text-sm font-medium text-foreground">
              {c.guestName}
            </span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {c.lastBody}
            </span>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-black/5 px-4 py-3 text-sm font-medium text-foreground dark:border-white/10">
          {selectedConv?.guestName ?? "Select a conversation"}
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
                    : "bg-[#fff2e9] text-foreground dark:bg-white/10"
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
          className="flex items-center gap-2 border-t border-black/5 p-3 dark:border-white/10"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedConv ? `Reply to ${selectedConv.guestName}…` : "Reply…"
            }
            disabled={!selected}
            maxLength={2000}
            className="flex-1 rounded-full border border-black/10 bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent disabled:opacity-50 dark:border-white/10 dark:focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !selected}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
