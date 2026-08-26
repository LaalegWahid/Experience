"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { SERVICE_CATEGORIES, OTHER_CATEGORY } from "@/shared/data/service-categories";
import { EXPERIENCE_CATEGORIES } from "@/shared/data/experience-categories";

// Custom illustrated images for the category popup (public/category_images),
// replacing each category's default host-onboarding icon. "Other" is shared
// between the two lists (same stored value) but gets a different image
// depending on which group it's shown under.
const CATEGORY_IMAGE: Record<string, string> = {
  Catering: "/category_images/catering.png",
  Chef: "/category_images/chef.png",
  "Hair styling": "/category_images/hair-styling.png",
  Makeup: "/category_images/makeup.png",
  Massage: "/category_images/massage.png",
  "Personal training": "/category_images/personal-training.png",
  Photography: "/category_images/photography.png",
  "Prepared meals": "/category_images/prepared-meals.png",
  "Spa treatments": "/category_images/spa-treatments.png",
  "Art and design": "/category_images/art-design.png",
  "Fitness and wellness": "/category_images/fitness-wellness.png",
  "Food and drink": "/category_images/food-drink.png",
  "History and culture": "/category_images/history-culture.png",
  "Nature and outdoors": "/category_images/nature-outdoors.png",
};

function categoryImage(value: string, kind: "service" | "experience"): string {
  if (value === OTHER_CATEGORY) {
    return kind === "service"
      ? "/category_images/other-service.png"
      : "/category_images/other-experience.png";
  }
  return CATEGORY_IMAGE[value];
}

type Props = {
  open: boolean;
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/**
 * Full-page category picker (same visual pattern as the auth modal) —
 * Services / Experiences tabs, each a grid of illustrated category tiles.
 * Portaled to document.body so it always covers the true viewport, not just
 * whatever ancestor box it's rendered inside.
 */
export function CategoryPickerModal({ open, selected, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<"service" | "experience">("service");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tileClass = (value: string) =>
    `group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-50 dark:hover:bg-white/5 ${
      selected === value ? "bg-accent/10 ring-2 ring-accent" : ""
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-[#fff7f1] shadow-2xl [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-[#1e1a15] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — friendly sketch accent + close affordance, echoing the
            homepage's hand-drawn illustration system. */}
        <div className="relative flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              What are you in the mood for?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pick a category to get started.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG sketch, not an optimizable photo */}
          <img
            src="/Marketing_assets/browse-sketch.svg"
            alt=""
            aria-hidden="true"
            className="h-16 w-16 shrink-0 -scale-x-100 opacity-90 sm:h-20 sm:w-20"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Tab switcher between the two category groups. */}
          <div className="mb-5 flex gap-2 rounded-full bg-black/5 p-1 dark:bg-white/10">
            <button
              type="button"
              onClick={() => setTab("service")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all duration-200 ease-out ${
                tab === "service"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => setTab("experience")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all duration-200 ease-out ${
                tab === "experience"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              Experiences
            </button>
          </div>

          {tab === "service" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SERVICE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onSelect(c.value)}
                  className={tileClass(c.value)}
                >
                  <Image
                    src={categoryImage(c.value, "service")}
                    alt=""
                    width={224}
                    height={224}
                    className="aspect-square w-full rounded-2xl object-cover shadow-sm transition-shadow duration-200 ease-out group-hover:shadow-md"
                  />
                  <span className="text-sm font-medium leading-tight text-foreground">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {EXPERIENCE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onSelect(c.value)}
                  className={tileClass(c.value)}
                >
                  <Image
                    src={categoryImage(c.value, "experience")}
                    alt=""
                    width={224}
                    height={224}
                    className="aspect-square w-full rounded-2xl object-cover shadow-sm transition-shadow duration-200 ease-out group-hover:shadow-md"
                  />
                  <span className="text-sm font-medium leading-tight text-foreground">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
