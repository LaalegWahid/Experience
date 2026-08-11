"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { findExperienceCategory } from "@/shared/data/experience-categories";
import {
  COMPLIANCE_QUESTIONS,
  experienceComplianceQuestions,
} from "@/shared/data/experience-compliance";
import { CANCELLATION_POLICIES } from "@/shared/data/offerings";
import { SERVICE_FEE_RATE } from "@/shared/utils/fees";
import { gathraLogo } from "@/shared/brand";
import { DiscountModal, DiscountRow } from "./discount-modal";
import {
  isLowResolution,
  MIN_PHOTO_PX,
  readDimensions,
  type StagedPhoto,
} from "@/shared/utils/image";
import { createListingDraft } from "./wizard-actions";
import { generateListingCopy } from "./ai-actions";
import type {
  ExperienceActivity,
  ExperienceSnapshot,
  ListingDraftInput,
} from "./wizard-types";
// Reuse the service wizard's visual primitives so both flows look identical.
import {
  Avatar,
  Centered,
  ChoiceButton,
  CloseButton,
  Heading,
  inputClass,
  LinkModal,
  ProfileIcon,
  ModalFooter,
  ModalShell,
  PrimaryButton,
  SelectableCard,
  Stepper,
  Sub,
  uploadFile,
} from "./listing-wizard";
import {
  InlineSuggestions,
  LocationSearchPanel,
  type GeoPlace,
} from "./location-search";
import { ExperiencePinMap } from "./experience-pin-map";

// Experience listing wizard — the parallel of ListingWizard, with steps and copy
// tailored to experiences (itinerary, pricing, meeting point, etc.). Kept fully
// separate so the service flow is never touched.

/** Most photos a host can mark as cover images. */
const MAX_COVERS = 5;

const PANES = [
  { key: "years", step: 1 },
  { key: "expertise", step: 1 },
  { key: "profiles", step: 1 },
  { key: "address", step: 1 },
  { key: "meet-search", step: 2 },
  { key: "meet-confirm", step: 2 },
  { key: "meet-pin", step: 2 },
  { key: "photos", step: 3 },
  { key: "itinerary-intro", step: 4 },
  { key: "itinerary", step: 4 },
  { key: "max-guests", step: 5 },
  { key: "price", step: 5 },
  { key: "private-min", step: 5 },
  { key: "price-review", step: 5 },
  { key: "discounts", step: 5 },
  { key: "details", step: 6 },
  { key: "cancellation", step: 6 },
  { key: "title-intro", step: 7 },
  { key: "title", step: 7 },
  { key: "review", step: 7 },
] as const;

type PaneKey = (typeof PANES)[number]["key"];

const STEP_LABELS = [
  "About you",
  "Location",
  "Photos",
  "Itinerary",
  "Pricing",
  "Details",
  "Experience",
];

const STEP_ICONS = [
  "person",
  "pin",
  "image",
  "itinerary",
  "pricing",
  "details",
  "experience",
] as const;

const CURRENCY_SYMBOL: Record<"USD" | "EUR", string> = { USD: "$", EUR: "€" };

export function ExperienceWizard({
  category,
  subcategory = "",
  city,
  displayName,
  initialState = null,
  initialDraftId = null,
}: {
  category: string;
  subcategory?: string;
  city: string;
  displayName: string;
  initialState?: ExperienceSnapshot | null;
  initialDraftId?: string | null;
}) {
  const router = useRouter();
  const kind = (subcategory || category || "experience").toLowerCase();
  const samples = findExperienceCategory(category)?.samples ?? [];

  const [index, setIndex] = useState(0);
  const pane: PaneKey = PANES[index].key;
  const step = PANES[index].step;
  const indexOf = (key: PaneKey) => PANES.findIndex((p) => p.key === key);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 — About you
  const [years, setYears] = useState(3);
  const [proTitle, setProTitle] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [recognition, setRecognition] = useState("");
  const [profiles, setProfiles] = useState<string[]>([]);
  const [country, setCountry] = useState("Morocco");
  const [apt, setApt] = useState("");
  const [street, setStreet] = useState("");
  const [addrCity, setAddrCity] = useState(city);
  const [postal, setPostal] = useState("");
  const [asBusiness, setAsBusiness] = useState<boolean | null>(null);

  // Step 2 — Meeting point (public)
  const [meetCountry, setMeetCountry] = useState("Morocco");
  const [meetApt, setMeetApt] = useState("");
  const [meetStreet, setMeetStreet] = useState("");
  const [meetCity, setMeetCity] = useState(city);
  const [meetPostal, setMeetPostal] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);

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

  // Step 4 — Itinerary
  const [itinerary, setItinerary] = useState<ExperienceActivity[]>([]);

  // Step 5 — Pricing
  const [maxGuests, setMaxGuests] = useState(4);
  const [pricePerGuest, setPricePerGuest] = useState(0);
  const [privateGroupMinimum, setPrivateGroupMinimum] = useState(0);
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [limitedTime, setLimitedTime] = useState(false);
  const [earlyBird, setEarlyBird] = useState(false);
  // Host-chosen discount amounts (default to Airbnb's suggestions, but editable).
  const [limitedTimePercent, setLimitedTimePercent] = useState(10);
  const [earlyBirdPercent, setEarlyBirdPercent] = useState(20);

  // Step 6 — Details. Answers keyed by question id (the set of questions shown
  // depends on the category/sub-type, so a flat map keeps this open-ended).
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [cancellationPolicy, setCancellationPolicy] = useState<
    "flexible" | "moderate" | "strict"
  >("flexible");

  // Step 7 — Title & description
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const templateTitles = useMemo(() => {
    const k = subcategory || category || "experience";
    const place = meetCity || city || addrCity || "your city";
    return [
      `${k} in ${place}`,
      `Discover ${place} through ${k.toLowerCase()}`,
      `An unforgettable ${k.toLowerCase()} experience`,
    ];
  }, [subcategory, category, city, addrCity, meetCity]);
  const defaultDescription = useMemo(
    () => `Join me for ${kind} in ${meetCity || city || addrCity || "your city"}.`,
    [kind, city, addrCity, meetCity],
  );
  const titleCards = aiTitles.length ? aiTitles : templateTitles;

  const totalMinutes = itinerary.reduce((s, a) => s + a.durationMinutes, 0);
  const sym = CURRENCY_SYMBOL[currency];
  const guestPays = (price: number) => Math.round(price * (1 + SERVICE_FEE_RATE));

  // Step 6 — only the questions relevant to this category/sub-type.
  const complianceQuestions = experienceComplianceQuestions(category, subcategory);
  // The host must answer every question we actually show before agreeing.
  const detailsComplete = complianceQuestions.every(
    (id) => typeof details[id] === "boolean",
  );

  // ── Draft persistence (localStorage + DB), keyed per category ────────────
  const storageKey = `xp-draft:${category}`;
  const restored = useRef(false);

  function snapshot(): ExperienceSnapshot {
    return {
      draftId,
      index,
      years,
      proTitle,
      qualifications,
      recognition,
      profiles,
      country,
      apt,
      street,
      addrCity,
      postal,
      asBusiness,
      meetCountry,
      meetApt,
      meetStreet,
      meetCity,
      meetPostal,
      locationName,
      lat,
      lon,
      photos,
      covers,
      itinerary,
      maxGuests,
      pricePerGuest,
      privateGroupMinimum,
      currency,
      limitedTime,
      earlyBird,
      limitedTimePercent,
      earlyBirdPercent,
      details,
      cancellationPolicy,
      title,
      description,
    };
  }

  function hydrate(s: ExperienceSnapshot) {
    if (typeof s.draftId === "string") setDraftId(s.draftId);
    if (typeof s.index === "number") setIndex(s.index);
    if (typeof s.years === "number") setYears(s.years);
    if (typeof s.proTitle === "string") setProTitle(s.proTitle);
    if (typeof s.qualifications === "string") setQualifications(s.qualifications);
    if (typeof s.recognition === "string") setRecognition(s.recognition);
    if (Array.isArray(s.profiles)) setProfiles(s.profiles);
    if (typeof s.country === "string") setCountry(s.country);
    if (typeof s.apt === "string") setApt(s.apt);
    if (typeof s.street === "string") setStreet(s.street);
    if (typeof s.addrCity === "string") setAddrCity(s.addrCity);
    if (typeof s.postal === "string") setPostal(s.postal);
    if (typeof s.asBusiness === "boolean") setAsBusiness(s.asBusiness);
    if (typeof s.meetCountry === "string") setMeetCountry(s.meetCountry);
    if (typeof s.meetApt === "string") setMeetApt(s.meetApt);
    if (typeof s.meetStreet === "string") setMeetStreet(s.meetStreet);
    if (typeof s.meetCity === "string") setMeetCity(s.meetCity);
    if (typeof s.meetPostal === "string") setMeetPostal(s.meetPostal);
    if (typeof s.locationName === "string") setLocationName(s.locationName);
    if (typeof s.lat === "number") setLat(s.lat);
    if (typeof s.lon === "number") setLon(s.lon);
    if (Array.isArray(s.photos)) setPhotos(s.photos);
    if (Array.isArray(s.covers)) setCovers(s.covers);
    if (Array.isArray(s.itinerary)) setItinerary(s.itinerary);
    if (typeof s.maxGuests === "number") setMaxGuests(s.maxGuests);
    if (typeof s.pricePerGuest === "number") setPricePerGuest(s.pricePerGuest);
    if (typeof s.privateGroupMinimum === "number")
      setPrivateGroupMinimum(s.privateGroupMinimum);
    if (s.currency === "USD" || s.currency === "EUR") setCurrency(s.currency);
    if (typeof s.limitedTime === "boolean") setLimitedTime(s.limitedTime);
    if (typeof s.earlyBird === "boolean") setEarlyBird(s.earlyBird);
    if (typeof s.limitedTimePercent === "number")
      setLimitedTimePercent(s.limitedTimePercent);
    if (typeof s.earlyBirdPercent === "number")
      setEarlyBirdPercent(s.earlyBirdPercent);
    if (s.details && typeof s.details === "object") setDetails(s.details);
    if (
      s.cancellationPolicy === "flexible" ||
      s.cancellationPolicy === "moderate" ||
      s.cancellationPolicy === "strict"
    )
      setCancellationPolicy(s.cancellationPolicy);
    if (typeof s.title === "string") setTitle(s.title);
    if (typeof s.description === "string") setDescription(s.description);
  }

  useEffect(() => {
    if (initialState) {
      hydrate(initialState);
      if (initialDraftId) setDraftId(initialDraftId);
    } else {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) hydrate(JSON.parse(raw));
      } catch {
        // Ignore corrupt/unavailable storage — start fresh.
      }
    }
    restored.current = true;
    // Run once per draft key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Serialise once per render so the persist effect re-runs on any field change.
  const serializedSnapshot = JSON.stringify(snapshot());
  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(storageKey, serializedSnapshot);
    } catch {
      // Non-fatal — the draft just won't persist locally.
    }
  }, [storageKey, serializedSnapshot]);

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
      type: "experience",
      role: subcategory || "experience host",
      years,
      city: meetCity || city || addrCity,
      typeOfService: subcategory || undefined,
      offerings: itinerary.map((a) => a.title),
      experience: proTitle,
      degree: qualifications,
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
  const [editing, setEditing] = useState<
    null | "proTitle" | "qualifications" | "recognition"
  >(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState<null | { index: number | null }>(
    null,
  );
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState<
    null | "limitedTime" | "earlyBird"
  >(null);
  // Set once the host tries to leave the address step with required fields empty.
  const [addrTouched, setAddrTouched] = useState(false);
  const [meetTouched, setMeetTouched] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReview = pane === "review";

  const nextDisabled =
    (pane === "expertise" && !qualifications.trim()) ||
    (pane === "meet-search" && lat === undefined) ||
    (pane === "photos" && photos.length < 5) ||
    (pane === "itinerary" && itinerary.length < 1) ||
    (pane === "price" && !(pricePerGuest > 0));

  function back() {
    if (index === 0) {
      router.push("/host");
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    // Residential address: Street / City / Postal are required (Apt is optional).
    if (
      pane === "address" &&
      (!street.trim() || !addrCity.trim() || !postal.trim())
    ) {
      setAddrTouched(true);
      return;
    }
    // Meeting point: same required fields.
    if (
      pane === "meet-confirm" &&
      (!meetStreet.trim() || !meetCity.trim() || !meetPostal.trim())
    ) {
      setMeetTouched(true);
      return;
    }
    if (pane === "title-intro" && aiTitles.length === 0 && !aiBusy) {
      void runAi();
    }
    setIndex((i) => Math.min(PANES.length - 1, i + 1));
  }

  // A meeting-point suggestion was chosen — fill the confirm form and advance.
  function onMeetSelect(p: GeoPlace) {
    setMeetStreet(p.street || p.label);
    setMeetCity(p.city || (p.street ? meetCity : p.label));
    if (p.postal) setMeetPostal(p.postal);
    if (p.country) setMeetCountry(p.country);
    setLat(p.lat);
    setLon(p.lon);
    setIndex(indexOf("meet-confirm"));
  }

  function buildInput(): ListingDraftInput {
    const finalTitle = title || titleCards[0];
    return {
      type: "experience",
      category,
      title: finalTitle,
      description: description || defaultDescription,
      currency,
      yearsOfExperience: years,
      experience: proTitle,
      degree: qualifications,
      careerHighlight: recognition,
      onlineProfiles: profiles,
      residentialAddress: {
        country,
        line: apt,
        street,
        city: addrCity,
        postalCode: postal,
      },
      hostingAsBusiness: asBusiness ?? undefined,
      guestsComeToHost: true,
      startingLocation:
        locationName || [meetStreet, meetCity].filter(Boolean).join(", "),
      city: meetCity || addrCity || city,
      photos,
      coverPhotos: covers,
      offerings: [
        {
          name: finalTitle,
          description: description || defaultDescription,
          typeOfService: subcategory || undefined,
          price: pricePerGuest,
          pricingType: "per_person",
          capacity: Math.max(1, maxGuests),
          durationMinutes: totalMinutes || 60,
        },
      ],
      discounts: {
        limitedTime,
        earlyBird,
        limitedTimePercent: limitedTime ? limitedTimePercent : undefined,
        earlyBirdPercent: earlyBird ? earlyBirdPercent : undefined,
      },
      experienceDetails: Object.fromEntries(
        complianceQuestions
          .filter((id) => typeof details[id] === "boolean")
          .map((id) => [id, details[id]]),
      ),
      itinerary,
      maxGuests,
      pricePerGuest,
      privateGroupMinimum: privateGroupMinimum || undefined,
      cancellationPolicy,
    };
  }

  async function saveAndExit() {
    setSaving(true);
    setError(null);
    const res = await createListingDraft(
      { ...buildInput(), draftState: snapshot() },
      { offeringId: draftId ?? undefined, inProgress: true },
    );
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
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
    const res = await createListingDraft(buildInput(), {
      offeringId: draftId ?? undefined,
      publish: true,
    });
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
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
            { label: "About you", value: proTitle || "Your expertise", icon: "person" },
            {
              label: "Location",
              value: locationName || meetCity || city || "Meeting point",
              icon: "pin",
            },
            { label: "Photos", value: `${photos.length} photos`, icon: "image" },
            {
              label: "Itinerary",
              value: itinerary[0]?.title ?? "None",
              icon: "itinerary",
            },
            {
              label: "Pricing",
              value: `${sym}${pricePerGuest} / guest`,
              icon: "pricing",
            },
            {
              label: "Details",
              value: `${complianceQuestions.length} answered`,
              icon: "details",
            },
            {
              label: "Experience",
              value: title || titleCards[0],
              icon: "experience",
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
          {STEP_ICONS.map((ic, i) => {
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
                <ExpStepIcon name={ic} />
              </span>
            );
          })}
        </div>
      </aside>

      {/* Inset white panel */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background sm:my-3 sm:mr-3 sm:rounded-3xl">
        <header className="relative flex items-center px-5 py-4 sm:px-8">
          <p className="absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-center text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-foreground">{STEP_LABELS[step - 1]}</span>{" "}
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
          {/* ---------------- STEP 1 — About you ---------------- */}
          {pane === "years" && (
            <Centered>
              <Heading center big title={`How many years have you worked in ${kind}?`} />
              <div className="mt-12 flex items-center justify-center gap-8">
                <Stepper value={years} setValue={(v) => setYears(Math.max(0, v))} />
              </div>
            </Centered>
          )}

          {pane === "expertise" && (
            <div className="w-full max-w-2xl">
              <Avatar name={displayName} />
              <Heading center title="Showcase your expertise" />
              <Sub center>Let guests know why you&apos;re a great host for this experience.</Sub>
              <div className="mt-10 flex flex-col gap-3">
                <ExpertiseRow
                  filled={Boolean(proTitle)}
                  filledIcon={<StarGlyph />}
                  title="Intro"
                  value={proTitle || "Add your professional title"}
                  onClick={() => setEditing("proTitle")}
                />
                <ExpertiseRow
                  filled={Boolean(qualifications)}
                  filledIcon={<CapGlyph />}
                  title="Qualifications"
                  value={qualifications || "Add your training and credentials"}
                  onClick={() => setEditing("qualifications")}
                />
                <ExpertiseRow
                  filled={Boolean(recognition)}
                  filledIcon={<TrophyGlyph />}
                  title={
                    <>
                      Recognition{" "}
                      <span className="font-normal text-zinc-500 dark:text-zinc-400">
                        (optional)
                      </span>
                    </>
                  }
                  value={recognition || "Add a career highlight"}
                  onClick={() => setEditing("recognition")}
                />
              </div>
            </div>
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
            <div className="w-full max-w-2xl">
              <Heading center title="Let us know a bit more about you" />
              <Sub center>
                This is required to comply with financial regulations and helps us
                prevent fraud.
              </Sub>
              <div className="mt-10">
                <h3 className="text-base font-semibold text-foreground">
                  What&apos;s your residential address?
                </h3>
                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Guests won&apos;t see this information.
                </p>
                <CountryField value={country} onChange={setCountry} />
                <div
                  className={`mt-3 rounded-xl border ${
                    addrTouched && (!street.trim() || !addrCity.trim() || !postal.trim())
                      ? "border-red-400"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <AddrField
                    first
                    label="Apt, floor, etc. (if applicable)"
                    value={apt}
                    onChange={setApt}
                  />
                  <AddrField
                    label="Street address"
                    value={street}
                    onChange={setStreet}
                    autocomplete
                    error={addrTouched && !street.trim()}
                    onPick={(p) => {
                      setStreet(p.street || p.label);
                      if (p.city) setAddrCity(p.city);
                      if (p.postal) setPostal(p.postal);
                      if (p.country) setCountry(p.country);
                    }}
                  />
                  <AddrField
                    label="City / town"
                    value={addrCity}
                    onChange={setAddrCity}
                    error={addrTouched && !addrCity.trim()}
                  />
                  <AddrField
                    label="Postal code"
                    value={postal}
                    onChange={setPostal}
                    error={addrTouched && !postal.trim()}
                  />
                </div>
                {addrTouched && (!street.trim() || !addrCity.trim() || !postal.trim()) && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                    <AlertGlyph />
                    {!street.trim()
                      ? "Street address is required."
                      : !addrCity.trim()
                        ? "City / town is required."
                        : "Postal code is required."}
                  </p>
                )}
                <h3 className="mt-8 text-base font-semibold text-foreground">
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
            </div>
          )}

          {/* ---------------- STEP 2 — Location ---------------- */}
          {pane === "meet-search" && (
            <div className="w-full max-w-3xl self-start pt-[10vh]">
              <Heading center big title="Where should guests meet you?" />
              <Sub center>Guests will see this address on your listing.</Sub>
              <div className="mx-auto mt-8 max-w-xl">
                <LocationSearchPanel
                  placeholder="Enter an address"
                  showCurrentLocation
                  autoFocus
                  onSelect={onMeetSelect}
                />
              </div>
            </div>
          )}

          {pane === "meet-confirm" && (
            <div className="w-full max-w-2xl">
              <Heading center big title="Confirm location" />
              <Sub center>
                Make sure this address is correct. You can&apos;t change it once
                you submit your listing.
              </Sub>
              <div className="mt-10">
                <CountryField value={meetCountry} onChange={setMeetCountry} />
                <div
                  className={`mt-3 rounded-xl border ${
                    meetTouched &&
                    (!meetStreet.trim() || !meetCity.trim() || !meetPostal.trim())
                      ? "border-red-400"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <AddrField
                    first
                    label="Apt, floor, etc. (if applicable)"
                    value={meetApt}
                    onChange={setMeetApt}
                  />
                  <AddrField
                    label="Street address"
                    value={meetStreet}
                    onChange={setMeetStreet}
                    error={meetTouched && !meetStreet.trim()}
                  />
                  <AddrField
                    label="City / town"
                    value={meetCity}
                    onChange={setMeetCity}
                    error={meetTouched && !meetCity.trim()}
                  />
                  <AddrField
                    label="Postal code"
                    value={meetPostal}
                    onChange={setMeetPostal}
                    error={meetTouched && !meetPostal.trim()}
                  />
                </div>
                {meetTouched &&
                  (!meetStreet.trim() || !meetCity.trim() || !meetPostal.trim()) && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                      <AlertGlyph />
                      {!meetStreet.trim()
                        ? "Street address is required."
                        : !meetCity.trim()
                          ? "City / town is required."
                          : "Postal code is required."}
                    </p>
                  )}
                <div className="mt-4 rounded-xl border border-zinc-300 dark:border-zinc-700">
                  <AddrField
                    first
                    label="Location name (optional)"
                    value={locationName}
                    onChange={setLocationName}
                  />
                </div>
              </div>
            </div>
          )}

          {pane === "meet-pin" && (
            <Centered wide>
              <Heading center big title="Is the pin in the right spot?" />
              <div className="mt-8">
                <ExperiencePinMap
                  lat={lat}
                  lon={lon}
                  onMove={(la, lo) => {
                    setLat(la);
                    setLon(lo);
                  }}
                />
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 3 — Photos ---------------- */}
          {pane === "photos" && (
            <Centered>
              <Heading center big title="Add unique photos of your experience" />
              <Sub center>
                Add at least 5 photos. Tap up to {MAX_COVERS} to feature as
                covers.
              </Sub>
              {photos.length === 0 ? (
                <div className="mt-10 flex flex-col items-center">
                  <div className="relative h-44 w-80">
                    {samples[0] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={samples[0]}
                          alt=""
                          className="absolute left-3 top-7 h-36 w-44 -rotate-6 rounded-2xl object-cover shadow-lg"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={samples[1]}
                          alt=""
                          className="absolute right-3 top-1 h-36 w-44 rotate-6 rounded-2xl object-cover shadow-lg"
                        />
                      </>
                    ) : (
                      <>
                        <div className="absolute left-6 top-6 h-32 w-40 -rotate-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                        <div className="absolute right-6 top-3 flex h-32 w-40 rotate-6 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300 dark:bg-zinc-800">
                          <PhotoGlyph />
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="mt-8 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
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
                        <TrashGlyph />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-foreground hover:text-foreground dark:border-zinc-700"
                  >
                    <PlusGlyph />
                  </button>
                </div>
              )}
            </Centered>
          )}

          {/* ---------------- STEP 4 — Itinerary ---------------- */}
          {pane === "itinerary-intro" && (
            <Centered>
              <div className="relative mx-auto flex max-w-sm flex-col gap-4">
                {/* Timeline connector running behind the cards. */}
                <div className="absolute bottom-10 left-[39px] top-10 w-px bg-zinc-200 dark:bg-zinc-700" />
                {[
                  { t: "Meet up", d: "10 mins", img: samples[0] },
                  { t: "Do the main activity", d: "45 mins", img: samples[1] },
                  { t: "Get customized tips", d: "15 mins", img: samples[2] },
                ].map((s) => (
                  <div
                    key={s.t}
                    className="relative flex items-center gap-3 rounded-2xl border border-zinc-200 bg-background p-3 shadow-sm dark:border-zinc-800"
                  >
                    {s.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.img}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800" />
                    )}
                    <span className="flex flex-col">
                      <span className="text-[15px] font-semibold text-foreground">{s.t}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.d}</span>
                    </span>
                  </div>
                ))}
              </div>
              <h1 className="mx-auto mt-10 max-w-lg text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Let guests know what they&apos;ll do with an itinerary
              </h1>
            </Centered>
          )}

          {pane === "itinerary" && (
            <Centered>
              <Heading center big title="Your itinerary" />
              <Sub center>Add up to 10 activities.</Sub>
              <div className="mt-8 flex flex-col gap-3">
                {itinerary.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivityOpen({ index: i })}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
                  >
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <PhotoGlyph small />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="font-medium text-foreground">
                        {a.title} · {formatMinutes(a.durationMinutes)}
                      </span>
                      {a.description && (
                        <span className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {a.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                {itinerary.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setActivityOpen({ index: null })}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      <PlusGlyph />
                    </span>
                    <span className="font-medium text-foreground">
                      {itinerary.length ? "Add activity" : "Add your first activity"}
                    </span>
                  </button>
                )}
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 5 — Pricing ---------------- */}
          {pane === "max-guests" && (
            <Centered>
              <Heading center big title="Add your maximum number of guests" />
              <div className="mt-12 flex items-center justify-center gap-8">
                <Stepper value={maxGuests} setValue={(v) => setMaxGuests(Math.max(1, v))} />
              </div>
            </Centered>
          )}

          {pane === "price" && (
            <Centered>
              <Heading center big title="Price per guest" />
              <div className="mt-12">
                <BigPriceInput symbol={sym} value={pricePerGuest} onChange={setPricePerGuest} />
              </div>
              {pricePerGuest > 0 && (
                <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Guests pay {sym}
                  {guestPays(pricePerGuest)} including the service fee
                </p>
              )}
              <div className="mt-8 flex justify-center gap-2">
                {(["USD", "EUR"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      currency === c
                        ? "border-foreground text-foreground"
                        : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    {CURRENCY_SYMBOL[c]} {c}
                  </button>
                ))}
              </div>
            </Centered>
          )}

          {pane === "private-min" && (
            <Centered>
              <Heading center big title="Private group minimum" />
              <Sub center>Bookings will start at this price.</Sub>
              <div className="mt-12">
                <BigPriceInput
                  symbol={sym}
                  value={privateGroupMinimum}
                  onChange={setPrivateGroupMinimum}
                />
              </div>
              {privateGroupMinimum > 0 && (
                <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Guests pay {sym}
                  {guestPays(privateGroupMinimum)} including the service fee
                </p>
              )}
            </Centered>
          )}

          {pane === "price-review" && (
            <Centered>
              <Heading center big title="Review your pricing" />
              <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="font-medium text-foreground">Price per guest</span>
                  <span className="text-lg font-semibold text-foreground">{sym}{pricePerGuest}</span>
                </div>
                <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Private group minimum</span>
                    <span className="text-lg font-semibold text-foreground">
                      {privateGroupMinimum ? `${sym}${privateGroupMinimum}` : "None"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Guests pay {sym}{pricePerGuest} per guest
                    {privateGroupMinimum ? `, with a private group minimum of ${sym}${privateGroupMinimum}` : ""}.
                  </p>
                </div>
              </div>
            </Centered>
          )}

          {pane === "discounts" && (
            <Centered>
              <Heading center big title="Add discounts" />
              <Sub center>
                We&apos;ll only apply one discount per booking, using the one with
                the biggest savings for guests.
              </Sub>
              <div className="mt-8 flex flex-col gap-3">
                <DiscountRow
                  applied={limitedTime}
                  percent={limitedTimePercent}
                  title="Limited-time"
                  subtitle="Offer a deal for the next 90 days to encourage your first guests to book."
                  onClick={() => setDiscountOpen("limitedTime")}
                />
                <DiscountRow
                  applied={earlyBird}
                  percent={earlyBirdPercent}
                  title="Early bird"
                  subtitle="Give a lower price to guests who book more than 2 weeks in advance."
                  onClick={() => setDiscountOpen("earlyBird")}
                />
              </div>
            </Centered>
          )}

          {/* ---------------- STEP 6 — Details ---------------- */}
          {pane === "details" && (
            <Centered>
              <Heading center big title="Share what you'll provide" />
              <Sub center>
                This helps us know if we need to do license, insurance, quality,
                and standards checks.
              </Sub>
              <div className="mt-8 space-y-8">
                {complianceQuestions.map((id) => (
                  <YesNoQuestion
                    key={id}
                    label={COMPLIANCE_QUESTIONS[id]}
                    value={details[id] ?? null}
                    onChange={(v) =>
                      setDetails((prev) => ({ ...prev, [id]: v }))
                    }
                  />
                ))}
                <div className="border-t border-zinc-200 pt-6 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <p className="font-semibold text-foreground">Requirements and terms</p>
                  <p className="mt-2">
                    By selecting &ldquo;I agree&rdquo;, you confirm you&apos;ve read and
                    agree to our experiences terms, host cancellation policy, and
                    privacy policy, and that you&apos;ll maintain any licenses and
                    insurance required to run this experience.
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

          {/* ---------------- STEP 7 — Experience title ---------------- */}
          {pane === "title-intro" && (
            <Centered>
              <div className="flex justify-center">
                <TitlePreview category={category} name={displayName} cover={photos[0]} />
              </div>
              <Heading center big title="Add an experience title and description" />
              <Sub center>
                We&apos;ll share some options to get you started, then you&apos;ll
                choose one and make it your own.
              </Sub>
            </Centered>
          )}

          {pane === "title" && (
            <Centered wide>
              <Heading center big title="Choose one and make it your own" />
              {aiBusy && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <SparkleGlyph />
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
            {(pane === "profiles" || pane === "private-min") && (
              <button
                type="button"
                onClick={() => {
                  if (pane === "private-min") setPrivateGroupMinimum(0);
                  next();
                }}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Skip
              </button>
            )}
            {pane === "details" ? (
              <PrimaryButton disabled={!detailsComplete} onClick={next}>
                I agree
              </PrimaryButton>
            ) : pane === "title" ? (
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
        <ExperienceTextModal
          title={
            editing === "proTitle"
              ? "Add your professional title"
              : editing === "qualifications"
                ? "Add your training and credentials"
                : "Add a career highlight"
          }
          placeholder={
            editing === "proTitle"
              ? "Founder and running coach"
              : editing === "qualifications"
                ? "Certified instructor with 10+ years of experience"
                : "Featured in a local magazine"
          }
          value={
            editing === "proTitle"
              ? proTitle
              : editing === "qualifications"
                ? qualifications
                : recognition
          }
          max={editing === "proTitle" ? 40 : 150}
          onCancel={() => setEditing(null)}
          onSave={(v) => {
            if (editing === "proTitle") setProTitle(v);
            else if (editing === "qualifications") setQualifications(v);
            else setRecognition(v);
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

      {photoOpen && (
        <ExperiencePhotoModal
          onClose={() => setPhotoOpen(false)}
          onAdd={(urls) => {
            setPhotos((a) => [...a, ...urls]);
            setPhotoOpen(false);
          }}
        />
      )}

      {activityOpen && (
        <ActivityModal
          existing={activityOpen.index !== null ? itinerary[activityOpen.index] : null}
          experiencePhotos={photos}
          onCancel={() => setActivityOpen(null)}
          onRemove={
            activityOpen.index !== null
              ? () => {
                  setItinerary((a) => a.filter((_, j) => j !== activityOpen.index));
                  setActivityOpen(null);
                }
              : undefined
          }
          onSave={(a) => {
            setItinerary((list) => {
              if (activityOpen.index !== null) {
                const copy = [...list];
                copy[activityOpen.index] = a;
                return copy;
              }
              return [...list, a];
            });
            setActivityOpen(null);
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
          pricePerGuest={pricePerGuest}
          sym={sym}
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
// Photo upload modal (experience) — enforces a resolution floor (MIN_PHOTO_PX)
// ---------------------------------------------------------------------------

function ExperiencePhotoModal({
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
            {staged.length
              ? `${staged.length} ${staged.length === 1 ? "item" : "items"} selected`
              : "No items selected"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="Add more"
        >
          <PlusGlyph />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {staged.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-foreground dark:border-zinc-700"
          >
            <PhotoGlyph />
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
                    <TrashGlyph />
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

// ---------------------------------------------------------------------------
// Itinerary activity modal — multi-step (title → describe → duration → photo)
// ---------------------------------------------------------------------------

function ActivityModal({
  existing,
  experiencePhotos,
  onSave,
  onCancel,
  onRemove,
}: {
  existing: ExperienceActivity | null;
  experiencePhotos: string[];
  onSave: (a: ExperienceActivity) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const SUBS = 4;
  const [sub, setSub] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [duration, setDuration] = useState(existing?.durationMinutes ?? 60);
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    setUploading(false);
    if (url) setImageUrl(url);
  }

  const heading =
    sub === 0
      ? existing
        ? "Title your activity"
        : "Title your first activity"
      : sub === 1
        ? "Describe what guests will do"
        : sub === 2
          ? "Set a duration"
          : "Choose a photo";
  const canNext =
    sub === 0
      ? title.trim().length >= 2
      : sub === 1
        ? description.trim().length >= 30
        : true;

  function commit() {
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes: duration,
      imageUrl: imageUrl || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] min-h-[560px] w-full max-w-2xl flex-col rounded-3xl bg-background shadow-2xl dark:border dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: back + close only */}
        <div className="flex items-center justify-between p-5">
          {sub > 0 ? (
            <button
              type="button"
              onClick={() => setSub((s) => s - 1)}
              aria-label="Back"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          ) : (
            <span className="w-8" />
          )}
          <CloseButton onClick={onCancel} />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-2 sm:px-12">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h2>

          <div className="flex flex-1 flex-col items-center justify-center py-8">
            {sub === 0 && (
              <input
                autoFocus
                value={title}
                maxLength={35}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meet up"
                className="w-full bg-transparent text-center text-4xl font-bold text-foreground outline-none placeholder:text-zinc-300 sm:text-5xl"
              />
            )}

            {sub === 1 && (
              <div className="w-full">
                <p className="mb-8 text-center text-3xl font-bold text-foreground sm:text-4xl">
                  {title}
                </p>
                <textarea
                  autoFocus
                  value={description}
                  rows={3}
                  maxLength={400}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    'Add details about the activity. For example, "We\'ll share our running route and warm up together."'
                  }
                  className="w-full resize-none bg-transparent text-center text-lg text-foreground outline-none placeholder:text-zinc-400"
                />
              </div>
            )}

            {sub === 2 && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-8">
                  <button
                    type="button"
                    onClick={() => setDuration((d) => Math.max(5, d - 5))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 text-foreground transition-colors hover:border-foreground dark:border-zinc-700"
                    aria-label="Decrease"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <span className="w-28 text-center text-6xl font-bold text-foreground">{duration}</span>
                  <button
                    type="button"
                    onClick={() => setDuration((d) => d + 5)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 text-foreground transition-colors hover:border-foreground dark:border-zinc-700"
                    aria-label="Increase"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
                <span className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Minutes</span>
              </div>
            )}

            {sub === 3 && (
              <div className="w-full">
                <div className="mx-auto mb-6 flex max-w-sm items-center gap-3 rounded-2xl border border-zinc-200 p-3 shadow-sm dark:border-zinc-800">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-foreground dark:bg-zinc-800">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookGlyph />
                    )}
                  </span>
                  <span className="font-semibold text-foreground">{title || "Activity"}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {experiencePhotos.map((url, i) => {
                    const selected = imageUrl === url;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageUrl(url)}
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                          selected ? "border-foreground" : "border-transparent"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-foreground hover:text-foreground dark:border-zinc-700">
                    {uploading ? <span className="text-xs">Uploading…</span> : <PlusGlyph />}
                    <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                  </label>
                </div>
                {experiencePhotos.length === 0 && (
                  <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Upload a photo for this activity, or add experience photos first.
                  </p>
                )}
              </div>
            )}
          </div>

          {(sub === 0 || sub === 1) && (
            <p className="text-center text-sm text-zinc-400">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                {sub === 0 ? `${title.length}/35` : `${description.length}/30`}
              </span>{" "}
              {sub === 0 ? "available" : "required characters"}
            </p>
          )}
        </div>

        {/* Progress segments */}
        <div className="flex gap-1.5 px-6 pt-3">
          {Array.from({ length: SUBS }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= sub ? "bg-foreground" : "bg-zinc-200 dark:bg-zinc-800"}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5">
          <button
            type="button"
            onClick={onRemove ?? onCancel}
            className="text-sm font-medium text-foreground"
          >
            {onRemove ? "Remove" : "Cancel"}
          </button>
          {sub < SUBS - 1 ? (
            <button
              type="button"
              onClick={() => setSub((s) => s + 1)}
              disabled={!canNext}
              className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={commit}
              className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Single-field text modal (Intro / Qualifications / Recognition) styled like
 * Airbnb: large, tall, with the title shown big inside the body and the input
 * vertically centered. Local so the shared service TextModal is untouched.
 */
function ExperienceTextModal({
  title,
  value,
  max,
  placeholder,
  onSave,
  onCancel,
}: {
  title: string;
  value: string;
  max: number;
  placeholder?: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <ModalShell onClose={onCancel} size="lg">
      <div className="flex justify-end px-4 pt-4">
        <CloseButton onClick={onCancel} />
      </div>
      <div className="flex min-h-[340px] flex-1 flex-col px-8 pb-2">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <div className="flex flex-1 items-center justify-center py-6">
          <textarea
            autoFocus
            value={v}
            maxLength={max}
            rows={2}
            onChange={(e) => setV(e.target.value)}
            placeholder={placeholder ?? "Type here…"}
            className="w-full resize-none bg-transparent text-center text-2xl text-foreground outline-none placeholder:text-zinc-300"
          />
        </div>
        <p className="text-center text-sm text-zinc-400">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">
            {v.length}/{max}
          </span>{" "}
          available
        </p>
      </div>
      <ModalFooter onCancel={onCancel} onSave={() => onSave(v.trim())} saveDisabled={!v.trim()} />
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

// ---------------------------------------------------------------------------
// Yes / No question (step 6 — details)
// ---------------------------------------------------------------------------

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        <ChoiceButton selected={value === true} onClick={() => onChange(true)}>
          Yes
        </ChoiceButton>
        <ChoiceButton selected={value === false} onClick={() => onChange(false)}>
          No
        </ChoiceButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review (dark publish screen)
// ---------------------------------------------------------------------------

type ExpIconName = (typeof STEP_ICONS)[number];

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
  rows: { label: string; value: string; icon: ExpIconName }[];
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
            If your listing meets our requirements, we&apos;ll let you know. It
            will be published one week later.
          </p>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <ExpStepIcon name={r.icon} />
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
          By requesting to publish, you agree to the Experiences terms and attest
          all details are accurate.
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
// Small pieces
// ---------------------------------------------------------------------------

/**
 * A single stacked address field with Airbnb's focus highlight — the focused
 * field lifts above its neighbours with a dark rounded border. Optionally shows
 * inline address suggestions (used for "Street address").
 */
function AddrField({
  label,
  value,
  onChange,
  first,
  autocomplete,
  onPick,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  first?: boolean;
  autocomplete?: boolean;
  onPick?: (place: GeoPlace) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`relative ${
        first
          ? ""
          : `border-t ${error ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"}`
      }`}
    >
      <label
        className={`block cursor-text px-4 py-3 transition ${
          error
            ? "relative z-10 bg-red-50 dark:bg-red-950/20"
            : "rounded-xl focus-within:relative focus-within:z-10 focus-within:ring-2 focus-within:ring-foreground"
        }`}
      >
        <span
          className={`block text-xs ${
            error ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {label}
        </span>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (autocomplete) setOpen(true);
          }}
          onFocus={() => autocomplete && setOpen(true)}
          className="w-full bg-transparent text-base text-foreground outline-none"
        />
      </label>
      {autocomplete && open && (
        <InlineSuggestions
          query={value}
          onPick={(p) => {
            onPick?.(p);
            setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** Country / region box (separate, with a select-style chevron) like Airbnb. */
function CountryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-300 transition focus-within:z-10 focus-within:ring-2 focus-within:ring-foreground dark:border-zinc-700">
      <label className="flex cursor-text items-center gap-2 rounded-xl px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">Country / region</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-base text-foreground outline-none"
          />
        </span>
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </label>
    </div>
  );
}

/**
 * "Showcase your expertise" row — shows a "+" while empty and the category icon
 * once filled, like Airbnb. Local to the experience flow so the shared service
 * RowButton stays untouched.
 */
function ExpertiseRow({
  filled,
  filledIcon,
  title,
  value,
  onClick,
}: {
  filled: boolean;
  filledIcon: React.ReactNode;
  title: React.ReactNode;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition-colors hover:border-foreground dark:border-zinc-800"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-foreground dark:bg-zinc-800">
        {filled ? filledIcon : <PlusGlyph />}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold text-foreground">{title}</span>
        <span className={`text-sm ${filled ? "text-foreground" : "text-zinc-500 dark:text-zinc-400"}`}>
          {value}
        </span>
      </span>
      <ChevronGlyph />
    </button>
  );
}

function BigPriceInput({
  symbol,
  value,
  onChange,
}: {
  symbol: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const digits = Math.max(1, String(value || 0).length);
  return (
    <div className="flex items-center justify-center">
      <span className="text-5xl font-bold text-foreground sm:text-7xl">{symbol}</span>
      <input
        type="number"
        min={0}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        placeholder="0"
        autoFocus
        style={{ width: `${digits + 1}ch` }}
        className="bg-transparent text-center text-5xl font-bold text-foreground outline-none placeholder:text-zinc-300 sm:text-7xl"
      />
    </div>
  );
}

function TitlePreview({
  category,
  name,
  cover,
}: {
  category: string;
  name: string;
  cover?: string;
}) {
  const cat = findExperienceCategory(category);
  return (
    <div className="w-60 rounded-3xl border border-zinc-200 bg-background p-3 shadow-2xl dark:border-zinc-800">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          cat && (
            <span className="flex h-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.icon} alt="" className="h-16 w-16 object-contain" />
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
// Icons (experience rail + local glyphs)
// ---------------------------------------------------------------------------

function ExpStepIcon({ name }: { name: ExpIconName }) {
  const c = "h-5 w-5";
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "person":
      return <svg viewBox="0 0 24 24" className={c} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "pin":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "image":
      return <svg viewBox="0 0 24 24" className={c} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
    case "itinerary":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M12 5v15M5 7v13M19 7v13" /><path d="M12 5a4 3 0 0 0-7 2 4 3 0 0 0 7-2 4 3 0 0 1 7 2 4 3 0 0 1-7-2Z" /></svg>;
    case "pricing":
      return <svg viewBox="0 0 24 24" className={c} {...p}><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.25" /></svg>;
    case "details":
      return <svg viewBox="0 0 24 24" className={c} {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
    case "experience":
      return <svg viewBox="0 0 24 24" className={c} {...p}><circle cx="12" cy="12" r="9" /><path d="M2.5 12h19M12 2.5c2.5 2.5 3.8 6 3.8 9.5S14.5 19 12 21.5C9.5 19 8.2 15.5 8.2 12S9.5 5 12 2.5Z" /></svg>;
    default:
      return null;
  }
}

function PlusGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function TrashGlyph() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
}
function SparkleGlyph() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.95 2.55L22.5 17.5l-2.55.95L19 21l-.95-2.55L15.5 17.5l2.55-.95L19 14z" /></svg>;
}
function PhotoGlyph({ small }: { small?: boolean }) {
  return <svg viewBox="0 0 24 24" className={small ? "h-5 w-5 text-zinc-400" : "h-12 w-12"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
}
function ChevronGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
}
function AlertGlyph() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>;
}
function BookGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v14M5 5v13M19 5v13" /><path d="M12 6a4 3 0 0 0-7 1.5 4 3 0 0 0 7-1.5 4 3 0 0 1 7 1.5 4 3 0 0 1-7-1.5Z" /></svg>;
}
function StarGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 17l-5.4 2.6 1-6L3.3 9.4l6-.9z" /></svg>;
}
function CapGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 9-10-5L2 9l10 5 10-5z" /><path d="M6 11v5a6 3 0 0 0 12 0v-5" /></svg>;
}
function TrophyGlyph() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0zM6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 18h6M10 14v4M14 14v4M8 21h8" /></svg>;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} mins`;
  const h = mins / 60;
  const label = Number.isInteger(h) ? `${h}` : h.toFixed(1);
  return `${label} hr${mins >= 120 ? "s" : ""}`;
}
