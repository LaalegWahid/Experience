
/**
 * A snapshot of the wizard's client state, persisted (localStorage + the draft's
 * metadata) so an in-progress listing resumes exactly where the host left off —
 * including `index`, the step they stopped on.
 */
export type WizardSnapshot = {
  draftId?: string | null;
  index?: number;
  /** Service category chosen in the first pane ("Other" stored empty in the DB). */
  category?: string;
  years?: number;
  experience?: string;
  degree?: string;
  career?: string;
  profiles?: string[];
  country?: string;
  apt?: string;
  street?: string;
  addrCity?: string;
  postal?: string;
  asBusiness?: boolean | null;
  travels?: boolean;
  comeTo?: boolean;
  startLocation?: string;
  driveMinutes?: number;
  photos?: string[];
  covers?: string[];
  offers?: WizardOffering[];
  currency?: "USD" | "EUR";
  hours?: { days: number[]; from: string; to: string }[];
  limitedTime?: boolean;
  earlyBird?: boolean;
  limitedTimePercent?: number;
  earlyBirdPercent?: number;
  transporting?: boolean | null;
  cancellationPolicy?: "flexible" | "moderate" | "strict";
  title?: string;
  description?: string;
};

export type WizardOffering = {
  name: string;
  description?: string;
  imageUrl?: string;
  typeOfService?: string;
  price: number; // major units (USD/EUR)
  pricingType: "per_person" | "per_booking";
  capacity: number;
  durationMinutes: number;
};

/** One activity in an experience's itinerary. */
export type ExperienceActivity = {
  title: string;
  description?: string;
  durationMinutes: number;
  imageUrl?: string;
};

/**
 * A snapshot of the experience wizard's client state, persisted like
 * {@link WizardSnapshot} so an in-progress experience listing can resume.
 */
export type ExperienceSnapshot = {
  draftId?: string | null;
  index?: number;
  years?: number;
  proTitle?: string;
  qualifications?: string;
  recognition?: string;
  profiles?: string[];
  country?: string;
  apt?: string;
  street?: string;
  addrCity?: string;
  postal?: string;
  asBusiness?: boolean | null;
  // Step 2 — meeting point (separate from the private residential address).
  meetCountry?: string;
  meetApt?: string;
  meetStreet?: string;
  meetCity?: string;
  meetPostal?: string;
  locationName?: string;
  lat?: number;
  lon?: number;
  photos?: string[];
  covers?: string[];
  itinerary?: ExperienceActivity[];
  maxGuests?: number;
  pricePerGuest?: number;
  privateGroupMinimum?: number;
  currency?: "USD" | "EUR";
  limitedTime?: boolean;
  earlyBird?: boolean;
  limitedTimePercent?: number;
  earlyBirdPercent?: number;
  /** Step 6 answers, keyed by compliance-question id (see experience-compliance). */
  details?: Record<string, boolean>;
  cancellationPolicy?: "flexible" | "moderate" | "strict";
  title?: string;
  description?: string;
};

export type ListingDraftInput = {
  type: "service" | "experience";
  category: string;
  title: string;
  description?: string;
  /** Payment currency — USD or EUR only. */
  currency: "USD" | "EUR";

  // Step 1 — About you
  yearsOfExperience?: number;
  experience?: string;
  degree?: string;
  careerHighlight?: string;
  onlineProfiles?: string[];
  residentialAddress?: {
    country?: string;
    line?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  };
  hostingAsBusiness?: boolean;

  // Step 2 — Location
  travelsToGuests?: boolean;
  guestsComeToHost?: boolean;
  startingLocation?: string;
  driveTimeMinutes?: number;
  city?: string;

  // Step 3 — Photos
  photos: string[];
  /** Photos the host marked as cover images (subset of `photos`, max 5). */
  coverPhotos?: string[];

  // Step 4 — Offerings / hours / discounts
  offerings: WizardOffering[];
  businessHours?: { days: number[]; from: string; to: string }[];
  discounts?: {
    limitedTime?: boolean;
    earlyBird?: boolean;
    limitedTimePercent?: number;
    earlyBirdPercent?: number;
    largeGroup?: { minGuests: number; percent: number }[];
  };

  // Step 5 — Details / legal
  transportingGuests?: boolean;
  /**
   * Experience-only: the "Share what you'll provide" answers, keyed by
   * compliance-question id (the question set depends on category/sub-type).
   */
  experienceDetails?: Record<string, boolean>;
  /** Cancellation preset applied to the listing (defaults to "flexible"). */
  cancellationPolicy?: "flexible" | "moderate" | "strict";

  // ── Experience listings only ────────────────────────────────────────────
  /** Ordered itinerary activities. */
  itinerary?: ExperienceActivity[];
  /** Max number of guests per experience booking. */
  maxGuests?: number;
  /** Price charged per guest (major units). */
  pricePerGuest?: number;
  /** Minimum total charge for a private group booking. */
  privateGroupMinimum?: number;
  /** Whether the experience takes place at a national park. */
  atNationalPark?: boolean;

  /** Wizard state snapshot, stored on in-progress drafts so they can resume. */
  draftState?: WizardSnapshot | ExperienceSnapshot;
};
