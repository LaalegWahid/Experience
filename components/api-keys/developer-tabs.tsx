"use client";

import { useState, type ReactNode } from "react";

type TabKey = "keys" | "reference";

const TABS: { key: TabKey; label: string }[] = [
  { key: "keys", label: "API keys" },
  { key: "reference", label: "API reference" },
];

function TabIcon({ tab }: { tab: TabKey }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4 shrink-0",
    "aria-hidden": true,
  };
  return tab === "keys" ? (
    <svg {...common}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  ) : (
    <svg {...common}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

/**
 * Developer page shell: a left sidebar (title + vertical section nav) and a
 * content area. Both panels are rendered on the server and passed in; they stay
 * mounted (toggled with `hidden`) so tester state and a pasted key survive
 * switching sections. On small screens the sidebar collapses to a top bar.
 */
export function DeveloperTabs({
  keysPanel,
  referencePanel,
}: {
  keysPanel: ReactNode;
  referencePanel: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("keys");

  return (
    <div className="mx-auto w-full max-w-[1920px] px-6 py-10 sm:py-12 lg:px-10 xl:px-20">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Sidebar — sticks below the navbar while the content scrolls. */}
        <aside className="lg:sticky lg:top-36 lg:w-56 lg:shrink-0 lg:self-start">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Developer
              </h1>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Generate API keys and call the marketplace from your own apps.
              </p>
            </header>

            <nav
              className="flex gap-1 border-t border-zinc-200 pt-4 lg:flex-col dark:border-zinc-800"
              aria-label="Developer sections"
            >
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:flex-none ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <TabIcon tab={t.key} />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className={tab === "keys" ? "" : "hidden"}>{keysPanel}</div>
          <div className={tab === "reference" ? "" : "hidden"}>
            {referencePanel}
          </div>
        </div>
      </div>
    </div>
  );
}
