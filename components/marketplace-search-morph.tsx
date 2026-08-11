"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Calendar, LayoutGrid } from "lucide-react";
import { MarketplaceSearch } from "@/components/marketplace-search";
import { MarketplaceSearchMobile } from "@/components/marketplace-search-mobile";
import { useLanguage } from "@/components/language-provider";

type Defaults = { where: string; when: string; category: string };

/**
 * Responsive marketplace search.
 *  • Desktop: an Airbnb-style morphing bar — the full Where/What/When search in
 *    flow that collapses into a compact pill centred in the navbar on scroll.
 *  • Mobile: a "Start your search" pill that opens a full-screen search sheet
 *    (see MarketplaceSearchMobile), so it never crowds the small header.
 */
export function MarketplaceSearchMorph({ defaults }: { defaults: Defaults }) {
  const { t } = useLanguage();
  const barRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Collapse once the full bar scrolls above the navbar line; expand when it
  // comes back into view. (Desktop only — the bar is hidden on phones.)
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: "-104px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const whereLabel = defaults.where || t("search.where");
  const whenLabel = defaults.when || t("search.when");
  const whatLabel = defaults.category || t("search.anyActivity");
  const expand = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* ── Desktop: morphing full bar + collapsed pill ───────────────── */}
      <div
        ref={barRef}
        className="hidden transition-all duration-300 ease-out sm:block"
        style={{
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? "scale(0.97)" : "scale(1)",
        }}
        aria-hidden={collapsed}
      >
        <MarketplaceSearch defaults={defaults} />
      </div>

      {/* Collapsed pill — segmented (Where · What · When), centred in the navbar's
          empty middle. Desktop only. */}
      <div
        className={`fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 transition-all duration-300 ease-out sm:block ${
          collapsed
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1.5 scale-90 opacity-0"
        }`}
      >
        <div className="flex max-w-[92vw] items-center rounded-full border border-zinc-200 bg-background p-1.5 pl-1 shadow-lg shadow-zinc-900/10 transition-shadow hover:shadow-xl dark:border-zinc-800">
          <button
            type="button"
            onClick={expand}
            className="flex max-w-[26vw] items-center gap-1.5 truncate rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate">{whereLabel}</span>
          </button>
          <span className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={expand}
            className="flex max-w-[26vw] items-center gap-1.5 truncate rounded-full px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate">{whatLabel}</span>
          </button>
          <span className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={expand}
            className="flex max-w-[26vw] items-center gap-1.5 truncate rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate">{whenLabel}</span>
          </button>
          <button
            type="button"
            onClick={expand}
            aria-label={t("search.search")}
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile: tap-to-search pill + full-screen sheet ────────────── */}
      <div className="sm:hidden">
        <MarketplaceSearchMobile defaults={defaults} />
      </div>
    </>
  );
}
