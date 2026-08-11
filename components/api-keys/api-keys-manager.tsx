"use client";

import { useActionState, useState } from "react";
import { createApiKey, revokeApiKey, type CreateKeyState } from "./actions";

export type KeyView = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const initial: CreateKeyState = {};
const inputClass =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300";

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export function ApiKeysManager({
  keys,
  isHost,
}: {
  keys: KeyView[];
  isHost: boolean;
}) {
  const [state, action, pending] = useActionState(createApiKey, initial);
  const [copied, setCopied] = useState(false);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* One-time reveal of a newly created key */}
      {state.createdKey && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <p className="text-sm font-medium text-foreground">
            New key “{state.createdKey.name}” created
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Copy it now. For security it won&apos;t be shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-zinc-300 bg-background px-3 py-2 font-mono text-sm dark:border-zinc-700">
              {state.createdKey.raw}
            </code>
            <button
              type="button"
              onClick={() => copy(state.createdKey!.raw)}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <form
        action={action}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          New key name
          <input
            name="name"
            maxLength={80}
            placeholder="e.g. Production server"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
        >
          {pending ? "Creating…" : "Create key"}
        </button>
      </form>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      {/* Key list */}
      {keys.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No keys yet. Create one above to start calling the API.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys.map((k) => {
            const revoked = Boolean(k.revokedAt);
            return (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-background px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {k.name}{" "}
                    <span className="font-mono text-xs text-zinc-400">
                      {k.prefix}…
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isHost ? "guest + host" : "guest"} · created{" "}
                    {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}
                  </span>
                </div>
                {revoked ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                    Revoked
                  </span>
                ) : (
                  <form action={revokeApiKey.bind(null, k.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Revoke
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
