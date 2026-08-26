import { getProviderForUser, getSessionUser } from "@/lib/host";
import { getApiKeysForUser } from "@/lib/api-keys";
import { env } from "@/shared/utils/env";
import { ApiKeysManager, type KeyView } from "./api-keys-manager";

/**
 * Self-contained "API access" panel for embedding in the guest (/appointments)
 * and host (/host) dashboards. Renders nothing when signed out.
 */
export async function ApiKeysSection() {
  const user = await getSessionUser();
  if (!user) return null;

  const [keys, provider] = await Promise.all([
    getApiKeysForUser(user.id),
    getProviderForUser(user.id),
  ]);
  const isHost = provider != null;

  const baseUrl = env.BETTER_AUTH_URL;

  // Only surface active keys — revoked ones are hidden from the list entirely.
  const keyViews: KeyView[] = keys
    .filter((k) => !k.revokedAt)
    .map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
    }));

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800 sm:p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          API access
        </h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Generate a key to call the marketplace API from your own apps. A key
          acts as your account:{" "}
          {isHost
            ? "you can call the host and guest endpoints."
            : "you can call the guest endpoints."}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-foreground">Base URL</span>
          <code className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-foreground dark:bg-zinc-900">
            {baseUrl}
          </code>
        </div>
      </div>

      <ApiKeysManager keys={keyViews} isHost={isHost} />

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Browse every endpoint (with parameters, examples, and a live tester) in
        the API reference tab.
      </p>
    </section>
  );
}
