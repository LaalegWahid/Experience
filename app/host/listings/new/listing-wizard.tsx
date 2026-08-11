"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  findServiceCategory,
  SERVICE_CATEGORIES,
} from "@/shared/data/service-categories";
import {
  getServiceTypeOptions,
  roleNoun,
  suggestedTitles,
} from "@/shared/data/service-types";
import {
  createListingDraft,
  saveWizardPayout,
  type WizardPayoutInput,
} from "./wizard-actions";
import type { ListingDraftInput } from "./wizard-types";
import { generateListingCopy } from "./ai-actions";
import { DiscountModal, DiscountRow } from "./discount-modal";
import { ServiceAreaMap } from "./service-area-map";
import { PAYOUT_CHAINS, STABLECOINS } from "@/shared/data/payouts";
import { CANCELLATION_POLICIES } from "@/shared/data/offerings";
import { gathraLogo } from "@/shared/brand";
import {
  isLowResolution,
  MIN_PHOTO_PX,
  readDimensions,
  type StagedPhoto,
} from "@/shared/utils/image";
import type { WizardOffering, WizardSnapshot } from "./wizard-types";

export type WizardPayoutDefaults = Partial<{
  type: "bank" | "crypto";
  accountHolderName: string;
  iban: string;
  bic: string;
  bankName: string;
  country: string;
  chain: string;
  stablecoin: string;
  walletAddress: string;
}>;


/** Most photos a host can mark as cover images. */
const MAX_COVERS = 5;

const PANES = [
  { key: "category", step: 1 },
  { key: "qualifications", step: 2 },
  { key: "experience", step: 2 },
  { key: "profiles", step: 2 },
  { key: "address", step: 2 },
  { key: "location", step: 3 },
  { key: "photos", step: 4 },
  { key: "offerings-intro", step: 5 },
  { key: "offerings", step: 5 },
  { key: "hours", step: 5 },
  { key: "discounts", step: 5 },
  { key: "legal", step: 6 },
  { key: "cancellation", step: 6 },
  { key: "service-intro", step: 7 },
  { key: "service-title", step: 7 },
  { key: "payout", step: 8 },
  { key: "review", step: 8 },
] as const;

type PaneKey = (typeof PANES)[number]["key"];

const STEP_LABELS = [
  "Category",
  "About you",
  "Location",
  "Photos",
  "Offerings",
  "Details",
  "Service",
  "Payout",
];

const STEP_ICONS = [
  "tag",
  "person",
  "pin",
  "image",
  "list",
  "clipboard",
  "timer",
  "wallet",
] as const;

const WEEKDAYS = [
  { n: 7, label: "Sunday" },
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
];

const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

export const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-foreground dark:border-zinc-700 dark:focus:border-zinc-200";

type Block = { days: number[]; from: string; to: string };

export async function uploadFile(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/host/upload", { method: "POST", body: form });
    const data = (await res.json()) as { url?: string };
    return res.ok ? (data.url ?? null) : null;
  } catch {
    return null;
  }
}

export function ListingWizard({
  type,
  category: initialCategory,
  city,
  displayName,
  initialState = null,
  initialDraftId = null,
  payoutDefaults = {},
}: {
  type: "service" | "experience";
  category: string;
  city: string;
  displayName: string;
  /** When resuming an in-progress draft, the saved wizard snapshot from the DB. */
  initialState?: WizardSnapshot | null;
  initialDraftId?: string | null;
  /** The provider's existing payout method, prefilled into the payout step. */
  payoutDefaults?: WizardPayoutDefaults;
}) {
  const router = useRouter();
  // Category is editable in the first wizard pane; seed it from the prop (set by
  // become-a-host onboarding) but let the host change it here.
  const [category, setCategory] = useState(initialCategory);
  const cat = findServiceCategory(category);
  const [index, setIndex] = useState(0);
  const pane = PANES[index].key;
  const step = PANES[index].step;
  // The DB id once this draft has been saved (via "Save and exit" or submit),
  // so later saves update the same listing instead of creating duplicates.
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 — About you
  const [years, setYears] = useState(3);
  const [experience, setExperience] = useState("");
  const [degree, setDegree] = useState("");
  const [career, setCareer] = useState("");
  const [profiles, setProfiles] = useState<string[]>([]);
  const [country, setCountry] = useState("Morocco");
  const [apt, setApt] = useState("");
  const [street, setStreet] = useState("");
  const [addrCity, setAddrCity] = useState(city);
  const [postal, setPostal] = useState("");
  const [asBusiness, setAsBusiness] = useState<boolean | null>(null);

  // Step 2 — Location
  const [travels, setTravels] = useState(false);
  const [comeTo, setComeTo] = useState(false);
  const [startLocation, setStartLocation] = useState(city);
  const [driveMinutes, setDriveMinutes] = useState(60);

  // Step 3 — Photos
  const [photos, setPhotos] = useState<string[]>([]);
  // Cover photos (URLs, a subset of `photos`). Hosts mark up to MAX_COVERS.
  const [covers, setCovers] = useState<string[]>([]);

  // Keep covers valid as photos change: drop removed photos, and default to the
  // first photo so there's always at least one cover.
  useEffect(() => {
    setCovers((prev) => {
      const valid = prev.filter((u) => photos.includes(u));
      if (valid.length === 0 && photos.length > 0) return [photos[0]];
      return valid.length === prev.length ? prev : valid;
    });
  }, [photos]);

  function toggleCover(url: string) {
    setCovers((prev) => {
      if (prev.includes(url)) {
        // Keep at least one cover.
        return prev.length > 1 ? prev.filter((u) => u !== url) : prev;
      }
      return prev.length < MAX_COVERS ? [...prev, url] : prev;
    });
  }

  // Step 4 — Offerings / hours / discounts
  const [offers, setOffers] = useState<WizardOffering[]>([]);
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [hours, setHours] = useState<Block[]>([
    { days: [1, 2, 3, 4, 5], from: "09:00", to: "17:00" },
  ]);
  const [limitedTime, setLimitedTime] = useState(false);
  const [earlyBird, setEarlyBird] = useState(false);
  // Host-chosen discount amounts (default to our suggestions, but editable).
  const [limitedTimePercent, setLimitedTimePercent] = useState(10);
  const [earlyBirdPercent, setEarlyBirdPercent] = useState(20);
  const [discountOpen, setDiscountOpen] = useState<
    null | "limitedTime" | "earlyBird"
  >(null);

  // Step 5 — legal
  const [transporting, setTransporting] = useState<boolean | null>(null);
  const [cancellationPolicy, setCancellationPolicy] = useState<
    "flexible" | "moderate" | "strict"
  >("flexible");

  // Step 7 — Payout
  const [payoutType, setPayoutType] = useState<"bank" | "crypto">(
    payoutDefaults.type ?? "bank",
  );
  const [holderName, setHolderName] = useState(
    payoutDefaults.accountHolderName ?? "",
  );
  const [iban, setIban] = useState(payoutDefaults.iban ?? "");
  const [bic, setBic] = useState(payoutDefaults.bic ?? "");
  const [bankName, setBankName] = useState(payoutDefaults.bankName ?? "");
  const [payoutCountry, setPayoutCountry] = useState(
    payoutDefaults.country ?? "",
  );
  const [chain, setChain] = useState(payoutDefaults.chain ?? "ethereum");
  const [stablecoin, setStablecoin] = useState(
    payoutDefaults.stablecoin ?? "USDC",
  );
  const [walletAddress, setWalletAddress] = useState(
    payoutDefaults.walletAddress ?? "",
  );

  const payoutValid =
    payoutType === "bank"
      ? holderName.trim().length >= 2 && iban.trim().length > 0
      : walletAddress.trim().length > 0;

  function payoutInput(): WizardPayoutInput {
    return payoutType === "bank"
      ? {
          type: "bank",
          accountHolderName: holderName,
          iban,
          bic,
          bankName,
          country: payoutCountry,
        }
      : { type: "crypto", chain, stablecoin, walletAddress };
  }

  // Step 6 — Service title + description
  const titleOptions = useMemo(
    () => suggestedTitles(category, displayName),
    [category, displayName],
  );
  const defaultDescription = useMemo(
    () => `Experienced ${roleNoun(category)} in ${city || "your area"}.`,
    [category, city],
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const titleCards = aiTitles.length ? aiTitles : titleOptions;

  // ── Resume in-progress drafts ──────────────────────────────────────────
  // The whole wizard lives client-side until submit, so we snapshot the state
  // to localStorage and restore it when the host reopens this page. Keyed by
  // type + category so different drafts don't collide.
  const storageKey = `lw-draft:${type}:${initialCategory}`;
  const restored = useRef(false);

  function snapshot(): WizardSnapshot {
    return {
      draftId,
      index,
      category,
      years,
      experience,
      degree,
      career,
      profiles,
      country,
      apt,
      street,
      addrCity,
      postal,
      asBusiness,
      travels,
      comeTo,
      startLocation,
      driveMinutes,
      photos,
      covers,
      offers,
      currency,
      hours,
      limitedTime,
      earlyBird,
      limitedTimePercent,
      earlyBirdPercent,
      transporting,
      cancellationPolicy,
      title,
      description,
    };
  }

  function hydrate(s: WizardSnapshot) {
    if (typeof s.draftId === "string") setDraftId(s.draftId);
    if (typeof s.index === "number") setIndex(s.index);
    if (typeof s.category === "string") setCategory(s.category);
    if (typeof s.years === "number") setYears(s.years);
    if (typeof s.experience === "string") setExperience(s.experience);
    if (typeof s.degree === "string") setDegree(s.degree);
    if (typeof s.career === "string") setCareer(s.career);
    if (Array.isArray(s.profiles)) setProfiles(s.profiles);
    if (typeof s.country === "string") setCountry(s.country);
    if (typeof s.apt === "string") setApt(s.apt);
    if (typeof s.street === "string") setStreet(s.street);
    if (typeof s.addrCity === "string") setAddrCity(s.addrCity);
    if (typeof s.postal === "string") setPostal(s.postal);
    if (typeof s.asBusiness === "boolean") setAsBusiness(s.asBusiness);
    if (typeof s.travels === "boolean") setTravels(s.travels);
    if (typeof s.comeTo === "boolean") setComeTo(s.comeTo);
    if (typeof s.startLocation === "string") setStartLocation(s.startLocation);
    if (typeof s.driveMinutes === "number") setDriveMinutes(s.driveMinutes);
    if (Array.isArray(s.photos)) setPhotos(s.photos);
    if (Array.isArray(s.covers)) setCovers(s.covers);
    if (Array.isArray(s.offers)) setOffers(s.offers);
    if (s.currency === "USD" || s.currency === "EUR") setCurrency(s.currency);
    if (Array.isArray(s.hours)) setHours(s.hours);
    if (typeof s.limitedTime === "boolean") setLimitedTime(s.limitedTime);
    if (typeof s.earlyBird === "boolean") setEarlyBird(s.earlyBird);
    if (typeof s.limitedTimePercent === "number")
      setLimitedTimePercent(s.limitedTimePercent);
    if (typeof s.earlyBirdPercent === "number")
      setEarlyBirdPercent(s.earlyBirdPercent);
    if (typeof s.transporting === "boolean") setTransporting(s.transporting);
    if (s.cancellationPolicy === "flexible" || s.cancellationPolicy === "moderate" || s.cancellationPolicy === "strict")
      setCancellationPolicy(s.cancellationPolicy);
    if (typeof s.title === "string") setTitle(s.title);
    if (typeof s.description === "string") setDescription(s.description);
  }

  useEffect(() => {
    // A DB-backed draft (opened from the dashboard) wins over any local copy so
    // resume is reliable across devices; otherwise fall back to localStorage.
    if (initialState) {
      hydrate(initialState);
      if (initialDraftId) setDraftId(initialDraftId);
    } else {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) hydrate(JSON.parse(raw));
      } catch {
        // Ignore corrupt/unavailable storage — just start fresh.
      }
    }
    restored.current = true;
    // Only run on mount (per draft key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot()));
    } catch {
      // Storage full/unavailable — non-fatal, the draft just won't persist.
    }
  }, [
    storageKey,
    draftId,
    index,
    category,
    years,
    experience,
    degree,
    career,
    profiles,
    country,
    apt,
    street,
    addrCity,
    postal,
    asBusiness,
    travels,
    comeTo,
    startLocation,
    driveMinutes,
    photos,
    covers,
    offers,
    currency,
    hours,
    limitedTime,
    earlyBird,
    limitedTimePercent,
    earlyBirdPercent,
    transporting,
    cancellationPolicy,
    title,
    description,
  ]);

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  async function runAi() {
    setAiBusy(true);
    setAiError(null);
    const res = await generateListingCopy({
      category,
      type,
      role: roleNoun(category),
      years,
      city,
      typeOfService: offers[0]?.typeOfService,
      offerings: offers.map((o) => o.name),
      experience,
      degree,
    });
    setAiBusy(false);
    if (res.error) {
      setAiError(res.error);
      return;
    }
    if (res.titles?.length) {
      setAiTitles(res.titles);
      setTitle(res.titles[0]);
    }
    if (res.description) setDescription(res.description);
  }

  // Modals
  const [editing, setEditing] = useState<null | {
    field: "experience" | "degree" | "career";
  }>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState<null | { index: number | null }>(
    null,
  );
  const [hoursOpen, setHoursOpen] = useState<null | { index: number | null }>(
    null,
  );
  const [titleEditOpen, setTitleEditOpen] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReview = pane === "review";

  const nextDisabled =
    (pane === "category" && !category) ||
    (pane === "location" && !travels && !comeTo) ||
    (pane === "photos" && photos.length < 1) ||
    (pane === "offerings" && offers.length < 1) ||
    (pane === "legal" && transporting === null) ||
    (pane === "payout" && !payoutValid);

  function back() {
    if (index === 0) {
      router.push("/host");
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    // Leaving the "Add a title and description" intro auto-generates AI copy so
    // the next pane (the title choices) is already filled in.
    if (pane === "service-intro" && aiTitles.length === 0 && !aiBusy) {
      void runAi();
    }
    setIndex((i) => Math.min(PANES.length - 1, i + 1));
  }

  function buildInput(): ListingDraftInput {
    return {
      type,
      category,
      title: title || titleCards[0],
      description: description || defaultDescription,
      yearsOfExperience: years,
      experience,
      degree,
      careerHighlight: career,
      onlineProfiles: profiles,
      residentialAddress: {
        country,
        line: apt,
        street,
        city: addrCity,
        postalCode: postal,
      },
      hostingAsBusiness: asBusiness ?? undefined,
      travelsToGuests: travels,
      guestsComeToHost: comeTo,
      startingLocation: startLocation,
      driveTimeMinutes: travels ? driveMinutes : undefined,
      city,
      currency,
      photos,
      coverPhotos: covers,
      offerings: offers,
      businessHours: hours,
      discounts: {
        limitedTime,
        earlyBird,
        limitedTimePercent: limitedTime ? limitedTimePercent : undefined,
        earlyBirdPercent: earlyBird ? earlyBirdPercent : undefined,
      },
      transportingGuests: transporting ?? undefined,
      cancellationPolicy,
    };
  }

  // "Save and exit": persist the current progress as an in-progress draft so it
  // shows under "Your listings", then leave.
  async function saveAndExit() {
    setSaving(true);
    setError(null);
    const res = await createListingDraft(
      { ...buildInput(), draftState: snapshot() },
      {
        offeringId: draftId ?? undefined,
        inProgress: true,
      },
    );
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    // Keep the local draft (so reopening resumes the wizard) and remember the
    // saved listing's id so the next save updates the same row, not a new one.
    if (res.offeringId) {
      setDraftId(res.offeringId);
      try {
        const raw = localStorage.getItem(storageKey);
        const snap = raw ? JSON.parse(raw) : {};
        snap.draftId = res.offeringId;
        localStorage.setItem(storageKey, JSON.stringify(snap));
      } catch {
        // ignore
      }
    }
    router.push("/host");
  }

  async function submit() {
    setError(null);
    setPending(true);
    // Save the payout method first, then create + publish the listing.
    const payoutRes = await saveWizardPayout(payoutInput());
    if (payoutRes.error) {
      setError(payoutRes.error);
      setPending(false);
      return;
    }
    const res = await createListingDraft(buildInput(), {
      offeringId: draftId ?? undefined,
      publish: true,
    });
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
    // The draft is now a published listing — drop the saved progress.
    clearDraft();
    router.push("/host");
  }

  // ----- Review (dark, full-bleed) -----
  if (isReview) {
    return (
      <div className="fixed inset-0 z-[55] overflow-y-auto bg-[#0b0b0d] text-zinc-100">
        <ReviewPane
          back={back}
          coverImage={photos[0]}
          title={title || titleCards[0]}
          rows={[
            {
              label: "Category",
              value: cat?.label ?? (category || "—"),
              icon: "tag",
            },
            { label: "About you", value: "Your qualifications", icon: "person" },
            {
              label: "Location",
              value: travels
                ? `Within a ${Math.round(driveMinutes / 60)}h drive of ${startLocation || city}`
                : `Guests come to ${addrCity || city}`,
              icon: "pin",
            },
            { label: "Photos", value: `${photos.length} photos`, icon: "image" },
            {
              label: "Offerings",
              value: offers[0]?.name ?? "—",
              icon: "list",
            },
            {
              label: "Details",
              value: transporting ? "Transportation" : "No transport",
              icon: "clipboard",
            },
            {
              label: "Service",
              value: title || titleCards[0],
              icon: "timer",
            },
            {
              label: "Payout",
              value:
                payoutType === "bank"
                  ? `Bank · ${iban ? `…${iban.replace(/\s/g, "").slice(-4)}` : "RIB / IBAN"}`
                  : `Crypto · ${stablecoin} on ${chain}`,
              icon: "wallet",
            },
          ]}
          pending={pending}
          error={error}
          onPublish={submit}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[55] flex bg-[#0b0b0d]">
      {/* Left rail */}
      <aside className="hidden w-20 shrink-0 flex-col items-center py-5 sm:flex">
        <Image
          src={gathraLogo}
          alt="Gathra"
          priority
          className="h-10 w-10 object-contain"
        />
        <div className="mt-10 flex flex-1 flex-col items-center gap-4">
          {STEP_ICONS.map(
            (ic, i) => {
              const s = i + 1;
              const active = step === s;
              const done = step > s;
              return (
                <span
                  key={ic}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "bg-white text-zinc-900"
                      : done
                        ? "text-accent"
                        : "text-zinc-500"
                  }`}
                >
                  <StepIcon name={ic} />
                </span>
              );
            },
          )}
        </div>
      </aside>

      {/* Inset white panel */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background sm:my-3 sm:mr-3 sm:rounded-3xl">
        <header className="relative flex items-center px-5 py-4 sm:px-8">
          <p className="absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-center text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-foreground">{STEP_LABELS[step - 1]}</span>{" "}
            Step {step} of {STEP_LABELS.length}
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearDraft();
                window.location.reload();
              }}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-foreground max-sm:hidden"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={saveAndExit}
              disabled={saving}
              className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900 sm:px-4"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <span className="max-sm:hidden">Save and exit</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-6 sm:px-8">
          {/* ---------------- STEP 1 ---------------- */}
          {pane === "category" && (
            <Centered wide>
              <Heading center big title="What kind of service do you offer?" />
              <Sub center>Pick the category that fits best.</Sub>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {SERVICE_CATEGORIES.map((c) => {
                  const selected = category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all ${
                        selected
                          ? "border-foreground ring-1 ring-foreground"
                          : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                      }`}
                    >
                      <Image
                        src={c.icon}
                        alt=""
                        width={64}
                        height={64}
                        className="h-14 w-14 object-contain"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Centered>
          )}

          {pane === "qualifications" && (
            <Centered>
              <Avatar name={displayName} />
              <Heading center title="Share your qualifications" />
              <Sub center>Help guests get to know you.</Sub>
              <div className="mt-8 flex flex-col gap-3">
                <RowButton
                  icon="trophy"
                  title="Experience"
                  value={experience || "Add your most notable job"}
                  filled={Boolean(experience)}
                  onClick={() => setEditing({ field: "experience" })}
                />
                <RowButton
                  icon="cap"
                  title="Degree"
                  value={degree || "Add your degree or training"}
                  filled={Boolean(degree)}
                  onClick={() => setEditing({ field: "degree" })}
                />
                <RowButton
                  icon="star"
                  title="Career highlight"
                  value={career || "Add any honors or media features"}
                  filled={Boolean(career)}
                  onClick={() => setEditing({ field: "career" })}
                />
              </div>
            </Centered>
          )}

          {pane === "experience" && (
            <Centered>
              <Heading center title={`How many years have you been a ${roleNoun(category)}?`} />
              <div className="mt-12 flex items-center justify-center gap-8">
                <Stepper value={years} setValue={(v) => setYears(Math.max(0, v))} />
              </div>
            </Centered>
          )}

          {pane === "profiles" && (
            <Centered>
              <Heading center title="Add your online profiles" />
              {/* App-tile stack: white rounded cards with soft shadows, middle
                  one upright and in front, outer two tilted behind. */}
              <div className="group mt-6 mb-6 flex items-center justify-center">
                <div className="-mr-5 flex h-28 w-28 rotate-[-10deg] items-center justify-center rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5 transition-transform duration-200 ease-out group-hover:-translate-x-3 group-hover:-translate-y-1 group-hover:-rotate-[16deg]">
                  <Image src="/competitors_logos/instagram.png" alt="Instagram" width={80} height={80} className="h-full w-full scale-125 object-contain" />
                </div>
                <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[28px] bg-white p-4 shadow-xl ring-1 ring-black/5 transition-transform duration-200 ease-out group-hover:-translate-y-2">
                  <Image src="/competitors_logos/facebook.png" alt="Facebook" width={80} height={80} className="h-full w-full object-contain" />
                </div>
                <div className="-ml-5 flex h-28 w-28 rotate-[10deg] items-center justify-center rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5 transition-transform duration-200 ease-out group-hover:translate-x-3 group-hover:-translate-y-1 group-hover:rotate-[16deg]">
                  <Image src="/competitors_logos/web.png" alt="Website" width={80} height={80} className="h-full w-full object-contain" />
                </div>
              </div>
              <Sub center>
                To help us confirm your skills, add links to your reviews, any
                press you&apos;ve received, and your professional website. Guests
                won&apos;t see these.
              </Sub>
              <div className="mt-8 flex flex-col items-center gap-3">
                {profiles.map((p, i) => (
                  <div
                    key={i}
                    className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800"
                  >
                    <ProfileIcon url={p} />
                    <span className="flex-1 truncate text-sm text-foreground">{p}</span>
                    <button
                      type="button"
                      onClick={() => setProfiles((a) => a.filter((_, j) => j !== i))}
                      className="text-xs text-zinc-500 hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setLinkOpen(true)}
                  className="w-full rounded-2xl bg-zinc-100 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  {profiles.length ? "Add another link" : "Add profile"}
                </button>
              </div>
            </Centered>
          )}

          {pane === "address" && (
            <Centered wide>
              <Heading center title="Let us know a bit more about you" />
              <Sub center>
                This is required to comply with financial regulations and helps us
                prevent fraud.
              </Sub>
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-foreground">
                  What&apos;s your residential address?
                </h3>
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Guests won&apos;t see this information.
                </p>
                <div className="overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
                  <FramedInput label="Country / region" value={country} onChange={setCountry} />
                  <FramedInput label="Apt, floor, etc. (if applicable)" value={apt} onChange={setApt} />
                  <FramedInput label="Street address" value={street} onChange={setStreet} />
                  <FramedInput label="City / town" value={addrCity} onChange={setAddrCity} />
                  <FramedInput label="Postal code" value={postal} onChange={setPostal} last />
                </div>
                <h3 className="mt-8 text-sm font-semibold text-foreground">
                  Are you hosting as a business?
                </h3>
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  This means your business is most likely registered with your
                  government.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton selected={asBusiness === true} onClick={() => setAsBusiness(true)}>Yes</ChoiceButton>
                  <ChoiceButton selected={asBusiness === false} onClick={() => setAsBusiness(false)}>No</ChoiceButton>
                </div>
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {pane === "location" && (
            <Centered>
              <Heading center big title="Where do you provide your service?" />
              <Sub center>Choose one or both.</Sub>
              <div className="mt-10 flex flex-col gap-4">
                <SelectableCard
                  selected={travels}
                  onClick={() => {
                    setTravels((v) => !v);
                    if (!travels) setAreaOpen(true);
                  }}
                  title="You travel to guests"
                  subtitle={
                    travels
                      ? `${startLocation || city} · within ${formatDrive(driveMinutes)}`
                      : "Set your service area"
                  }
                />
                <SelectableCard
                  selected={comeTo}
                  onClick={() => setComeTo((v) => !v)}
                  title="Guests come to you"
                  subtitle={comeTo ? `${addrCity || city}` : "Add a meeting place"}
                />
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {pane === "photos" && (
            <Centered>
              <Heading center big title="Add photos that showcase your skills" />
              <Sub center>
                Add at least 5 photos. Tap up to {MAX_COVERS} to feature as
                covers.
              </Sub>
              {photos.length === 0 ? (
                <div className="mt-10 flex flex-col items-center">
                  <div className="flex h-44 items-center justify-center text-zinc-300">
                    <ImageIcon big />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="mt-4 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {(() => {
                        const isCover = covers.includes(url);
                        const atMax = covers.length >= MAX_COVERS;
                        return (
                          <button
                            type="button"
                            onClick={() => toggleCover(url)}
                            disabled={!isCover && atMax}
                            aria-pressed={isCover}
                            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium shadow transition-colors ${
                              isCover
                                ? "bg-foreground text-background"
                                : "bg-white/90 text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            }`}
                          >
                            {isCover ? "Cover" : "+ Cover"}
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setPhotos((a) => a.filter((_, j) => j !== i))}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-foreground hover:text-foreground dark:border-zinc-700"
                  >
                    <PlusIcon />
                  </button>
                </div>
              )}
            </Centered>
          )}

          {/* ---------------- STEP 4 ---------------- */}
          {pane === "offerings-intro" && (
            <Centered>
              <div className="flex justify-center">
                <PreviewStack category={category} />
              </div>
              <Heading center big title="Create your offerings" />
              <Sub center>
                These are what guests will book. You&apos;ll add a photo, some
                details, and a price.
              </Sub>
            </Centered>
          )}

          {pane === "offerings" && (
            <Centered>
              <Heading center big title="Your offerings" />
              <Sub center>
                Add at least one. Start with an affordable option to help you
                attract more guests.
              </Sub>
              <div className="mt-6 flex flex-col gap-3">
                {offers.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOfferOpen({ index: i })}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
                  >
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {o.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="font-medium text-foreground">{o.name}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {currency} {o.price}{" "}
                        {o.pricingType === "per_person" ? "/ guest" : "flat"}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOfferOpen({ index: null })}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <PlusIcon />
                  </span>
                  <span className="font-medium text-foreground">
                    {offers.length ? "Add another offering" : "Add your first offering"}
                  </span>
                </button>
              </div>
            </Centered>
          )}

          {pane === "hours" && (
            <Centered>
              <Heading center big title="Set your business hours" />
              <Sub center>
                Your business hours apply to all offerings. You can set custom
                hours for each offering later.
              </Sub>
              <div className="mt-8 flex flex-col gap-3">
                {hours.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHoursOpen({ index: i })}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 px-5 py-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">{daysLabel(b.days)}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {fmtTime(b.from)} – {fmtTime(b.to)}
                      </span>
                    </span>
                    <ChevronIcon />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setHoursOpen({ index: null })}
                  className="rounded-2xl bg-zinc-100 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  Add more hours
                </button>
              </div>
            </Centered>
          )}

          {pane === "discounts" && (
            <Centered>
              <Heading center big title="Add discounts" />
              <Sub center>
                If a booking qualifies for more than one, we&apos;ll automatically
                apply the largest discount.
              </Sub>
              <div className="mt-8 flex flex-col gap-3">
                <DiscountRow
                  applied={limitedTime}
                  percent={limitedTimePercent}
                  title="Limited-time"
                  subtitle="A deal for the first 90 days to encourage your first bookings."
                  onClick={() => setDiscountOpen("limitedTime")}
                />
                <DiscountRow
                  applied={earlyBird}
                  percent={earlyBirdPercent}
                  title="Early bird"
                  subtitle="For guests who book more than 2 weeks in advance."
                  onClick={() => setDiscountOpen("earlyBird")}
                />
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 5 ---------------- */}
          {pane === "legal" && (
            <Centered>
              <Heading center big title="Share what you'll provide" />
              <Sub center>
                This helps us know if we need to do license, insurance, quality,
                and standards checks.
              </Sub>
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Will you be transporting guests?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton selected={transporting === true} onClick={() => setTransporting(true)}>Yes</ChoiceButton>
                  <ChoiceButton selected={transporting === false} onClick={() => setTransporting(false)}>No</ChoiceButton>
                </div>
                <div className="mt-8 border-t border-zinc-200 pt-6 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <p className="font-semibold text-foreground">Requirements and terms</p>
                  <p className="mt-2">
                    By selecting &ldquo;I agree&rdquo;, you confirm you&apos;ve read and
                    agree to our services terms, host cancellation policy, and
                    privacy policy, and that you&apos;ll maintain any licenses and
                    insurance required to provide {category.toLowerCase()}.
                  </p>
                </div>
              </div>
            </Centered>
          )}

          {pane === "cancellation" && (
            <Centered>
              <Heading center big title="Set your cancellation policy" />
              <Sub center>
                Choose how much notice guests need to cancel for a refund. You can
                change this later in your listing settings.
              </Sub>
              <div className="mt-8 flex flex-col gap-3">
                {CANCELLATION_POLICIES.map((policy) => {
                  const [name, detail] = policy.label.split(": ");
                  return (
                    <SelectableCard
                      key={policy.value}
                      title={name}
                      subtitle={detail}
                      selected={cancellationPolicy === policy.value}
                      onClick={() => setCancellationPolicy(policy.value)}
                    />
                  );
                })}
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 6 ---------------- */}
          {pane === "service-intro" && (
            <Centered>
              <div className="flex justify-center">
                <TitlePreviewCard category={category} name={displayName} cover={photos[0]} />
              </div>
              <Heading center big title="Add a service title and description" />
              <Sub center>
                We&apos;ll share some options to get you started, then you&apos;ll
                choose one and make it your own.
              </Sub>
            </Centered>
          )}

          {pane === "service-title" && (
            <Centered wide>
              <Heading center big title="Choose one and make it your own" />
              {aiBusy && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <SparkleIcon />
                  Writing your title and description…
                </div>
              )}
              {aiError && !aiBusy && (
                <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Showing suggestions: {aiError}
                </p>
              )}
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {titleCards.map((t) => {
                  const selected = (title || titleCards[0]) === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTitle(t);
                        if (!description) setDescription(defaultDescription);
                      }}
                      className={`flex flex-col overflow-hidden rounded-3xl border p-4 text-center transition-all ${
                        selected
                          ? "border-foreground shadow-lg"
                          : "border-zinc-200 opacity-70 hover:opacity-100 dark:border-zinc-800"
                      }`}
                    >
                      <div className="relative mb-8 h-28 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                        {photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                        )}
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                          <Avatar name={displayName} small />
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-foreground">{t}</span>
                      <span className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {description || defaultDescription}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setTitleEditOpen(true)}
                  className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Edit
                </button>
              </div>
            </Centered>
          )}

          {pane === "payout" && (
            <Centered>
              <Heading center big title="How do you want to get paid?" />
              <Sub center>
                Add a payout method to receive your earnings. You can change it
                later in Payouts.
              </Sub>
              <div className="mx-auto mt-6 flex w-full max-w-md gap-2">
                {(
                  [
                    ["bank", "Bank account (RIB / IBAN)"],
                    ["crypto", "Crypto wallet"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPayoutType(val)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      payoutType === val
                        ? "border-foreground text-foreground"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 text-left">
                {payoutType === "bank" ? (
                  <>
                    <PayoutField label="Account holder name">
                      <input
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className={inputClass}
                      />
                    </PayoutField>
                    <PayoutField label="IBAN / RIB">
                      <input
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder="FR76 3000 6000 0112 3456 7890 189"
                        className={`${inputClass} font-mono`}
                      />
                    </PayoutField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <PayoutField label="BIC / SWIFT">
                        <input
                          value={bic}
                          onChange={(e) => setBic(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </PayoutField>
                      <PayoutField label="Country">
                        <input
                          value={payoutCountry}
                          onChange={(e) => setPayoutCountry(e.target.value)}
                          className={inputClass}
                        />
                      </PayoutField>
                    </div>
                    <PayoutField label="Bank name">
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className={inputClass}
                      />
                    </PayoutField>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <PayoutField label="Network">
                        <select
                          value={chain}
                          onChange={(e) => setChain(e.target.value)}
                          className={inputClass}
                        >
                          {PAYOUT_CHAINS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </PayoutField>
                      <PayoutField label="Stablecoin">
                        <select
                          value={stablecoin}
                          onChange={(e) => setStablecoin(e.target.value)}
                          className={inputClass}
                        >
                          {STABLECOINS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </PayoutField>
                    </div>
                    <PayoutField label="Wallet address">
                      <input
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="0x… / T… / base58"
                        className={`${inputClass} font-mono`}
                      />
                    </PayoutField>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Make sure the address is on the selected network. Only
                      stablecoins (USDC / USDT) are supported for now.
                    </p>
                  </>
                )}
              </div>
            </Centered>
          )}
        </main>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8">
          <button
            type="button"
            onClick={back}
            className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </span>
            )}
            {pane === "legal" ? (
              <PrimaryButton disabled={transporting === null} onClick={next}>
                I agree
              </PrimaryButton>
            ) : pane === "service-title" ? (
              <PrimaryButton onClick={next}>Next</PrimaryButton>
            ) : (
              <PrimaryButton disabled={nextDisabled} onClick={next}>
                Next
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((index + 1) / PANES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ----------------- Modals ----------------- */}
      {editing && (
        <TextModal
          title={
            editing.field === "experience"
              ? "Add your experience"
              : editing.field === "degree"
                ? "Add your degree or training"
                : "Add a career highlight"
          }
          value={
            editing.field === "experience"
              ? experience
              : editing.field === "degree"
                ? degree
                : career
          }
          max={90}
          onCancel={() => setEditing(null)}
          onSave={(v) => {
            if (editing.field === "experience") setExperience(v);
            else if (editing.field === "degree") setDegree(v);
            else setCareer(v);
            setEditing(null);
          }}
        />
      )}

      {linkOpen && (
        <LinkModal
          onCancel={() => setLinkOpen(false)}
          onSave={(v) => {
            setProfiles((a) => [...a, v]);
            setLinkOpen(false);
          }}
        />
      )}

      {areaOpen && (
        <ServiceAreaModal
          initialLocation={startLocation}
          initialMinutes={driveMinutes}
          onClose={() => setAreaOpen(false)}
          onSave={(loc, mins) => {
            setStartLocation(loc);
            setDriveMinutes(mins);
            setTravels(true);
            setAreaOpen(false);
          }}
        />
      )}

      {photoOpen && (
        <PhotoUploadModal
          onClose={() => setPhotoOpen(false)}
          onAdd={(urls) => {
            setPhotos((a) => [...a, ...urls]);
            setPhotoOpen(false);
          }}
        />
      )}

      {offerOpen && (
        <OfferingModal
          category={category}
          currency={currency}
          onCurrencyChange={setCurrency}
          existing={offerOpen.index !== null ? offers[offerOpen.index] : null}
          onCancel={() => setOfferOpen(null)}
          onRemove={
            offerOpen.index !== null
              ? () => {
                  setOffers((a) => a.filter((_, j) => j !== offerOpen.index));
                  setOfferOpen(null);
                }
              : undefined
          }
          onSave={(o) => {
            setOffers((a) => {
              if (offerOpen.index !== null) {
                const copy = [...a];
                copy[offerOpen.index] = o;
                return copy;
              }
              return [...a, o];
            });
            setOfferOpen(null);
          }}
        />
      )}

      {hoursOpen && (
        <HoursModal
          existing={hoursOpen.index !== null ? hours[hoursOpen.index] : null}
          onCancel={() => setHoursOpen(null)}
          onRemove={
            hoursOpen.index !== null
              ? () => {
                  setHours((a) => a.filter((_, j) => j !== hoursOpen.index));
                  setHoursOpen(null);
                }
              : undefined
          }
          onSave={(b) => {
            setHours((a) => {
              if (hoursOpen.index !== null) {
                const copy = [...a];
                copy[hoursOpen.index] = b;
                return copy;
              }
              return [...a, b];
            });
            setHoursOpen(null);
          }}
        />
      )}

      {titleEditOpen && (
        <TitleEditModal
          title={title || titleCards[0]}
          description={description || defaultDescription}
          onCancel={() => setTitleEditOpen(false)}
          onSave={(t, d) => {
            setTitle(t);
            setDescription(d);
            setTitleEditOpen(false);
          }}
        />
      )}

      {discountOpen && (
        <DiscountModal
          kind={discountOpen}
          applied={discountOpen === "limitedTime" ? limitedTime : earlyBird}
          percent={
            discountOpen === "limitedTime" ? limitedTimePercent : earlyBirdPercent
          }
          // One clear reference price only when a single offering exists.
          pricePerGuest={offers.length === 1 ? offers[0].price : 0}
          sym={currency === "USD" ? "$" : "€"}
          onCancel={() => setDiscountOpen(null)}
          onApply={(pct) => {
            if (discountOpen === "limitedTime") {
              setLimitedTimePercent(pct);
              setLimitedTime(true);
            } else {
              setEarlyBirdPercent(pct);
              setEarlyBird(true);
            }
            setDiscountOpen(null);
          }}
          onRemove={() => {
            if (discountOpen === "limitedTime") setLimitedTime(false);
            else setEarlyBird(false);
            setDiscountOpen(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

export function ModalShell({
  children,
  onClose,
  size = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[85vh] w-full ${size === "lg" ? "max-w-xl" : "max-w-md"} flex-col rounded-3xl bg-background shadow-2xl dark:border dark:border-zinc-800`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function TextModal({
  title,
  value,
  max,
  onSave,
  onCancel,
}: {
  title: string;
  value: string;
  max: number;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-center justify-between p-5">
        <span className="w-6" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <CloseButton onClick={onCancel} />
      </div>
      <div className="px-6 pb-2">
        <textarea
          autoFocus
          value={v}
          maxLength={max}
          onChange={(e) => setV(e.target.value)}
          rows={3}
          className="w-full resize-none bg-transparent text-center text-xl text-foreground outline-none placeholder:text-zinc-400"
          placeholder="Type here…"
        />
        <p className="mt-2 text-center text-xs text-zinc-400">
          {v.length}/{max} available
        </p>
      </div>
      <ModalFooter
        onCancel={onCancel}
        onSave={() => onSave(v.trim())}
        saveDisabled={!v.trim()}
      />
    </ModalShell>
  );
}

export function LinkModal({
  onSave,
  onCancel,
}: {
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState("");
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-center justify-between p-5">
        <span className="w-6" />
        <h2 className="text-lg font-semibold text-foreground">Add link</h2>
        <CloseButton onClick={onCancel} />
      </div>
      <div className="px-6 py-8">
        <input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="www.yourwebsite.com"
          className="w-full bg-transparent text-center text-2xl text-foreground outline-none placeholder:text-zinc-300"
        />
      </div>
      <ModalFooter
        onCancel={onCancel}
        onSave={() => onSave(v.trim())}
        saveDisabled={!v.trim()}
      />
    </ModalShell>
  );
}

function ServiceAreaModal({
  initialLocation,
  initialMinutes,
  onSave,
  onClose,
}: {
  initialLocation: string;
  initialMinutes: number;
  onSave: (loc: string, mins: number) => void;
  onClose: () => void;
}) {
  const [loc, setLoc] = useState(initialLocation);
  const [mins, setMins] = useState(initialMinutes);
  const radiusKm = serviceRadiusKm(mins);
  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="flex items-start justify-between p-5">
        <span className="w-6" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Set your service area</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your starting point, then set your maximum drive time.
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="flex items-center gap-3 rounded-full border border-zinc-300 px-4 py-3 dark:border-zinc-700">
          <SearchIcon />
          <input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="Enter your starting location"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        {loc && (
          <div className="relative z-0 mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <ServiceAreaMap location={loc} radiusKm={radiusKm} />
            <span className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-900 shadow">
              🚗 {formatDrive(mins)} · ≈ {radiusKm} km
            </span>
          </div>
        )}
        <p className="mt-5 text-sm font-medium text-foreground">
          Your drive time{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            (covers about {radiusKm} km around {loc || "your location"})
          </span>
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[30, 60, 90, 120].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMins(m)}
              className={`rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
                mins === m
                  ? "border-foreground bg-foreground text-background"
                  : "border-zinc-300 text-foreground hover:border-foreground dark:border-zinc-700"
              }`}
            >
              {formatDrive(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <button
          type="button"
          onClick={() => onSave(loc.trim(), mins)}
          disabled={!loc.trim()}
          className="w-full rounded-xl bg-foreground py-3.5 text-sm font-medium text-background disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </ModalShell>
  );
}

export function PhotoUploadModal({
  onAdd,
  onClose,
}: {
  onAdd: (urls: string[]) => void;
  onClose: () => void;
}) {
  const [staged, setStaged] = useState<StagedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    const next: StagedPhoto[] = [];
    for (const f of files) {
      const url = await uploadFile(f);
      if (url) next.push({ url, ...(await readDimensions(f)) });
    }
    setBusy(false);
    if (e.target) e.target.value = "";
    if (next.length === 0) {
      setErr("Upload failed. Image storage may not be configured yet.");
      return;
    }
    setStaged((a) => [...a, ...next]);
  }

  const hasLowQuality = staged.some((s) => isLowResolution(s.width, s.height));
  const canAdd = staged.length > 0 && !hasLowQuality;

  return (
    <ModalShell onClose={onClose} size="lg">
      <div className="flex items-center justify-between p-5">
        <CloseButton onClick={onClose} />
        <div className="text-center">
          <h2 className="text-base font-semibold text-foreground">Upload photos</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {staged.length ? `${staged.length} selected` : "No items selected"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="Add more"
        >
          <PlusIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {staged.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-foreground dark:border-zinc-700"
          >
            <ImageIcon big />
            <span className="text-lg font-semibold text-foreground">Drag and drop</span>
            <span className="text-sm">or browse for photos</span>
            <span className="mt-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              {busy ? "Uploading…" : "Browse"}
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {staged.map((item, i) => {
              const low = isLowResolution(item.width, item.height);
              return (
                <div
                  key={i}
                  className={`relative aspect-square overflow-hidden rounded-2xl ${
                    low ? "ring-2 ring-amber-500" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setStaged((a) => a.filter((_, j) => j !== i))}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove"
                  >
                    <TrashIcon />
                  </button>
                  {low && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 shadow">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      LOW RESOLUTION
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {err && <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{err}</p>}
        {hasLowQuality && (
          <p className="mt-3 text-center text-sm text-amber-600 dark:text-amber-500">
            Remove low-resolution photos. They must be at least {MIN_PHOTO_PX} ×{" "}
            {MIN_PHOTO_PX} px to publish.
          </p>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      </div>
      <div className="flex items-center justify-between p-5">
        <button type="button" onClick={onClose} className="text-sm font-medium text-foreground">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onAdd(staged.map((s) => s.url))}
          disabled={!canAdd}
          className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </ModalShell>
  );
}

function OfferingModal({
  category,
  currency,
  onCurrencyChange,
  existing,
  onSave,
  onCancel,
  onRemove,
}: {
  category: string;
  currency: "USD" | "EUR";
  onCurrencyChange: (c: "USD" | "EUR") => void;
  existing: WizardOffering | null;
  onSave: (o: WizardOffering) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [view, setView] = useState<"naming" | "details" | "type">(
    existing ? "details" : "naming",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [image, setImage] = useState(existing?.imageUrl ?? "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [typeOfService, setTypeOfService] = useState(existing?.typeOfService ?? "");
  const [price, setPrice] = useState(existing?.price ?? 0);
  const [pricingType, setPricingType] = useState<WizardOffering["pricingType"]>(
    existing?.pricingType ?? "per_person",
  );
  const [capacity, setCapacity] = useState(existing?.capacity ?? 1);
  const [duration, setDuration] = useState(existing?.durationMinutes ?? 60);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = await uploadFile(file);
    setBusy(false);
    if (url) setImage(url);
  }

  function commit() {
    onSave({
      name: name.trim(),
      imageUrl: image || undefined,
      description: desc.trim() || undefined,
      typeOfService: typeOfService || undefined,
      price,
      pricingType,
      capacity,
      durationMinutes: duration,
    });
  }

  if (view === "type") {
    return (
      <ModalShell onClose={() => setView("details")} size="md">
        <div className="flex items-center justify-between p-5">
          <span className="w-6" />
          <h2 className="text-lg font-semibold text-foreground">Choose a type of service</h2>
          <CloseButton onClick={() => setView("details")} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="flex flex-col gap-2">
            {getServiceTypeOptions(category).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTypeOfService(t);
                  setView("details");
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-colors ${
                  typeOfService === t
                    ? "border-foreground"
                    : "border-zinc-200 hover:border-foreground dark:border-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </ModalShell>
    );
  }

  if (view === "naming") {
    return (
      <ModalShell onClose={onCancel}>
        <div className="flex items-center justify-between p-5">
          <span className="w-6" />
          <h2 className="text-lg font-semibold text-foreground">Add a photo and title</h2>
          <CloseButton onClick={onCancel} />
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon big />
              )}
              <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                <PlusIcon />
              </span>
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </div>
          <input
            autoFocus
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your offering"
            className="mt-6 w-full bg-transparent text-center text-2xl font-semibold text-foreground outline-none placeholder:text-zinc-300"
          />
          <p className="mt-2 text-center text-xs text-zinc-400">{name.length}/32 available</p>
        </div>
        <div className="flex items-center justify-between p-5">
          <button type="button" onClick={onCancel} className="text-sm font-medium text-foreground">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setView("details")}
            disabled={!name.trim() || busy}
            className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </ModalShell>
    );
  }

  // details
  return (
    <ModalShell onClose={onCancel} size="md">
      <div className="flex items-center justify-between p-5">
        <span className="w-6" />
        <h2 className="text-lg font-semibold text-foreground">Add details</h2>
        <CloseButton onClick={onCancel} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-2">
        <p className="mb-4 text-center text-xl font-semibold text-foreground">{name}</p>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-foreground">Description</p>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Add a description"
              className="mt-1 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setView("type")}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 text-left dark:border-zinc-800"
          >
            <span className="text-sm font-medium text-foreground">Type of service</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {typeOfService || "Select"}
            </span>
          </button>
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Price</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onCurrencyChange(currency === "USD" ? "EUR" : "USD")
                    }
                    title="Tap to switch currency"
                    aria-label={`Currency: ${currency}. Tap to switch.`}
                    className="cursor-pointer text-2xl font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    {currency}
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-24 bg-transparent text-2xl font-semibold text-foreground outline-none"
                  />
                </div>
              </div>
              <div className="flex rounded-full bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setPricingType("per_person")}
                  className={`rounded-full px-3 py-1.5 font-medium ${pricingType === "per_person" ? "bg-background text-foreground shadow" : "text-zinc-500"}`}
                >
                  Per guest
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType("per_booking")}
                  className={`rounded-full px-3 py-1.5 font-medium ${pricingType === "per_booking" ? "bg-background text-foreground shadow" : "text-zinc-500"}`}
                >
                  Fixed
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-foreground">Number of guests</span>
            <Stepper small value={capacity} setValue={(v) => setCapacity(Math.max(1, v))} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-foreground">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-zinc-700"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d < 60 ? `${d} mins` : `${d / 60} hr${d >= 120 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-5">
        <button
          type="button"
          onClick={onRemove ?? onCancel}
          className="text-sm font-medium text-foreground"
        >
          {onRemove ? "Remove" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={commit}
          disabled={!name.trim() || price <= 0}
          className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}

function HoursModal({
  existing,
  onSave,
  onCancel,
  onRemove,
}: {
  existing: Block | null;
  onSave: (b: Block) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [days, setDays] = useState<number[]>(existing?.days ?? [1, 2, 3, 4, 5]);
  const [from, setFrom] = useState(existing?.from ?? "09:00");
  const [to, setTo] = useState(existing?.to ?? "17:00");
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-center justify-between p-5">
        <CloseButton onClick={onCancel} />
        <h2 className="text-lg font-semibold text-foreground">Business hours</h2>
        <span className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <p className="text-sm font-medium text-foreground">Days</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d.n);
            return (
              <button
                key={d.n}
                type="button"
                onClick={() =>
                  setDays((a) => (on ? a.filter((x) => x !== d.n) : [...a, d.n]))
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-zinc-300 text-foreground dark:border-zinc-700"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            From
            <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            To
            <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between p-5">
        <button type="button" onClick={onRemove ?? onCancel} className="text-sm font-medium text-foreground">
          {onRemove ? "Remove" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => onSave({ days: [...days].sort(), from, to })}
          disabled={days.length === 0 || to <= from}
          className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </ModalShell>
  );
}

function TitleEditModal({
  title,
  description,
  onSave,
  onCancel,
}: {
  title: string;
  description: string;
  onSave: (t: string, d: string) => void;
  onCancel: () => void;
}) {
  const [t, setT] = useState(title);
  const [d, setD] = useState(description);
  return (
    <ModalShell onClose={onCancel} size="lg">
      <div className="flex items-center justify-between p-5">
        <span className="w-6" />
        <h2 className="text-lg font-semibold text-foreground">Edit your listing</h2>
        <CloseButton onClick={onCancel} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Title
          <input value={t} maxLength={60} onChange={(e) => setT(e.target.value)} className={inputClass} />
        </label>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-foreground">
          Description
          <textarea value={d} maxLength={500} rows={4} onChange={(e) => setD(e.target.value)} className={`${inputClass} resize-none`} />
        </label>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(t.trim(), d.trim())} saveDisabled={t.trim().length < 3} />
    </ModalShell>
  );
}

function ReviewPane({
  back,
  coverImage,
  title,
  rows,
  pending,
  error,
  onPublish,
}: {
  back: () => void;
  coverImage?: string;
  title: string;
  rows: { label: string; value: string; icon: IconName }[];
  pending: boolean;
  error: string | null;
  onPublish: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <Image src={gathraLogo} alt="" className="h-10 w-auto brightness-0 invert" />
      </div>

      <div className="mt-10 grid flex-1 gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Publish your listing</h1>
          <p className="mt-4 max-w-md text-zinc-400">
            Review the details below, then submit. We&apos;ll review your listing
            to make sure it meets our requirements before it goes live.
          </p>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <StepIcon name={r.icon} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-sm text-zinc-400">{r.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className="w-72 rounded-3xl bg-white p-3 text-zinc-900 shadow-2xl">
            <div className="h-40 overflow-hidden rounded-2xl bg-zinc-200">
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="px-2 py-6 text-center text-2xl font-semibold">{title}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
        <p className="max-w-md text-xs text-zinc-500">
          By requesting to publish, you agree to the Services terms and attest all
          details are accurate.
        </p>
        <div className="flex flex-col items-end gap-2">
          {error && <span className="text-sm text-red-400">{error}</span>}
          <button
            type="button"
            onClick={onPublish}
            disabled={pending}
            className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Request to publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared small pieces
// ---------------------------------------------------------------------------

export function Centered({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return <div className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"}`}>{children}</div>;
}

export function Heading({
  title,
  center,
  big,
}: {
  title: string;
  center?: boolean;
  big?: boolean;
}) {
  return (
    <h1
      className={`font-bold tracking-tight text-foreground ${center ? "text-center" : ""} ${
        big ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
      }`}
    >
      {title}
    </h1>
  );
}

export function Sub({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`mt-3 text-zinc-500 dark:text-zinc-400 ${center ? "text-center" : ""}`}>
      {children}
    </p>
  );
}

function PayoutField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ModalFooter({
  onCancel,
  onSave,
  saveDisabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <button type="button" onClick={onCancel} className="text-sm font-medium text-foreground">
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  );
}

export function RowButton({
  icon,
  title,
  value,
  filled,
  onClick,
}: {
  icon: "trophy" | "cap" | "star";
  title: string;
  value: string;
  filled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-foreground dark:bg-zinc-800">
        <SmallIcon name={icon} />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className={`text-sm ${filled ? "text-foreground" : "text-zinc-400"}`}>{value}</span>
      </span>
      <ChevronIcon />
    </button>
  );
}

export function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border py-3.5 text-sm font-medium transition-colors ${
        selected ? "border-foreground ring-1 ring-foreground" : "border-zinc-300 text-foreground hover:border-foreground dark:border-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

export function SelectableCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-all ${
        selected ? "border-foreground ring-1 ring-foreground" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
      }`}
    >
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</span>
      </span>
      {selected && <CheckIcon />}
    </button>
  );
}

export function ToggleCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-all ${
        selected ? "border-foreground ring-1 ring-foreground" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
      }`}
    >
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</span>
      </span>
      {selected ? <CheckIcon /> : <PlusIcon />}
    </button>
  );
}

export function Stepper({
  value,
  setValue,
  small,
}: {
  value: number;
  setValue: (v: number) => void;
  small?: boolean;
}) {
  const big = !small;
  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => setValue(value - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-foreground transition-colors hover:border-foreground dark:border-zinc-700"
        aria-label="Decrease"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <span className={`${big ? "w-24 text-center text-6xl" : "w-10 text-center text-2xl"} font-bold text-foreground`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => setValue(value + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-foreground transition-colors hover:border-foreground dark:border-zinc-700"
        aria-label="Increase"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
}

export function FramedInput({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <label className={`block px-4 py-2.5 ${last ? "" : "border-b border-zinc-300 dark:border-zinc-700"}`}>
      <span className="block text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground outline-none"
      />
    </label>
  );
}

export function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div className={`mx-auto flex items-center justify-center rounded-full bg-[#f6dcc4] font-semibold text-[#8a4b2f] ${small ? "h-10 w-10 text-base" : "h-20 w-20 text-3xl"}`}>
      {initial}
    </div>
  );
}

function PreviewStack({ category }: { category: string }) {
  const cat = findServiceCategory(category);
  const labels = [
    "Deep session · $49",
    "Coaching · $75",
    `${category || "Full package"} · $120`,
  ];
  return (
    <div className="relative h-44 w-72">
      {labels.map((l, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 mx-auto flex items-center gap-3 rounded-2xl border border-zinc-200 bg-background p-3 shadow-lg dark:border-zinc-800"
          style={{ top: i * 44, transform: `rotate(${i % 2 ? 2 : -2}deg)`, zIndex: 10 - i }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {cat ? (
              <Image src={cat.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            ) : (
              // No category picked yet — show a neutral price-tag icon so the
              // box isn't empty.
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              >
                <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <circle cx="7" cy="7" r="1.25" />
              </svg>
            )}
          </span>
          <span className="text-sm font-medium text-foreground">{l}</span>
        </div>
      ))}
    </div>
  );
}

function TitlePreviewCard({
  category,
  name,
  cover,
}: {
  category: string;
  name: string;
  cover?: string;
}) {
  const cat = findServiceCategory(category);
  return (
    <div className="w-60 rounded-3xl border border-zinc-200 bg-background p-3 shadow-2xl dark:border-zinc-800">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          cat && (
            <span className="flex h-full items-center justify-center">
              <Image src={cat.icon} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
            </span>
          )
        )}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2">
          <Avatar name={name} small />
        </span>
      </div>
      <div className="space-y-2 px-2 pb-3 pt-8">
        <div className="h-2.5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-2.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

type IconName =
  | "tag"
  | "person"
  | "pin"
  | "image"
  | "list"
  | "clipboard"
  | "timer"
  | "wallet";

function StepIcon({ name }: { name: IconName }) {
  const c = "h-5 w-5";
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "tag":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.25" /></svg>;
    case "person":
      return <svg viewBox="0 0 24 24" className={c} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "pin":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "image":
      return <svg viewBox="0 0 24 24" className={c} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
    case "list":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "clipboard":
      return <svg viewBox="0 0 24 24" className={c} {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
    case "timer":
      return <svg viewBox="0 0 24 24" className={c} {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>;
    case "wallet":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" /><path d="M16 12h.01" /></svg>;
    default:
      return null;
  }
}

function SmallIcon({ name }: { name: "trophy" | "cap" | "star" }) {
  const c = "h-5 w-5";
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "trophy":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M6 4h12v4a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 18h6M10 14v4M14 14v4M8 21h8" /></svg>;
    case "cap":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="m22 9-10-5L2 9l10 5 10-5z" /><path d="M6 11v5a6 3 0 0 0 12 0v-5" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 17l-5.4 2.6 1-6L3.3 9.4l6-.9z" /></svg>;
    default:
      return null;
  }
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
}
// Picks the logo for a profile link from its URL. Instagram and Facebook get
// their brand marks; everything else falls back to a generic website globe.
function profileLogo(url: string) {
  const u = url.toLowerCase();
  if (/instagram\.com/.test(u)) return { src: "/competitors_logos/instagram.png", alt: "Instagram" };
  if (/(facebook\.com|fb\.com|fb\.me)/.test(u)) return { src: "/competitors_logos/facebook.png", alt: "Facebook" };
  return { src: "/competitors_logos/web.png", alt: "Website" };
}

// Logo for a profile link, chosen from its URL.
export function ProfileIcon({ url }: { url: string }) {
  const { src, alt } = profileLogo(url);
  return <Image src={src} alt={alt} width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />;
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
}
function SparkleIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.95 2.55L22.5 17.5l-2.55.95L19 21l-.95-2.55L15.5 17.5l2.55-.95L19 14z" /></svg>;
}
function ImageIcon({ big }: { big?: boolean }) {
  return <svg viewBox="0 0 24 24" className={big ? "h-12 w-12" : "h-5 w-5 text-zinc-400"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDrive(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${mins >= 120 ? "s" : ""}`;
}

// Approximate how far the host can travel in the given drive time, assuming an
// average ~60 km/h (mixed city + highway). Keep this in sync with the radius
// the server stores (wizard-actions: driveTimeToRadiusKm).
function serviceRadiusKm(mins: number): number {
  return Math.round((mins / 60) * 60);
}


function daysLabel(days: number[]): string {
  if (days.length === 0) return "No days";
  const sorted = [...days].sort();
  const names = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const isWeekdays =
    sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d));
  if (isWeekdays) return "Monday – Friday";
  return sorted.map((d) => names[d]).join(", ");
}

function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
