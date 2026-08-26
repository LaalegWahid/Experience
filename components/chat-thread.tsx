"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";
import { formatMessageTime } from "@/shared/utils/datetime";
import { useLanguage } from "./language-provider";

export type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

const POLL_MS = 4000;

// Matches http(s) URLs and bare www. links so they can be rendered as anchors.
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
// Punctuation that's almost always sentence-trailing, not part of the URL.
const TRAILING_PUNCT_RE = /[.,!?;:)\]]+$/;

/**
 * Render a message body with its URLs turned into clickable links, so links are
 * visually distinct from plain text. Links are user-generated, so they open in a
 * new tab with `noopener`/`nofollow`. Non-URL text is returned as-is.
 */
function renderMessageBody(body: string, mine: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_RE.exec(body)) !== null) {
    let url = match[0];
    const start = match.index;

    // Don't swallow trailing sentence punctuation into the link.
    const trailing = url.match(TRAILING_PUNCT_RE)?.[0] ?? "";
    if (trailing) url = url.slice(0, -trailing.length);

    if (start > lastIndex) nodes.push(body.slice(lastIndex, start));
    nodes.push(
      <a
        key={start}
        href={url.startsWith("http") ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`break-all underline underline-offset-2 transition-opacity hover:opacity-80 ${
          mine ? "decoration-accent-foreground/60" : "text-accent"
        }`}
      >
        {url}
      </a>,
    );
    if (trailing) nodes.push(trailing);
    lastIndex = start + url.length + trailing.length;
  }
  if (lastIndex < body.length) nodes.push(body.slice(lastIndex));
  return nodes;
}

/**
 * The live message thread for a service: loads + polls history, renders the
 * bubble list, and sends new messages. Auth / host gating is left to the
 * parent — this only mounts for a signed-in guest who can chat. Reused by the
 * inline "Message the host" section and the slide-over chat drawer.
 */
export function ChatThread({
  offeringId,
  hostName,
  /** Classes for the scrollable message area — lets the host pick a fixed
   *  height (inline) or fill the available space (drawer). */
  listClassName = "max-h-72",
}: {
  offeringId: string;
  hostName: string;
  listClassName?: string;
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const endpoint = `/api/services/${offeringId}/messages`;

  const load = useCallback(async () => {
    const fetchResult = await tryCatch(fetch(endpoint, { cache: "no-store" }));
    if (!fetchResult.ok) return; // ignore transient network errors during polling
    const res = fetchResult.data;
    if (!res.ok) return; // stay quiet on poll errors
    const parsed = await tryCatch(
      res.json() as Promise<{ messages?: ChatMessage[] }>,
    );
    if (parsed.ok && Array.isArray(parsed.data.messages)) {
      setMessages(parsed.data.messages);
    }
  }, [endpoint]);

  // Initial load + polling.
  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Keep the view pinned to the latest message.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);

    const fetchResult = await tryCatch(
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    );
    if (!fetchResult.ok) {
      setError(t("chat.networkError"));
      setSending(false);
      return;
    }
    const res = fetchResult.data;
    const parsed = await tryCatch(
      res.json() as Promise<{ message?: ChatMessage; error?: string }>,
    );
    const data = parsed.ok ? parsed.data : {};

    setSending(false);
    if (!res.ok) {
      setError(data.error ?? t("chat.sendError"));
      return;
    }
    setInput("");
    if (data.message) {
      setMessages((prev) => [...prev, data.message as ChatMessage]);
    } else {
      load();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className={`flex flex-col gap-2 overflow-y-auto ${listClassName}`}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            {t("chat.noMessages").replace("{host}", hostName)}
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
            >
              <span
                className={`max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl px-3 py-2 text-sm ${
                  m.mine
                    ? "bg-accent text-accent-foreground"
                    : "bg-zinc-100 text-foreground dark:bg-zinc-800"
                }`}
              >
                {renderMessageBody(m.body, m.mine)}
              </span>
              <span className="mt-1 px-1 text-[11px] text-zinc-400">
                {formatMessageTime(m.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <form onSubmit={send} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chat.placeholder").replace("{host}", hostName)}
          maxLength={2000}
          className="flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700 dark:focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-200"
        >
          {sending ? "…" : t("chat.send")}
        </button>
      </form>
    </div>
  );
}
