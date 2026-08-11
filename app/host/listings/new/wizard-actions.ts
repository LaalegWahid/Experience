"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  locations,
  menuItems,
  offerings,
  offeringMedia,
  payoutMethods,
  serviceAreas,
  type OfferingMetadata,
} from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { priceToCents } from "@/shared/utils/money";
import { uniqueSlug } from "@/shared/utils/slug";
import { chainFamily } from "@/shared/data/payouts";
import { OTHER_CATEGORY } from "@/shared/data/service-categories";
import {
  isValidBic,
  isValidIban,
  isValidWalletAddress,
  normalizeIban,
} from "@/shared/utils/payout";
import type { ListingDraftInput } from "./wizard-types";

export type WizardPayoutInput =
  | {
      type: "bank";
      accountHolderName: string;
      iban: string;
      bic?: string;
      bankName?: string;
      country?: string;
    }
  | { type: "crypto"; chain: string; stablecoin: string; walletAddress: string };

type PayoutInsert = typeof payoutMethods.$inferInsert;

/**
 * Save (insert or replace) the provider's payout method from the listing
 * wizard's final step. Validates the fields for the chosen type and clears the
 * other type's columns. Mirrors app/host/payouts/actions.ts but takes a typed
 * object instead of FormData.
 */
export async function saveWizardPayout(
  input: WizardPayoutInput,
): Promise<{ error?: string }> {
  const { provider } = await requireProvider();

  let columns: Omit<PayoutInsert, "providerId">;
  if (input.type === "bank") {
    const iban = normalizeIban(input.iban);
    if (input.accountHolderName.trim().length < 2) {
      return { error: "Enter the account holder's name." };
    }
    if (!isValidIban(iban)) return { error: "Enter a valid IBAN / RIB." };
    if (input.bic && !isValidBic(input.bic)) {
      return { error: "Enter a valid BIC/SWIFT, or leave it blank." };
    }
    columns = {
      type: "bank",
      accountHolderName: input.accountHolderName.trim(),
      iban,
      bic: input.bic?.trim() || null,
      bankName: input.bankName?.trim() || null,
      country: input.country?.trim() || null,
      walletAddress: null,
      chain: null,
      stablecoin: null,
    };
  } else {
    const family = chainFamily(input.chain);
    const stablecoin =
      input.stablecoin === "USDC" || input.stablecoin === "USDT"
        ? input.stablecoin
        : null;
    if (!family) return { error: "Pick a supported network." };
    if (!stablecoin) return { error: "Pick a stablecoin." };
    if (!input.walletAddress.trim()) {
      return { error: "Enter your wallet address." };
    }
    if (!isValidWalletAddress(input.walletAddress.trim(), family)) {
      return { error: "That doesn't look like a valid address for this network." };
    }
    columns = {
      type: "crypto",
      chain: input.chain as PayoutInsert["chain"],
      stablecoin,
      walletAddress: input.walletAddress.trim(),
      accountHolderName: null,
      iban: null,
      bic: null,
      bankName: null,
      country: null,
    };
  }

  await db
    .insert(payoutMethods)
    .values({ providerId: provider.id, ...columns })
    .onConflictDoUpdate({
      target: payoutMethods.providerId,
      set: { ...columns, updatedAt: new Date() },
    });

  return {};
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Payments are accepted only in USD or EUR.
const ALLOWED_CURRENCIES = ["USD", "EUR"] as const;

/** Rough drive-time → radius assuming an average ~60 km/h (1 km per minute). */
function driveTimeToRadiusKm(minutes?: number): number | null {
  if (!minutes || minutes <= 0) return null;
  return Math.round((minutes / 60) * 60);
}

type SaveOptions = {
  /** Update this existing draft instead of creating a new listing. */
  offeringId?: string;
  /** Keep it flagged as an unfinished, in-progress draft. */
  inProgress?: boolean;
  /** Publish the listing immediately (the wizard's final step). */
  publish?: boolean;
};

/**
 * Create or update a host's listing draft. Used both by "Save and exit"
 * (inProgress) and the final submit. Always lands as a `draft` offering so it
 * shows up under "Your listings"; publishing happens later on the listing page.
 */
export async function createListingDraft(
  input: ListingDraftInput,
  opts: SaveOptions = {},
): Promise<{ offeringId?: string; error?: string }> {
  const { provider } = await requireProvider();

  const type = input.type === "experience" ? "experience" : "service";
  // The catch-all "Other" category is stored empty, not as a literal label.
  const category = input.category === OTHER_CATEGORY ? "" : input.category;
  const title = (input.title || `${category || "Service"} by ${provider.displayName}`)
    .trim()
    .slice(0, 160);
  if (title.length < 3) return { error: "Add a title for your listing." };

  const primary = input.offerings[0];
  const currency = ALLOWED_CURRENCIES.includes(
    input.currency as (typeof ALLOWED_CURRENCIES)[number],
  )
    ? input.currency
    : "USD";
  const locationType: "at_host" | "at_guest" = input.guestsComeToHost
    ? "at_host"
    : "at_guest";

  const metadata: OfferingMetadata = {
    yearsOfExperience: input.yearsOfExperience,
    experience: input.experience?.trim() || undefined,
    degree: input.degree?.trim() || undefined,
    careerHighlight: input.careerHighlight?.trim() || undefined,
    onlineProfiles: (input.onlineProfiles ?? []).filter(Boolean),
    residentialAddress: input.residentialAddress,
    hostingAsBusiness: input.hostingAsBusiness,
    travelsToGuests: input.travelsToGuests,
    guestsComeToHost: input.guestsComeToHost,
    driveTimeMinutes: input.driveTimeMinutes,
    startingLocation: input.startingLocation?.trim() || undefined,
    businessHours: input.businessHours,
    discounts: input.discounts,
    transportingGuests: input.transportingGuests,
    // Experience "Share what you'll provide" answers, keyed by question id.
    experienceDetails: input.experienceDetails,
    // Experience-only extras (ignored for services, which leave them undefined).
    itinerary: input.itinerary?.length ? input.itinerary : undefined,
    privateGroupMinimum: input.privateGroupMinimum,
    atNationalPark: input.atNationalPark,
    agreedToTerms: !opts.inProgress,
    // Requesting to publish sends the listing to admin review, not live.
    moderationStatus: opts.publish ? "pending" : undefined,
    inProgress: opts.inProgress ? true : undefined,
    // Keep the resumable snapshot only while unfinished; drop it once submitted.
    draftState: opts.inProgress ? input.draftState : undefined,
  };

  const wantsLocation =
    locationType === "at_host" && Boolean(input.startingLocation || input.city);
  const locationValues = {
    addressLine1: input.startingLocation ?? null,
    city: input.city ?? input.residentialAddress?.city ?? null,
    country: input.residentialAddress?.country ?? null,
  };

  // Cover photos: the host can mark up to a few photos as covers. Fall back to
  // the first photo when none are marked (legacy drafts / older clients).
  const orderedPhotos = input.photos.filter(Boolean);
  const coverSet = new Set((input.coverPhotos ?? []).filter(Boolean));
  const coverPhotos = orderedPhotos.filter((url) => coverSet.has(url));
  const primaryCover = coverPhotos[0] ?? orderedPhotos[0] ?? null;

  // Columns shared by insert and update (slug is set only on insert).
  const columns = {
    providerId: provider.id,
    type: type as "service" | "experience",
    // The wizard never publishes directly: a finished listing goes to admin
    // review (status stays `draft` + metadata.moderationStatus `pending`) and is
    // only set to `published` once an admin approves it.
    status: "draft" as "published" | "draft",
    publishedAt: null,
    title,
    description: input.description?.trim() || null,
    category: category || null,
    subcategory: primary?.typeOfService || null,
    format:
      (primary?.capacity ?? 1) <= 1
        ? ("one_on_one" as const)
        : ("public_group" as const),
    locationType,
    priceCents: priceToCents(primary?.price ?? 0),
    currency,
    pricingType: (primary?.pricingType ?? "per_person") as
      | "per_person"
      | "per_booking",
    durationMinutes: primary?.durationMinutes ?? 60,
    capacity: primary?.capacity ?? 1,
    qualifications: metadata.experience ?? null,
    cancellationPolicy: input.cancellationPolicy ?? "flexible",
    coverImageUrl: primaryCover,
    metadata,
  };

  // Resolve the existing draft (if updating) and confirm ownership.
  let offeringId: string | null = null;
  let existingLocationId: string | null = null;
  if (opts.offeringId) {
    const [existing] = await db
      .select({
        id: offerings.id,
        providerId: offerings.providerId,
        locationId: offerings.locationId,
      })
      .from(offerings)
      .where(eq(offerings.id, opts.offeringId))
      .limit(1);
    if (existing && existing.providerId === provider.id) {
      offeringId = existing.id;
      existingLocationId = existing.locationId;
    }
  }

  // A location row, reused/created/cleared as needed.
  let locationId: string | null = existingLocationId;
  if (wantsLocation) {
    if (existingLocationId) {
      await db
        .update(locations)
        .set(locationValues)
        .where(eq(locations.id, existingLocationId));
      locationId = existingLocationId;
    } else {
      const [loc] = await db
        .insert(locations)
        .values(locationValues)
        .returning({ id: locations.id });
      locationId = loc.id;
    }
  } else {
    locationId = null;
  }

  if (offeringId) {
    await db
      .update(offerings)
      .set({ ...columns, locationId, updatedAt: new Date() })
      .where(eq(offerings.id, offeringId));
    // Children are single-source-of-truth from the wizard — replace wholesale.
    await db.delete(serviceAreas).where(eq(serviceAreas.offeringId, offeringId));
    await db.delete(offeringMedia).where(eq(offeringMedia.offeringId, offeringId));
    await db
      .delete(availabilityRules)
      .where(eq(availabilityRules.offeringId, offeringId));
    await db.delete(menuItems).where(eq(menuItems.offeringId, offeringId));
  } else {
    const [created] = await db
      .insert(offerings)
      .values({ ...columns, slug: uniqueSlug(title), locationId })
      .returning({ id: offerings.id });
    offeringId = created.id;
  }

  // Service area for mobile ("you travel to guests").
  if (locationType === "at_guest") {
    await db.insert(serviceAreas).values({
      offeringId,
      label: input.startingLocation || input.city || "Service area",
      radiusKm: driveTimeToRadiusKm(input.driveTimeMinutes),
    });
  }

  // Photos → media rows. Marked covers carry isCover; with none marked the
  // first photo is the cover (matches `primaryCover` above).
  const photos = orderedPhotos.slice(0, 20);
  if (photos.length > 0) {
    await db.insert(offeringMedia).values(
      photos.map((url, i) => ({
        offeringId,
        url,
        position: i,
        isCover: coverPhotos.length > 0 ? coverSet.has(url) : i === 0,
      })),
    );
  }

  // Business hours → one weekly rule per selected weekday (last window wins).
  const byDay = new Map<number, { startTime: string; endTime: string }>();
  for (const block of input.businessHours ?? []) {
    if (!TIME_RE.test(block.from) || !TIME_RE.test(block.to)) continue;
    if (block.to <= block.from) continue;
    for (const day of block.days) {
      if (day >= 1 && day <= 7) {
        byDay.set(day, { startTime: block.from, endTime: block.to });
      }
    }
  }
  if (byDay.size > 0) {
    await db.insert(availabilityRules).values(
      [...byDay.entries()].map(([dayOfWeek, w]) => ({
        offeringId,
        dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
    );
  }

  // Each wizard offering becomes a bookable menu item.
  const menu = input.offerings.filter((o) => o.name?.trim());
  if (menu.length > 0) {
    await db.insert(menuItems).values(
      menu.map((o, i) => ({
        offeringId,
        name: o.name.trim().slice(0, 120),
        description: o.description?.trim() || null,
        priceCents: priceToCents(o.price ?? 0),
        imageUrl: o.imageUrl || null,
        position: i,
      })),
    );
  }

  revalidatePath("/host");
  return { offeringId };
}
