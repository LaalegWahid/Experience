"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { emptyFormState, type FormState } from "@/shared/utils/form";
import { Toast } from "@/components/toast";
import { PhotoGallery } from "@/components/photo-gallery";
import { LocationCapture } from "@/components/location-capture";
import {
  CANCELLATION_POLICIES,
  CURRENCIES,
  LOCATION_TYPES,
  OFFERING_FORMATS,
  OFFERING_TYPES,
  PRICING_TYPES,
} from "@/shared/data/offerings";
import {
  OTHER_CATEGORY,
  SERVICE_CATEGORIES,
} from "@/shared/data/service-categories";
import { EXPERIENCE_CATEGORIES } from "@/shared/data/experience-categories";

export type ListingDefaults = Partial<{
  type: string;
  title: string;
  coverImageUrl: string;
  /** All listing photos, ordered. */
  photos: string[];
  /** Photos marked as covers (subset of `photos`). */
  coverPhotos: string[];
  description: string;
  category: string;
  subcategory: string;
  format: string;
  locationType: string;
  price: string;
  currency: string;
  pricingType: string;
  durationMinutes: string;
  capacity: string;
  bookingCutoffHours: string;
  qualifications: string;
  cancellationPolicy: string;
  includedItems: string;
  requirements: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  serviceAreaLabel: string;
  serviceAreaRadiusKm: string;
  serviceAreaLat: string;
  serviceAreaLng: string;
  serviceAreaMaxTravelMinutes: string;
}>;

/** Titles of the listing-detail steps, in order. Exported so an external
 *  stepper (the edit page) can label and navigate them. */
export const LISTING_STEP_TITLES = [
  "Basics",
  "Photo & category",
  "Pricing & capacity",
  "Where it happens",
  "Details & policy",
] as const;

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ListingDefaults;
  submitLabel: string;
  /** Render as a guided 5-step wizard (used for creating a listing). */
  stepped?: boolean;
  /**
   * Render only the form (active group + submit), with no built-in progress
   * bar or Back/Continue nav — an external stepper drives which group shows via
   * `currentStep`. Used by the edit page's unified stepper.
   */
  chromeless?: boolean;
  /** The group index to show when `chromeless`. */
  currentStep?: number;
  /** Buttons placed in the chromeless footer: Back on the left, Next beside the
   *  submit on the right. Lets an external stepper share one row with Save. */
  backSlot?: React.ReactNode;
  nextSlot?: React.ReactNode;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent dark:border-zinc-700 dark:focus:border-accent";
const labelClass =
  "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <span className="text-xs font-normal text-red-600 dark:text-red-400">
      {messages[0]}
    </span>
  );
}

export function ListingForm({
  action,
  defaults = {},
  submitLabel,
  stepped = false,
  chromeless = false,
  currentStep,
  backSlot,
  nextSlot,
}: Props) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const [type, setType] = useState(defaults.type ?? "experience");
  const [locationType, setLocationType] = useState(
    defaults.locationType ?? "at_host",
  );

  // Category options follow the chosen offering type. "Other" is offered as the
  // blank placeholder (stored empty in the DB), so drop its explicit entry.
  const categoryOptions = (
    type === "experience" ? EXPERIENCE_CATEGORIES : SERVICE_CATEGORIES
  ).filter((c) => c.value !== OTHER_CATEGORY);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const formRef = useRef<HTMLFormElement>(null);
  const errs = state.fieldErrors;

  // On a successful save, flash a top-left popup that auto-dismisses. `useActionState`
  // returns a fresh `state` object per submit, so visibility is derived (no setState
  // in the effect) by comparing against the last state we've dismissed.
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const showSaved = state.ok === true && state !== dismissed;
  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setDismissed(state), 2500);
    return () => clearTimeout(timer);
  }, [showSaved, state]);

  // Logical groups, reused by both the wizard and the flat (edit) layout.
  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: "Basics",
      body: (
        <>
          <fieldset className={labelClass}>
            <span>Offering type</span>
            <div className="flex gap-3">
              {OFFERING_TYPES.map((opt) => (
                <label
                  key={opt.value}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal text-foreground dark:border-zinc-700"
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={(e) => setType(e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className={labelClass}>
            Title
            <input
              name="title"
              required
              minLength={3}
              maxLength={160}
              defaultValue={defaults.title}
              placeholder="e.g. Sunrise rooftop yoga"
              className={inputClass}
            />
            <FieldError messages={errs?.title} />
          </label>

          <label className={labelClass}>
            Description
            <textarea
              name="description"
              rows={5}
              maxLength={5000}
              defaultValue={defaults.description}
              placeholder="What happens, who it's for, what makes it special."
              className={inputClass}
            />
            <FieldError messages={errs?.description} />
          </label>
        </>
      ),
    },
    {
      title: "Photo & category",
      body: (
        <>
          <div className={labelClass}>
            <span>Photos</span>
            <PhotoGallery
              defaultPhotos={defaults.photos}
              defaultCovers={defaults.coverPhotos}
            />
            <FieldError messages={errs?.coverImageUrl} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Category
              <select
                name="category"
                defaultValue={defaults.category ?? ""}
                className={inputClass}
              >
                <option value="">Other</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Subcategory
              <input
                name="subcategory"
                maxLength={120}
                defaultValue={defaults.subcategory}
                placeholder="e.g. Hatha yoga"
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Format
            <select
              name="format"
              defaultValue={defaults.format ?? "public_group"}
              className={inputClass}
            >
              {OFFERING_FORMATS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </>
      ),
    },
    {
      title: "Pricing & capacity",
      body: (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <label className={labelClass}>
              Price
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={defaults.price ?? "0"}
                className={inputClass}
              />
              <FieldError messages={errs?.price} />
            </label>
            <label className={labelClass}>
              Currency
              <select
                name="currency"
                defaultValue={defaults.currency ?? "USD"}
                className={inputClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldError messages={errs?.currency} />
            </label>
            <label className={labelClass}>
              Charged
              <select
                name="pricingType"
                defaultValue={defaults.pricingType ?? "per_person"}
                className={inputClass}
              >
                {PRICING_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <label className={labelClass}>
              Duration (minutes)
              <input
                name="durationMinutes"
                type="number"
                min={5}
                max={1440}
                required
                defaultValue={defaults.durationMinutes ?? "60"}
                className={inputClass}
              />
              <FieldError messages={errs?.durationMinutes} />
            </label>
            <label className={labelClass}>
              Capacity (guests)
              <input
                name="capacity"
                type="number"
                min={1}
                max={1000}
                required
                defaultValue={defaults.capacity ?? "1"}
                className={inputClass}
              />
              <FieldError messages={errs?.capacity} />
            </label>
            <label className={labelClass}>
              Booking cutoff (hours)
              <input
                name="bookingCutoffHours"
                type="number"
                min={0}
                max={720}
                defaultValue={defaults.bookingCutoffHours ?? "0"}
                className={inputClass}
              />
              <FieldError messages={errs?.bookingCutoffHours} />
            </label>
          </div>
        </>
      ),
    },
    {
      title: "Where it happens",
      body: (
        <>
          <label className={labelClass}>
            Location type
            <select
              name="locationType"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className={inputClass}
            >
              {LOCATION_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {locationType === "at_host" && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Address
                <input
                  name="addressLine1"
                  maxLength={200}
                  defaultValue={defaults.addressLine1}
                  placeholder="Street address"
                  className={inputClass}
                />
              </label>
              <input
                name="addressLine2"
                maxLength={200}
                defaultValue={defaults.addressLine2}
                placeholder="Apartment, suite, etc. (optional)"
                className={`${inputClass} sm:col-span-2`}
              />
              <label className={labelClass}>
                City
                <input
                  name="city"
                  maxLength={120}
                  defaultValue={defaults.city}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Region / state
                <input
                  name="region"
                  maxLength={120}
                  defaultValue={defaults.region}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Postal code
                <input
                  name="postalCode"
                  maxLength={40}
                  defaultValue={defaults.postalCode}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Country
                <input
                  name="country"
                  maxLength={120}
                  defaultValue={defaults.country}
                  className={inputClass}
                />
              </label>
            </div>
          )}

          {locationType === "at_guest" && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <label className={`${labelClass} sm:col-span-2`}>
                Service area
                <input
                  name="serviceAreaLabel"
                  maxLength={200}
                  defaultValue={defaults.serviceAreaLabel}
                  placeholder="e.g. Within central Lisbon"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Radius (km)
                <input
                  name="serviceAreaRadiusKm"
                  type="number"
                  min={0}
                  max={1000}
                  defaultValue={defaults.serviceAreaRadiusKm}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Max travel time
                <select
                  name="serviceAreaMaxTravelMinutes"
                  defaultValue={defaults.serviceAreaMaxTravelMinutes ?? "120"}
                  className={inputClass}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours (max)</option>
                </select>
              </label>
              <div className={`${labelClass} sm:col-span-3`}>
                <span>
                  Where you travel from{" "}
                  <span className="font-normal text-zinc-400">
                    (guests beyond your max travel time can&apos;t book)
                  </span>
                </span>
                <LocationCapture
                  latName="serviceAreaLat"
                  lngName="serviceAreaLng"
                  defaultLat={defaults.serviceAreaLat}
                  defaultLng={defaults.serviceAreaLng}
                />
              </div>
            </div>
          )}

          {locationType === "online" && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Online offerings don&apos;t need a location.
            </p>
          )}
        </>
      ),
    },
    {
      title: "Details & policy",
      body: (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              What&apos;s included{" "}
              <span className="font-normal text-zinc-400">(one per line)</span>
              <textarea
                name="includedItems"
                rows={4}
                defaultValue={defaults.includedItems}
                placeholder={"Mat & props\nTea afterwards"}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Requirements{" "}
              <span className="font-normal text-zinc-400">(one per line)</span>
              <textarea
                name="requirements"
                rows={4}
                defaultValue={defaults.requirements}
                placeholder={"Bring water\nArrive 10 minutes early"}
                className={inputClass}
              />
            </label>
          </div>
          <label className={labelClass}>
            Qualifications / standards
            <textarea
              name="qualifications"
              rows={3}
              maxLength={3000}
              defaultValue={defaults.qualifications}
              placeholder="Certifications, licenses, insurance, experience."
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Cancellation policy
            <select
              name="cancellationPolicy"
              defaultValue={defaults.cancellationPolicy ?? "flexible"}
              className={inputClass}
            >
              {CANCELLATION_POLICIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </>
      ),
    },
  ];

  // Success is confirmed by the top-left popup; only errors show inline.
  const messages = (
    <>
      {showSaved && (
        <Toast message="Changes saved" description="Your listing is up to date." />
      )}
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </>
  );

  // ---- Chromeless: one group at a time, navigation owned by a parent stepper.
  // All groups stay mounted so the whole form still submits together. ----
  if (chromeless) {
    const active = currentStep ?? 0;
    return (
      <form action={formAction} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={i === active ? "flex flex-col gap-5" : "hidden"}
            >
              {s.body}
            </div>
          ))}
        </div>
        {messages}
        <div className="flex items-center justify-between gap-3">
          {backSlot}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
            >
              {pending ? "Saving…" : submitLabel}
            </button>
            {nextSlot}
          </div>
        </div>
      </form>
    );
  }

  // ---- Flat layout (edit page): every group as its own card ----
  if (!stepped) {
    return (
      <form action={formAction} className="flex flex-col gap-6">
        {steps.map((s) => (
          <section
            key={s.title}
            className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {s.title}
            </h2>
            {s.body}
          </section>
        ))}
        {messages}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  // ---- Wizard layout (new page): one step at a time, with transitions ----
  const isLast = step === steps.length - 1;

  function goNext() {
    // Validate only the current (visible) step before advancing.
    const panel = formRef.current?.querySelector(`[data-step="${step}"]`);
    const fields = panel?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    setDir(1);
    setStep((s) => Math.min(steps.length - 1, s + 1));
  }

  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-3">
        <ol className="flex items-center">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center last:flex-none">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i <= step
                    ? "bg-accent text-accent-foreground"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded transition-colors ${
                    i < step ? "bg-accent" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Step {step + 1} of {steps.length} ·{" "}
          <span className="font-medium text-foreground">
            {steps[step].title}
          </span>
        </p>
      </div>

      {/* Steps — all mounted (so the whole form submits); only the active one
          shows, re-running its entrance animation each time it's revealed. */}
      <div className="rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800">
        {steps.map((s, i) => (
          <div
            key={s.title}
            data-step={i}
            className={
              i === step
                ? dir === 1
                  ? "flex flex-col gap-5 motion-safe:animate-[stepInRight_0.28s_ease]"
                  : "flex flex-col gap-5 motion-safe:animate-[stepInLeft_0.28s_ease]"
                : "hidden"
            }
          >
            {s.body}
          </div>
        ))}
      </div>

      {messages}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="submit"
            disabled={pending}
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}
