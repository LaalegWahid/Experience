"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Palette,
  Dumbbell,
  UtensilsCrossed,
  Landmark,
  Mountain,
  ChefHat,
  Scissors,
  Camera,
  Flower2,
  Compass,
  ConciergeBell,
  type LucideIcon,
} from "lucide-react";
import {
  OfferingsResults,
  type OfferingFilters,
} from "@/components/offerings-results";
import { useLanguage } from "@/components/language-provider";
import { SERVICE_CATEGORIES } from "@/shared/data/service-categories";
import { EXPERIENCE_CATEGORIES } from "@/shared/data/experience-categories";

type OfferingType = "experience" | "service";
type CategoryChip = { value: string; label: string };

// Every category across both types, de-duplicated (the shared "Other"
// catch-all only needs to appear once), for the "All" scope.
const ALL_TYPE_CATEGORIES: CategoryChip[] = [
  ...EXPERIENCE_CATEGORIES,
  ...SERVICE_CATEGORIES,
].filter((c, i, arr) => arr.findIndex((x) => x.value === c.value) === i);

// Icon per category, for the compact filter chips (the categories' own
// `icon` field is a 3D PNG sized for the host wizard's big picker cards, too
// heavy for a small inline chip).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Art and design": Palette,
  "Fitness and wellness": Dumbbell,
  "Food and drink": UtensilsCrossed,
  "History and culture": Landmark,
  "Nature and outdoors": Mountain,
  Catering: ChefHat,
  Chef: ChefHat,
  "Hair styling": Scissors,
  Makeup: Sparkles,
  Massage: Flower2,
  "Personal training": Dumbbell,
  Photography: Camera,
  "Prepared meals": UtensilsCrossed,
  "Spa treatments": Flower2,
  Other: Sparkles,
};

/**
 * A single horizontally scrollable filter bar: All / Experiences / Services,
 * then category chips scoped to whichever type is active (every category when
 * "All" is selected). Category selection soft-navigates with the `category`
 * query param set, the same mechanism the hero search's "What" dropdown uses,
 * so both stay in sync with the URL as the single source of truth. The type
 * scope is local UI state — it just slices the already-fetched results.
 */
function FilterBar({
  type,
  onTypeChange,
  activeCategory,
  where,
  when,
}: {
  type: OfferingType | null;
  onTypeChange: (type: OfferingType | null) => void;
  activeCategory: string;
  where: string;
  when: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const categories =
    type === "experience"
      ? EXPERIENCE_CATEGORIES
      : type === "service"
        ? SERVICE_CATEGORIES
        : ALL_TYPE_CATEGORIES;

  function selectCategory(value: string) {
    const params = new URLSearchParams();
    if (where) params.set("where", where);
    if (when) params.set("when", when);
    if (value) params.set("category", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  // Switching scope makes the previously active category invalid, so clear it.
  function selectType(next: OfferingType | null) {
    onTypeChange(next);
    selectCategory("");
  }

  const buttonClass =
    "group flex shrink-0 flex-col items-center gap-2 pb-1 text-xs font-medium";
  const cardClass = (active: boolean) =>
    `flex h-16 w-16 items-center justify-center rounded-2xl border bg-background shadow-md transition-shadow ${
      active
        ? "border-accent shadow-lg"
        : "border-zinc-200 group-hover:shadow-lg dark:border-zinc-800"
    }`;
  const iconClass = "h-8 w-8 text-accent";
  const labelClass = (active: boolean) =>
    `whitespace-nowrap transition-colors ${
      active
        ? "text-accent"
        : "text-zinc-500 group-hover:text-foreground dark:text-zinc-400"
    }`;

  return (
    <div className="scrollbar-none flex justify-start gap-4 overflow-x-auto pb-1 sm:justify-center [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => selectType(null)}
        className={buttonClass}
      >
        <span className={cardClass(type === null)}>
          <Sparkles className={iconClass} aria-hidden="true" />
        </span>
        <span className={labelClass(type === null)}>{t("home.allCategories")}</span>
      </button>
      <button
        type="button"
        onClick={() => selectType("experience")}
        className={buttonClass}
      >
        <span className={cardClass(type === "experience")}>
          <Compass className={iconClass} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className={labelClass(type === "experience")}>
          {t("home.tabExperiences")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => selectType("service")}
        className={buttonClass}
      >
        <span className={cardClass(type === "service")}>
          <ConciergeBell className={iconClass} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className={labelClass(type === "service")}>{t("home.tabServices")}</span>
      </button>
      {categories.map((c) => {
        const active = c.value === activeCategory;
        const Icon = CATEGORY_ICONS[c.value] ?? Sparkles;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => selectCategory(active ? "" : c.value)}
            className={buttonClass}
          >
            <span className={cardClass(active)}>
              <Icon className={iconClass} aria-hidden="true" />
            </span>
            <span className={labelClass(active)}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Lays out the marketplace: the unified filter bar, then the results. The
 * selected type lives here so the filter bar and the results stay in sync.
 * The search bar itself lives in the hero above this (see /services page).
 */
export function MarketplaceBrowse({
  filters,
  favoriteIds,
  isAuthenticated,
}: {
  filters: OfferingFilters;
  favoriteIds: string[];
  isAuthenticated: boolean;
}) {
  const [type, setType] = useState<OfferingType | null>(null);

  return (
    <>
      <FilterBar
        type={type}
        onTypeChange={setType}
        activeCategory={filters.category}
        where={filters.where}
        when={filters.when}
      />

      <OfferingsResults
        type={type}
        filters={filters}
        favoriteIds={favoriteIds}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
