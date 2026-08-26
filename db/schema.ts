import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/** A provider is either a single person or a business/studio/agency. */
export const providerTypeEnum = pgEnum("provider_type", [
  "individual",
  "business",
]);

/** The two high-level offering kinds from the brief. */
export const offeringTypeEnum = pgEnum("offering_type", [
  "service",
  "experience",
]);

/** Listing lifecycle. `draft` is private to the host; `published` is public. */
export const offeringStatusEnum = pgEnum("offering_status", [
  "draft",
  "published",
  "archived",
]);

/** Group structure of an offering (orthogonal to where it happens). */
export const offeringFormatEnum = pgEnum("offering_format", [
  "public_group",
  "private_group",
  "one_on_one",
  "class_workshop",
]);

/** Where the offering takes place. Drives whether we need a location vs a service area. */
export const locationTypeEnum = pgEnum("location_type", [
  "at_host",
  "at_guest",
  "online",
]);

/** Whether the price is charged per guest or as a flat fee per booking. */
export const pricingTypeEnum = pgEnum("pricing_type", [
  "per_person",
  "per_booking",
]);

export type OfferingMetadata = {
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
  travelsToGuests?: boolean;
  guestsComeToHost?: boolean;
  driveTimeMinutes?: number;
  startingLocation?: string;
  businessHours?: { days: number[]; from: string; to: string }[];
  discounts?: {
    limitedTime?: boolean;
    earlyBird?: boolean;
    /** Percent off for the limited-time deal (host-set, 1-90). */
    limitedTimePercent?: number;
    /** Percent off for early-bird bookings (host-set, 1-90). */
    earlyBirdPercent?: number;
    largeGroup?: { minGuests: number; percent: number }[];
  };
  transportingGuests?: boolean;
  /**
   * Experience "Share what you'll provide" answers, keyed by compliance-question
   * id (the shown set depends on category/sub-type). Drives our license /
   * insurance / quality / standards checks.
   */
  experienceDetails?: Record<string, boolean>;
  // ── Experience listings (parallel of the service fields above) ──────────
  /** Ordered itinerary activities shown to guests. */
  itinerary?: {
    title: string;
    description?: string;
    durationMinutes: number;
    imageUrl?: string;
  }[];
  /** Minimum total charge for a private group booking. */
  privateGroupMinimum?: number;
  /** Whether the experience takes place at a national park (compliance). */
  atNationalPark?: boolean;
  agreedToTerms?: boolean;
  /**
   * Moderation state once the host requests to publish. A submitted listing
   * stays `draft` (hidden from guests) with this set to `pending` until an admin
   * approves it (`approved` + status `published`) or sends it back (`rejected`).
   */
  moderationStatus?: "pending" | "approved" | "rejected";
  /** True while the listing is still being built in the wizard (not finished). */
  inProgress?: boolean;
  /**
   * Snapshot of the wizard's client state (incl. the step the host stopped on)
   * so an in-progress draft can be resumed from the DB on any device. Only kept
   * while `inProgress`; cleared when the listing is finished.
   */
  draftState?: Record<string, unknown>;
};

/** Reusable cancellation presets. Can graduate to its own table for the API. */
export const cancellationPolicyEnum = pgEnum("cancellation_policy", [
  "flexible",
  "moderate",
  "strict",
]);

/** Availability slot lifecycle. */
export const slotStatusEnum = pgEnum("slot_status", [
  "open",
  "closed",
  "cancelled",
]);

/** How a provider receives their payout. */
export const payoutMethodTypeEnum = pgEnum("payout_method_type", [
  "bank",
  "crypto",
]);

/** Blockchain networks supported for stablecoin payouts. */
export const payoutChainEnum = pgEnum("payout_chain", [
  "ethereum",
  "polygon",
  "base",
  "arbitrum",
  "optimism",
  "tron",
  "solana",
]);

/** Supported stablecoins (the only crypto we pay out in for now). */
export const stablecoinEnum = pgEnum("stablecoin", ["USDC", "USDT"]);

/**
 * Lifecycle of a referrer's commission on a referred booking.
 * `pending`  — booking checked out, payment not yet settled.
 * `owed`     — payment settled; the platform owes the referrer their cut.
 * `paid`     — an admin has paid the referrer out (stamps `paidAt`).
 * `reversed` — the booking was refunded, so the commission is voided.
 */
export const referralEarningStatusEnum = pgEnum("referral_earning_status", [
  "pending",
  "owed",
  "paid",
  "reversed",
]);

/** Why a guest is reporting a host for a past or canceled appointment. */
export const reportReasonEnum = pgEnum("report_reason", [
  "no_show",
  "inappropriate",
  "safety",
  "scam",
  "other",
]);

/** Moderation lifecycle of a guest's report. */
export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewed",
  "dismissed",
]);


export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  type: providerTypeEnum("type").notNull().default("individual"),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  // Collected during host onboarding.
  dateOfBirth: date("date_of_birth"),
  city: text("city"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


/** A fixed physical place (used by `at_host` offerings). */
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  region: text("region"),
  postalCode: text("postal_code"),
  country: text("country"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const offerings = pgTable(
  "offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    type: offeringTypeEnum("type").notNull(),
    status: offeringStatusEnum("status").notNull().default("draft"),

    title: text("title").notNull(),
    // URL-friendly identifier reserved for the future public detail page / API.
    slug: text("slug").notNull().unique(),
    description: text("description"),

    category: text("category"),
    subcategory: text("subcategory"),

    format: offeringFormatEnum("format").notNull().default("public_group"),
    locationType: locationTypeEnum("location_type").notNull().default("at_host"),

    // Money is stored as integer minor units (e.g. cents) — never floats.
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    pricingType: pricingTypeEnum("pricing_type").notNull().default("per_person"),

    durationMinutes: integer("duration_minutes").notNull().default(60),
    capacity: integer("capacity").notNull().default(1),
    // How long before a slot starts bookings are cut off, in minutes.
    bookingCutoffMinutes: integer("booking_cutoff_minutes").notNull().default(0),

    includedItems: jsonb("included_items")
      .$type<string[]>()
      .notNull()
      .default([]),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    qualifications: text("qualifications"),

    cancellationPolicy: cancellationPolicyEnum("cancellation_policy")
      .notNull()
      .default("flexible"),

    // Optional fixed location (for `at_host`). Mobile providers use serviceAreas.
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),

    // Hero/profile image for the listing's detail page.
    coverImageUrl: text("cover_image_url"),

    // Wizard extras (see OfferingMetadata) that don't warrant their own columns.
    metadata: jsonb("metadata").$type<OfferingMetadata>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("offerings_provider_id_idx").on(table.providerId),
    index("offerings_status_idx").on(table.status),
  ],
);


// A priced choice within an offering's menu (e.g. a specific haircut).
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),
    imageUrl: text("image_url"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("menu_items_offering_id_idx").on(table.offeringId)],
);


export const serviceAreas = pgTable("service_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => offerings.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  centerLat: doublePrecision("center_lat"),
  centerLng: doublePrecision("center_lng"),
  radiusKm: integer("radius_km"),
  // Max road time (minutes) the host will travel to a guest. Capped at 120.
  maxTravelMinutes: integer("max_travel_minutes").notNull().default(120),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


// Offering media (photos)
export const offeringMedia = pgTable(
  "offering_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("offering_media_offering_id_idx").on(table.offeringId)],
);


export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(1),
    bookedCount: integer("booked_count").notNull().default(0),
    status: slotStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("availability_slots_offering_id_starts_at_idx").on(
      table.offeringId,
      table.startsAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Recurring weekly availability
// ---------------------------------------------------------------------------

/**
 * The host's recurring weekly availability pattern: "on these weekdays I'm
 * available during this time window", repeating every week until edited. This
 * is the source of truth the host manages. The booking flow (later slice)
 * materializes concrete `availability_slots` from these rules for given dates.
 *
 * One row per available weekday (the MVP supports a single window per day).
 */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // ISO-8601 weekday: 1 = Monday ... 7 = Sunday.
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("availability_rules_offering_id_idx").on(table.offeringId),
  ],
);

// ---------------------------------------------------------------------------
// Payout methods
// ---------------------------------------------------------------------------

/**
 * Where the platform sends a provider's share after collecting a guest payment.
 * One method per provider for the MVP (`type` selects which set of columns is
 * used: bank RIB/IBAN or a stablecoin wallet).
 *
 * NOTE: bank details (IBAN/BIC) and wallet addresses are sensitive. For the MVP
 * they are stored directly; in production raw bank details should be handed to
 * the payment provider (e.g. Stripe Connect) rather than persisted here.
 */
export const payoutMethods = pgTable("payout_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .unique()
    .references(() => providers.id, { onDelete: "cascade" }),
  type: payoutMethodTypeEnum("type").notNull(),

  // Bank (RIB / IBAN)
  accountHolderName: text("account_holder_name"),
  iban: text("iban"),
  bic: text("bic"),
  bankName: text("bank_name"),
  country: text("country"),

  // Crypto (stablecoin)
  walletAddress: text("wallet_address"),
  chain: payoutChainEnum("chain"),
  stablecoin: stablecoinEnum("stablecoin"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Messaging — a lightweight chat between a guest and an offering's host.
// One conversation per (offering, guest); `senderId` records who wrote each
// message (the guest or the host).
// ---------------------------------------------------------------------------
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // The guest side of the conversation.
    guestId: text("guest_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Who actually sent this message (guest or host).
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_offering_guest_idx").on(
      table.offeringId,
      table.guestId,
      table.createdAt,
    ),
  ],
);


// ---------------------------------------------------------------------------
// Favorites — a guest's saved/wishlisted offerings.
// ---------------------------------------------------------------------------
export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // A user can favorite a given offering at most once.
    uniqueIndex("favorites_user_offering_idx").on(
      table.userId,
      table.offeringId,
    ),
  ],
);


// ---------------------------------------------------------------------------
// Bookings — a guest's appointment for an offering at a specific time.
// ---------------------------------------------------------------------------
export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "completed",
  // Auto-set once the appointment time has passed.
  "executed",
  "canceled",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // The specific menu choice booked, when the service has a menu.
    menuItemId: uuid("menu_item_id").references(() => menuItems.id, {
      onDelete: "set null",
    }),
    appointmentAt: timestamp("appointment_at", {
      withTimezone: true,
    }).notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    priceCents: integer("price_cents").notNull(),
    // Amount refunded to the guest on cancellation (per the offering's policy).
    refundedCents: integer("refunded_cents").notNull().default(0),
    currency: text("currency").notNull(),
    stripeSessionId: text("stripe_session_id"),
    // Set by the Stripe webhook once payment actually succeeds — the
    // authoritative proof of payment (vs. the optimistic booking row).
    paidAt: timestamp("paid_at", { withTimezone: true }),
    // When Gathra paid the host their share for this reservation. Null means the
    // payout is still owed ("unpaid"); an admin stamps this once they pay out.
    hostPaidAt: timestamp("host_paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_user_appt_idx").on(table.userId, table.appointmentAt),
  ],
);


// ---------------------------------------------------------------------------
// Reviews — a guest's rating of a service after the appointment took place.
// One review per booking; surfaced to the host on their listing page.
// ---------------------------------------------------------------------------
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1–5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reviews_offering_id_idx").on(table.offeringId)],
);


// ---------------------------------------------------------------------------
// Guest reviews — the other direction: a host's rating of the guest after the
// service. One per booking; surfaced to the host (and the guest's reputation).
// ---------------------------------------------------------------------------
export const guestReviews = pgTable(
  "guest_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // The guest being reviewed.
    guestUserId: text("guest_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The host who wrote the review.
    hostUserId: text("host_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1–5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("guest_reviews_guest_user_id_idx").on(table.guestUserId)],
);


// ---------------------------------------------------------------------------
// Reports — a guest flagging a host over a completed or canceled appointment.
// Surfaced to admins for moderation. One report per booking.
// ---------------------------------------------------------------------------
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // The guest who filed the report.
    reporterUserId: text("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The host being reported.
    hostUserId: text("host_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details"),
    status: reportStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reports_host_user_id_idx").on(table.hostUserId)],
);


// ---------------------------------------------------------------------------
// API keys — credentials a developer uses to call the public /api/v1 from
// external apps. The raw key is shown once at creation and never stored; only
// its SHA-256 hash is kept. Calls made with a key act as the key's owner.
// ---------------------------------------------------------------------------
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Shown in the dashboard to identify a key, e.g. "lm_live_a1b2c3d4…".
    prefix: text("prefix").notNull(),
    // SHA-256 hex of the full key — the only copy we keep.
    keyHash: text("key_hash").notNull().unique(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default(["read"]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("api_keys_user_id_idx").on(table.userId)],
);

// ---------------------------------------------------------------------------
// Service referrals — any signed-in user generates a single-use link
// (`/refer/<token>`) pointing at a specific published service. Opening a valid
// link routes the invitee through sign-up onto that service's page; the link is
// redeemed when the invitee pays for that service, and the referrer earns a cut
// (see referral_earnings). The link expires 24h after it is created.
//
// The token is stored raw (not hashed): it is low-sensitivity (it only points
// at a public service page) and keeping it lets the referrer re-copy an active
// link. A referrer must have a payout method on file before they can create one.
// ---------------------------------------------------------------------------
export const serviceReferrals = pgTable(
  "service_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The specific service this link promotes.
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    // The opaque secret embedded in the invite URL.
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    // Set once, when the invitee pays for the service — makes it single-use.
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedByUserId: text("redeemed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("service_referrals_referrer_idx").on(table.referrerUserId),
    index("service_referrals_offering_idx").on(table.offeringId),
  ],
);

// ---------------------------------------------------------------------------
// Referrer payout methods — where a referrer's commissions are paid. Mirrors
// payout_methods, but keyed to a plain user (referrers needn't be hosts). One
// method per user; `type` selects which column set is used (bank or wallet).
// ---------------------------------------------------------------------------
export const referrerPayoutMethods = pgTable("referrer_payout_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  type: payoutMethodTypeEnum("type").notNull(),

  // Bank (RIB / IBAN)
  accountHolderName: text("account_holder_name"),
  iban: text("iban"),
  bic: text("bic"),
  bankName: text("bank_name"),
  country: text("country"),

  // Crypto (stablecoin)
  walletAddress: text("wallet_address"),
  chain: payoutChainEnum("chain"),
  stablecoin: stablecoinEnum("stablecoin"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Referral earnings — the commission a referrer earns when their link results
// in a paid booking. Created `pending` at checkout, promoted to `owed` once the
// payment settles (Stripe webhook / synchronous crypto), `reversed` on refund,
// and `paid` when an admin manually pays the referrer out. `reference` holds the
// Stripe PaymentIntent id (or on-chain tx) so the webhook can reconcile status.
// ---------------------------------------------------------------------------
export const referralEarnings = pgTable(
  "referral_earnings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referralId: uuid("referral_id").references(() => serviceReferrals.id, {
      onDelete: "set null",
    }),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    offeringId: uuid("offering_id").references(() => offerings.id, {
      onDelete: "set null",
    }),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    status: referralEarningStatusEnum("status").notNull().default("pending"),
    // Stripe PaymentIntent id or on-chain tx — reconciles status from webhooks.
    reference: text("reference"),
    // Stamped by an admin once the referrer has actually been paid.
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("referral_earnings_referrer_idx").on(table.referrerUserId),
    index("referral_earnings_reference_idx").on(table.reference),
  ],
);

// ---------------------------------------------------------------------------
// Transactions — a unified ledger of every guest payment, regardless of rail.
// Card payments go through Stripe; crypto payments are USDC transfers (either
// the on-page wallet flow or the x402 API). Each row is the authoritative
// record surfaced to admins; `reference` holds the Stripe PaymentIntent id or
// the on-chain tx hash so webhooks/settlement can reconcile status later.
// ---------------------------------------------------------------------------
export const paymentMethodEnum = pgEnum("payment_method", ["stripe", "crypto"]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The offering/booking paid for. Kept loosely coupled (set null) so a
    // deleted listing or booking never erases the financial record.
    offeringId: uuid("offering_id").references(() => offerings.id, {
      onDelete: "set null",
    }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    method: paymentMethodEnum("method").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    // Total charged in minor units (incl. the service fee) — never a float.
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    refundedCents: integer("refunded_cents").notNull().default(0),
    // Stripe PaymentIntent id (card) or the on-chain tx hash (crypto).
    reference: text("reference"),
    // Crypto network/chain (e.g. "base"), null for card payments.
    network: text("network"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transactions_reference_idx").on(table.reference),
    index("transactions_created_at_idx").on(table.createdAt),
  ],
);

// Maps an app user to their Stripe Customer so saved cards persist across
// checkouts. Created lazily the first time a user needs a customer.
export const stripeCustomers = pgTable("stripe_customers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(user, { fields: [providers.userId], references: [user.id] }),
  offerings: many(offerings),
  payoutMethod: one(payoutMethods),
}));

export const serviceReferralsRelations = relations(
  serviceReferrals,
  ({ one, many }) => ({
    referrer: one(user, {
      fields: [serviceReferrals.referrerUserId],
      references: [user.id],
    }),
    offering: one(offerings, {
      fields: [serviceReferrals.offeringId],
      references: [offerings.id],
    }),
    redeemedBy: one(user, {
      fields: [serviceReferrals.redeemedByUserId],
      references: [user.id],
    }),
    earnings: many(referralEarnings),
  }),
);

export const referralEarningsRelations = relations(
  referralEarnings,
  ({ one }) => ({
    referral: one(serviceReferrals, {
      fields: [referralEarnings.referralId],
      references: [serviceReferrals.id],
    }),
    referrer: one(user, {
      fields: [referralEarnings.referrerUserId],
      references: [user.id],
    }),
    booking: one(bookings, {
      fields: [referralEarnings.bookingId],
      references: [bookings.id],
    }),
    offering: one(offerings, {
      fields: [referralEarnings.offeringId],
      references: [offerings.id],
    }),
  }),
);

export const referrerPayoutMethodsRelations = relations(
  referrerPayoutMethods,
  ({ one }) => ({
    user: one(user, {
      fields: [referrerPayoutMethods.userId],
      references: [user.id],
    }),
  }),
);

export const offeringsRelations = relations(offerings, ({ one, many }) => ({
  provider: one(providers, {
    fields: [offerings.providerId],
    references: [providers.id],
  }),
  location: one(locations, {
    fields: [offerings.locationId],
    references: [locations.id],
  }),
  serviceAreas: many(serviceAreas),
  media: many(offeringMedia),
  availabilitySlots: many(availabilitySlots),
  availabilityRules: many(availabilityRules),
}));

export const serviceAreasRelations = relations(serviceAreas, ({ one }) => ({
  offering: one(offerings, {
    fields: [serviceAreas.offeringId],
    references: [offerings.id],
  }),
}));

export const offeringMediaRelations = relations(offeringMedia, ({ one }) => ({
  offering: one(offerings, {
    fields: [offeringMedia.offeringId],
    references: [offerings.id],
  }),
}));

export const availabilitySlotsRelations = relations(
  availabilitySlots,
  ({ one }) => ({
    offering: one(offerings, {
      fields: [availabilitySlots.offeringId],
      references: [offerings.id],
    }),
  }),
);

export const availabilityRulesRelations = relations(
  availabilityRules,
  ({ one }) => ({
    offering: one(offerings, {
      fields: [availabilityRules.offeringId],
      references: [offerings.id],
    }),
  }),
);

export const payoutMethodsRelations = relations(payoutMethods, ({ one }) => ({
  provider: one(providers, {
    fields: [payoutMethods.providerId],
    references: [providers.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(user, { fields: [apiKeys.userId], references: [user.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
  offering: one(offerings, {
    fields: [transactions.offeringId],
    references: [offerings.id],
  }),
  booking: one(bookings, {
    fields: [transactions.bookingId],
    references: [bookings.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type OfferingMedia = typeof offeringMedia.$inferSelect;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type NewAvailabilitySlot = typeof availabilitySlots.$inferInsert;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type PayoutMethod = typeof payoutMethods.$inferSelect;
export type NewPayoutMethod = typeof payoutMethods.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type GuestReview = typeof guestReviews.$inferSelect;
export type NewGuestReview = typeof guestReviews.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type NewReview = typeof reviews.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type NewStripeCustomer = typeof stripeCustomers.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type TransactionStatus =
  (typeof transactionStatusEnum.enumValues)[number];
export type ServiceReferral = typeof serviceReferrals.$inferSelect;
export type NewServiceReferral = typeof serviceReferrals.$inferInsert;
export type ReferrerPayoutMethod = typeof referrerPayoutMethods.$inferSelect;
export type NewReferrerPayoutMethod = typeof referrerPayoutMethods.$inferInsert;
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type NewReferralEarning = typeof referralEarnings.$inferInsert;
export type ReferralEarningStatus =
  (typeof referralEarningStatusEnum.enumValues)[number];
