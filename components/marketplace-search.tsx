"use client";

import { usePathname, useRouter } from "next/navigation";
import { MapPin, Calendar, LayoutGrid, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { ALL_CATEGORIES } from "@/shared/data/all-categories";

type Props = {
  defaults: {
    where: string;
    when: string;
    category: string;
  };
};

/**
 * Airbnb-style marketplace search: Where / What / When. A plain GET form so
 * the server page still does the filtering.
 */
export function MarketplaceSearch({ defaults }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  // Soft-navigate instead of a full GET reload so the TanStack Query cache
  // survives between searches (revisited filters render instantly).
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const where = String(form.get("where") ?? "").trim();
    const when = String(form.get("when") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    if (where) params.set("where", where);
    if (when) params.set("when", when);
    if (category) params.set("category", category);
    const qs = params.toString();
    // Stay on the current marketplace route (e.g. /services) — soft-navigate so
    // the TanStack Query cache survives between searches.
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const segmentClass =
    "flex flex-1 items-center gap-3 px-5 py-5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40";
  const fieldLabel = "truncate text-xs text-zinc-500 dark:text-zinc-400";
  const fieldValue =
    "mt-0.5 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-zinc-400";
  const iconClass = "h-5 w-5 shrink-0 text-accent";
  const chevronClass = "h-4 w-4 shrink-0 text-zinc-400";

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col divide-y divide-zinc-200 overflow-visible rounded-3xl border border-zinc-200 bg-background shadow-lg shadow-zinc-900/5 md:flex-row md:items-stretch md:divide-x md:divide-y-0 md:rounded-full dark:divide-zinc-800 dark:border-zinc-800">
        {/* Where */}
        <label className={`${segmentClass} md:rounded-l-full`}>
          <MapPin className={iconClass} aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={fieldLabel}>{t("search.where")}</span>
            <input
              type="text"
              name="where"
              defaultValue={defaults.where}
              placeholder={t("search.wherePlaceholder")}
              className={fieldValue}
            />
          </span>
          <ChevronDown className={chevronClass} aria-hidden="true" />
        </label>

        {/* What */}
        <label className={segmentClass}>
          <LayoutGrid className={iconClass} aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={fieldLabel}>{t("search.what")}</span>
            <select
              name="category"
              defaultValue={defaults.category}
              className={`${fieldValue} cursor-pointer appearance-none`}
            >
              <option value="">{t("search.anyActivity")}</option>
              {ALL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </span>
          <ChevronDown className={chevronClass} aria-hidden="true" />
        </label>

        {/* When */}
        <label className={segmentClass}>
          <Calendar className={iconClass} aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={fieldLabel}>{t("search.when")}</span>
            <input
              type="date"
              name="when"
              defaultValue={defaults.when}
              className={fieldValue}
            />
          </span>
        </label>

        {/* Search button */}
        <div className="flex items-center gap-1 p-2">
          <button
            type="submit"
            aria-label={t("search.search")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 md:w-auto md:px-6"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>{t("search.search")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
