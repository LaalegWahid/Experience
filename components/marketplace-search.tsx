"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Calendar, LayoutGrid, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { CategoryPickerModal } from "@/components/category-picker-modal";

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
  const [category, setCategory] = useState(defaults.category);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Soft-navigate instead of a full GET reload so the TanStack Query cache
  // survives between searches (revisited filters render instantly).
  function navigate(where: string, when: string, category: string) {
    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    if (when.trim()) params.set("when", when.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    // Stay on the current marketplace route (e.g. /services) — soft-navigate so
    // the TanStack Query cache survives between searches.
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    navigate(String(form.get("where") ?? ""), String(form.get("when") ?? ""), category);
  }

  // Picking a category applies the filter immediately instead of waiting for
  // a separate Search click — read where/when straight off the form (not
  // React state) so this doesn't race the just-selected category value.
  function selectCategory(value: string) {
    setCategory(value);
    setCategoryOpen(false);
    const form = formRef.current;
    const data = form ? new FormData(form) : null;
    navigate(String(data?.get("where") ?? ""), String(data?.get("when") ?? ""), value);
  }

  const segmentClass =
    "flex flex-1 items-center gap-3 px-5 py-5 text-left transition-colors duration-200 ease-out hover:bg-orange-50/60 dark:hover:bg-white/5";
  const fieldLabel = "truncate text-xs text-zinc-500 dark:text-zinc-400";
  const fieldValue =
    "mt-0.5 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-zinc-400";
  const iconClass = "h-5 w-5 shrink-0 text-accent";
  const chevronClass = "h-4 w-4 shrink-0 text-zinc-400";

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="flex flex-col divide-y divide-black/5 overflow-visible rounded-3xl border border-black/5 bg-[#fff7f1] shadow-lg shadow-zinc-900/5 md:flex-row md:items-stretch md:divide-x md:divide-y-0 md:rounded-full dark:divide-white/10 dark:border-white/10 dark:bg-[#1e1a15]">
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
        <div className={segmentClass}>
          <LayoutGrid className={iconClass} aria-hidden="true" />
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={categoryOpen}
            className="flex min-w-0 flex-1 flex-col text-left"
          >
            <span className={fieldLabel}>{t("search.what")}</span>
            <span className={`${fieldValue} block truncate`}>
              {category || t("search.anyActivity")}
            </span>
          </button>
          <input type="hidden" name="category" value={category} readOnly />
          <ChevronDown className={chevronClass} aria-hidden="true" />
        </div>

        <CategoryPickerModal
          open={categoryOpen}
          selected={category}
          onSelect={selectCategory}
          onClose={() => setCategoryOpen(false)}
        />

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
