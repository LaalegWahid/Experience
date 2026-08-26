"use client";

import { useState, type ReactNode } from "react";
import {
  ListingForm,
  LISTING_STEP_TITLES,
  type ListingDefaults,
} from "../../_components/listing-form";
import type { FormState } from "@/shared/utils/form";

// Listing-detail groups + the two self-saving managers, as one ordered flow.
const TITLES = [...LISTING_STEP_TITLES, "Menu", "Weekly availability"];
const DETAIL_COUNT = LISTING_STEP_TITLES.length; // steps before the managers
const MENU_STEP = DETAIL_COUNT;
const AVAILABILITY_STEP = DETAIL_COUNT + 1;
const LAST = TITLES.length - 1;

const selectClass =
  "rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors duration-200 ease-out focus:border-accent dark:border-white/10";

/**
 * Unified editor for a listing: the detail form's groups, the menu, and the
 * weekly schedule are each a step. A select jumps straight to any step; Back /
 * Next walk through them. The detail form stays mounted across all steps so its
 * fields submit together when saved; the menu and availability managers save on
 * their own.
 */
export function ListingEditSteps({
  action,
  defaults,
  submitLabel,
  menu,
  availability,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ListingDefaults;
  submitLabel: string;
  menu: ReactNode;
  availability: ReactNode;
}) {
  const [step, setStep] = useState(0);

  const back = (
    <button
      type="button"
      onClick={() => setStep((s) => Math.max(0, s - 1))}
      disabled={step === 0}
      className="flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-50 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
    >
      Back
    </button>
  );

  const next = (
    <button
      type="button"
      onClick={() => setStep((s) => Math.min(LAST, s + 1))}
      disabled={step === LAST}
      className="flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
    >
      Next
    </button>
  );

  const onDetailStep = step < DETAIL_COUNT;

  return (
    <div className="flex flex-col gap-6">
      {/* Step navigator */}
      <div className="flex flex-col gap-3">
        <ol className="flex items-center">
          {TITLES.map((title, i) => (
            <li key={title} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                title={title}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ease-out ${
                  i <= step
                    ? "bg-accent text-accent-foreground"
                    : "bg-[#fff7f1] text-zinc-400 hover:bg-orange-100 dark:bg-white/10 dark:hover:bg-white/15"
                }`}
              >
                {i + 1}
              </button>
              {i < LAST && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded transition-colors ${
                    i < step ? "bg-accent" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Step {step + 1} of {TITLES.length}
          </p>
          <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            Jump to
            <select
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              aria-label="Jump to step"
              className={selectClass}
            >
              {TITLES.map((title, i) => (
                <option key={title} value={i}>
                  {i + 1}. {title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Panels — all mounted; only the active one shows. On detail steps the
          Back / Save changes / Next controls live in the form's own footer (so
          Save sits next to Next); the manager steps get their own Back / Next. */}
      <div className={onDetailStep ? undefined : "hidden"}>
        <ListingForm
          action={action}
          defaults={defaults}
          submitLabel={submitLabel}
          chromeless
          currentStep={Math.min(step, DETAIL_COUNT - 1)}
          backSlot={back}
          nextSlot={next}
        />
      </div>
      <div className={step === MENU_STEP ? undefined : "hidden"}>{menu}</div>
      <div className={step === AVAILABILITY_STEP ? undefined : "hidden"}>
        {availability}
      </div>

      {!onDetailStep && (
        <div className="flex items-center justify-between">
          {back}
          {next}
        </div>
      )}
    </div>
  );
}
