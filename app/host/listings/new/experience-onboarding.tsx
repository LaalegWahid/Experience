"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  EXPERIENCE_CATEGORIES,
  findExperienceCategory,
} from "@/shared/data/experience-categories";
import { CloseButton, ModalShell } from "./listing-wizard";
import { LocationSearchPanel } from "./location-search";
import { gathraLogo } from "@/shared/brand";

const TOTAL_STEPS = 4;

// Category-specific line icons, used until 3D PNGs are added to
// /public/experience-icons (a missing PNG falls back to these, never crashes).
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-1/2 w-1/2",
  "aria-hidden": true,
};

const FALLBACK_ICONS: Record<string, ReactNode> = {
  "Activities & tours": (
    <svg {...svgProps}>
      <path d="m3 20 5.5-8 3.5 5 2.5-3.5L21 20Z" />
      <circle cx="17.5" cy="7.5" r="1.5" />
    </svg>
  ),
  "Classes & workshops": (
    <svg {...svgProps}>
      <path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.1-2.5 1.5 1.5 0 0 1 1.1-2.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="12" cy="8" r="1" />
      <circle cx="16" cy="11" r="1" />
    </svg>
  ),
  Wellness: (
    <svg {...svgProps}>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </svg>
  ),
  "Food and drink": (
    <svg {...svgProps}>
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M2 11h20" />
      <path d="M8.5 7c-.5-.7-.5-1.6 0-2.5M12 7c-.5-.7-.5-1.6 0-2.5M15.5 7c-.5-.7-.5-1.6 0-2.5" />
    </svg>
  ),
  Other: (
    <svg {...svgProps}>
      <path d="M12 3v18M3 12h18" />
      <path d="m5.6 5.6 12.8 12.8M18.4 5.6 5.6 18.4" />
    </svg>
  ),
};

// Used when a category has no matching fallback (and its PNG is missing).
const DEFAULT_ICON = FALLBACK_ICONS.Other;

/**
 * Category icon: shows the 3D PNG from /public/experience-icons when present,
 * otherwise the clean category line icon above (never crashes / shows broken).
 */
function ExperienceIcon({
  src,
  fallback,
  className = "",
}: {
  src: string;
  fallback?: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-2xl bg-accent/10 text-accent ${className}`}
      >
        {fallback ?? DEFAULT_ICON}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`${className} object-contain`}
    />
  );
}

/** Preview card shown on the right of the later steps (matches Airbnb). */
function PreviewCard({
  category,
  city,
  tilt,
}: {
  category: string;
  city?: string;
  tilt?: boolean;
}) {
  const cat = findExperienceCategory(category);
  return (
    <div
      className={`flex aspect-[5/6] w-72 flex-col rounded-3xl border border-zinc-200 bg-background p-6 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:shadow-none ${
        tilt ? "rotate-2" : ""
      }`}
    >
      <div className="flex flex-1 items-center justify-center">
        {cat && (
          <ExperienceIcon
            src={cat.icon}
            fallback={FALLBACK_ICONS[cat.value]}
            className="h-28 w-28"
          />
        )}
      </div>
      <span className="text-2xl font-bold leading-tight text-foreground">
        {cat?.label ?? category}
      </span>
      {city && (
        <span className="mt-1 text-zinc-500 dark:text-zinc-400">{city}</span>
      )}
    </div>
  );
}

/**
 * Experience onboarding (existing host): pick a category, sub-type and city,
 * then jump into the listing wizard in experience mode. Mirrors the service
 * "become a host" flow but tailored to experiences.
 */
export function ExperienceOnboarding({
  defaultCity = "",
}: {
  defaultCity?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [subtype, setSubtype] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const cat = findExperienceCategory(category);

  function back() {
    if (step === 0) {
      router.push("/host/listings/new");
      return;
    }
    // Mirror the forward skip: categories without sub-types have no step 1.
    if (step === 2 && (cat?.subtypes.length ?? 0) === 0) {
      setStep(0);
      return;
    }
    setStep((s) => s - 1);
  }

  function finish() {
    const params = new URLSearchParams({ type: "experience", category, city });
    if (subtype) params.set("subcategory", subtype);
    router.push(`/host/listings/new?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Image
          src={gathraLogo}
          alt="Gathra"
          priority
          className="h-8 w-auto sm:h-10"
        />
        <button
          type="button"
          onClick={back}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Back
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        {/* Step 0 — category */}
        {step === 0 && (
          <div className="flex w-full max-w-6xl flex-col self-stretch">
            <h1 className="mx-auto mt-[7vh] max-w-2xl text-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              What experience will you offer guests?
            </h1>
            <div className="mt-[13vh] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {EXPERIENCE_CATEGORIES.map((c) => {
                const selected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCategory(c.value);
                      setSubtype("");
                      // Categories without sub-types (e.g. "Other") skip that step.
                      setStep(c.subtypes.length > 0 ? 1 : 2);
                    }}
                    className={`flex aspect-[15/16] flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                      selected
                        ? "border-foreground shadow-md ring-1 ring-foreground"
                        : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg dark:border-zinc-800 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className="flex flex-1 items-center justify-center">
                      <ExperienceIcon
                        src={c.icon}
                        fallback={FALLBACK_ICONS[c.value]}
                        className="h-24 w-24"
                      />
                    </span>
                    <span className="pb-2 text-[15px] font-semibold leading-tight text-foreground">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 — sub-type */}
        {step === 1 && cat && (
          <div className="flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-2xl">
              <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                How would you describe your experience?
              </h1>
              <div className="mt-10 grid grid-cols-2 gap-3">
                {cat.subtypes.map((s) => {
                  const selected = subtype === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubtype(s)}
                      className={`rounded-xl border px-5 py-4 text-center text-[15px] font-medium text-foreground transition-colors ${
                        selected
                          ? "border-foreground ring-1 ring-foreground"
                          : "border-zinc-300 hover:border-foreground dark:border-zinc-700"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="hidden shrink-0 lg:block">
              <PreviewCard category={category} />
            </div>
          </div>
        )}

        {/* Step 2 — city */}
        {step === 2 && (
          <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Where will you offer your experience?
              </h1>
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-zinc-300 px-4 py-4 text-left transition-colors hover:border-foreground dark:border-zinc-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className={`text-base ${city ? "text-foreground" : "text-zinc-400"}`}>
                  {city || "Enter a city"}
                </span>
              </button>
            </div>
            <div className="hidden justify-end lg:flex">
              <PreviewCard category={category} />
            </div>
          </div>
        )}

        {/* Step 3 — intro */}
        {step === 3 && (
          <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Create your listing
              </h1>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tell us about yourself and the experience you offer. Our team
                will review it to confirm it meets our requirements.
              </p>
            </div>
            <div className="hidden justify-end lg:flex">
              <PreviewCard category={category} city={city} tilt />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {step > 0 && (
        <div className="flex items-center justify-between px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-10">
          <button
            type="button"
            onClick={back}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back
          </button>
          {step === 1 && (
            <PrimaryButton disabled={!subtype} onClick={() => setStep(2)}>
              Next
            </PrimaryButton>
          )}
          {step === 2 && (
            <PrimaryButton disabled={!city.trim()} onClick={() => setStep(3)}>
              Next
            </PrimaryButton>
          )}
          {step === 3 && (
            <PrimaryButton disabled={false} onClick={finish}>
              Get started
            </PrimaryButton>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* City search modal */}
      {cityModalOpen && (
        <ModalShell onClose={() => setCityModalOpen(false)} size="lg">
          <div className="flex items-center justify-between p-5">
            <span className="w-8" />
            <h2 className="text-lg font-semibold text-foreground">Enter a city</h2>
            <CloseButton onClick={() => setCityModalOpen(false)} />
          </div>
          <div className="min-h-[280px] px-6 pb-6">
            <LocationSearchPanel
              placeholder="Search for cities"
              showCurrentLocation
              autoFocus
              cityMode
              onSelect={(p) => {
                setCity(p.city || p.label);
                setCityModalOpen(false);
              }}
            />
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
