"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, LayoutGrid, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useLockBodyScroll } from "./use-lock-body-scroll";
import { CategoryPickerModal } from "@/components/category-picker-modal";

type Defaults = { where: string; when: string; category: string };

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Airbnb-style mobile search: a compact "Start your search" pill that sticks
 * below the navbar and opens a full-screen Where / What / When sheet. Applying
 * navigates to /services with the chosen filters. Phone-only (the desktop
 * morphing bar handles larger screens).
 */
export function MarketplaceSearchMobile({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [where, setWhere] = useState(defaults.where);
  const [when, setWhen] = useState(defaults.when);
  const [category, setCategory] = useState(defaults.category);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  useLockBodyScroll(open);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function clearAll() {
    setWhere("");
    setWhen("");
    setCategory("");
  }

  function submit() {
    const params = new URLSearchParams();
    if (where.trim()) params.set("where", where.trim());
    if (when.trim()) params.set("when", when.trim());
    if (category.trim()) params.set("category", category.trim());
    const qs = params.toString();
    setOpen(false);
    router.push(qs ? `/services?${qs}` : "/services");
  }

  // Summary line on the pill, from the currently applied filters.
  const triggerMain = defaults.where || t("search.startSearch");
  const triggerSub = [
    defaults.when || t("search.when"),
    defaults.category || t("search.anyActivity"),
  ].join(" · ");

  return (
    <>
      {/* Trigger pill — sticks below the navbar so search is always a tap away. */}
      <div className="sticky top-[4.5rem] z-30">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-full border border-black/5 bg-[#fff7f1] px-3 py-2.5 shadow-md shadow-zinc-900/5 transition-shadow active:shadow-sm dark:border-white/10 dark:bg-[#1e1a15]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <SearchIcon />
          </span>
          <span className="flex min-w-0 flex-col text-left">
            <span className="truncate text-sm font-semibold text-foreground">
              {triggerMain}
            </span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {triggerSub}
            </span>
          </span>
        </button>
      </div>

      {/* Full-screen search sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#fff7f1] dark:bg-[#1e1a15]">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("booking.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-foreground">
              {t("search.search")}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              {t("home.clearFilters")}
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {/* Where */}
            <label className="flex flex-col gap-1.5 rounded-2xl border border-black/5 px-4 py-6 transition-colors duration-200 ease-out focus-within:border-accent dark:border-white/10">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {t("search.where")}
              </span>
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder={t("search.wherePlaceholder")}
                className="bg-transparent text-base text-foreground outline-none placeholder:text-zinc-400"
                autoFocus
              />
            </label>

            {/* What */}
            <button
              type="button"
              onClick={() => setCategoryPickerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={categoryPickerOpen}
              className="flex flex-col gap-1.5 rounded-2xl border border-black/5 px-4 py-6 text-left transition-colors duration-200 ease-out hover:bg-orange-50/60 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <LayoutGrid className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {t("search.what")}
              </span>
              <span className="flex items-center justify-between">
                <span className="text-base text-foreground">
                  {category || t("search.anyActivity")}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              </span>
            </button>

            {/* When */}
            <label className="flex flex-col gap-1.5 rounded-2xl border border-black/5 px-4 py-6 transition-colors duration-200 ease-out focus-within:border-accent dark:border-white/10">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {t("search.when")}
              </span>
              <input
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="bg-transparent text-base text-foreground outline-none"
              />
            </label>
          </div>

          <div className="border-t border-black/5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10">
            <button
              type="button"
              onClick={submit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <SearchIcon className="h-5 w-5" />
              {t("search.search")}
            </button>
          </div>
        </div>
      )}

      <CategoryPickerModal
        open={categoryPickerOpen}
        selected={category}
        onSelect={(value) => {
          setCategory(value);
          setCategoryPickerOpen(false);
        }}
        onClose={() => setCategoryPickerOpen(false)}
      />
    </>
  );
}
