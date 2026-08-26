"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  availabilityRules,
  locations,
  menuItems,
  offeringMedia,
  offerings,
  serviceAreas,
} from "@/db/schema";
import {
  hasPayoutMethod,
  requireOwnedOffering,
  requireProvider,
} from "@/lib/host";
import { priceToCents } from "@/shared/utils/money";
import { uniqueSlug } from "@/shared/utils/slug";
import {
  lines,
  str,
  zodFieldErrors,
  type FormState,
} from "@/shared/utils/form";

// ---------------------------------------------------------------------------
// Offering create / update
// ---------------------------------------------------------------------------

const offeringSchema = z.object({
  type: z.enum(["service", "experience"]),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title is too long"),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(120).optional(),
  coverImageUrl: z.string().trim().url().max(1000).optional(),
  format: z.enum([
    "public_group",
    "private_group",
    "one_on_one",
    "class_workshop",
  ]),
  locationType: z.enum(["at_host", "at_guest", "online"]),
  price: z.coerce.number().min(0, "Price can't be negative").max(1_000_000),
  currency: z.enum(["USD", "EUR"]).default("USD"),
  pricingType: z.enum(["per_person", "per_booking"]),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Must be at least 5 minutes")
    .max(1440, "Must be under 24 hours"),
  capacity: z.coerce.number().int().min(1, "At least 1").max(1000),
  bookingCutoffHours: z.coerce.number().int().min(0).max(720).default(0),
  qualifications: z.string().trim().max(3000).optional(),
  cancellationPolicy: z.enum(["flexible", "moderate", "strict"]),
  // Fixed location (at_host)
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(40).optional(),
  country: z.string().trim().max(120).optional(),
  // Service area (at_guest)
  serviceAreaLabel: z.string().trim().max(200).optional(),
  serviceAreaRadiusKm: z.coerce.number().int().min(0).max(1000).optional(),
  // Point the host travels from — used to cap bookings beyond the max travel
  // time away.
  serviceAreaLat: z.coerce.number().min(-90).max(90).optional(),
  serviceAreaLng: z.coerce.number().min(-180).max(180).optional(),
  // Host's chosen max road time, in minutes. Hard-capped at 120 (2 hours).
  serviceAreaMaxTravelMinutes: z.coerce.number().int().min(1).max(120).optional(),
});

type OfferingData = z.infer<typeof offeringSchema> & {
  includedItems: string[];
  requirements: string[];
  photos: string[];
  coverPhotos: string[];
};

/** Parse a hidden JSON-array field of photo URLs (max 20). */
function jsonUrlArray(formData: FormData, key: string): string[] {
  const raw = str(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((u): u is string => typeof u === "string" && u.length > 0)
      .slice(0, 20);
  } catch {
    return [];
  }
}

/** Replace an offering's photo gallery wholesale (the form is the source of
 *  truth). Marked covers carry `isCover`; with none marked the first wins. */
async function replaceOfferingMedia(
  offeringId: string,
  photos: string[],
  coverPhotos: string[],
) {
  await db.delete(offeringMedia).where(eq(offeringMedia.offeringId, offeringId));
  const list = photos.slice(0, 20);
  if (list.length === 0) return;
  const coverSet = new Set(coverPhotos.filter((u) => list.includes(u)));
  await db.insert(offeringMedia).values(
    list.map((url, i) => ({
      offeringId,
      url,
      position: i,
      isCover: coverSet.size > 0 ? coverSet.has(url) : i === 0,
    })),
  );
}

type ParseResult =
  | { ok: true; data: OfferingData }
  | { ok: false; fieldErrors: Record<string, string[]> };

function parseOfferingForm(formData: FormData): ParseResult {
  const parsed = offeringSchema.safeParse({
    type: str(formData, "type"),
    title: str(formData, "title"),
    description: str(formData, "description") || undefined,
    category: str(formData, "category") || undefined,
    subcategory: str(formData, "subcategory") || undefined,
    coverImageUrl: str(formData, "coverImageUrl") || undefined,
    format: str(formData, "format"),
    locationType: str(formData, "locationType"),
    price: str(formData, "price"),
    currency: str(formData, "currency") || "USD",
    pricingType: str(formData, "pricingType"),
    durationMinutes: str(formData, "durationMinutes"),
    capacity: str(formData, "capacity"),
    bookingCutoffHours: str(formData, "bookingCutoffHours") || "0",
    qualifications: str(formData, "qualifications") || undefined,
    cancellationPolicy: str(formData, "cancellationPolicy"),
    addressLine1: str(formData, "addressLine1") || undefined,
    addressLine2: str(formData, "addressLine2") || undefined,
    city: str(formData, "city") || undefined,
    region: str(formData, "region") || undefined,
    postalCode: str(formData, "postalCode") || undefined,
    country: str(formData, "country") || undefined,
    serviceAreaLabel: str(formData, "serviceAreaLabel") || undefined,
    serviceAreaRadiusKm: str(formData, "serviceAreaRadiusKm") || undefined,
    serviceAreaLat: str(formData, "serviceAreaLat") || undefined,
    serviceAreaLng: str(formData, "serviceAreaLng") || undefined,
    serviceAreaMaxTravelMinutes:
      str(formData, "serviceAreaMaxTravelMinutes") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }
  const photos = jsonUrlArray(formData, "photos");
  const coverPhotos = jsonUrlArray(formData, "coverPhotos").filter((u) =>
    photos.includes(u),
  );
  return {
    ok: true,
    data: {
      ...parsed.data,
      // Keep the stored cover in sync with the gallery's primary cover.
      coverImageUrl:
        coverPhotos[0] ?? photos[0] ?? parsed.data.coverImageUrl ?? undefined,
      includedItems: lines(str(formData, "includedItems")),
      requirements: lines(str(formData, "requirements")),
      photos,
      coverPhotos,
    },
  };
}

/** Column values shared by insert and update (excludes ownership/identity). */
function offeringColumns(data: OfferingData) {
  return {
    type: data.type,
    title: data.title,
    description: data.description ?? null,
    category: data.category ?? null,
    subcategory: data.subcategory ?? null,
    coverImageUrl: data.coverImageUrl ?? null,
    format: data.format,
    locationType: data.locationType,
    priceCents: priceToCents(data.price),
    currency: data.currency.toUpperCase(),
    pricingType: data.pricingType,
    durationMinutes: data.durationMinutes,
    capacity: data.capacity,
    bookingCutoffMinutes: data.bookingCutoffHours * 60,
    includedItems: data.includedItems,
    requirements: data.requirements,
    qualifications: data.qualifications ?? null,
    cancellationPolicy: data.cancellationPolicy,
  };
}

function addressColumns(data: OfferingData) {
  return {
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    city: data.city ?? null,
    region: data.region ?? null,
    postalCode: data.postalCode ?? null,
    country: data.country ?? null,
  };
}

export async function createOffering(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { provider } = await requireProvider();

  // A host must have a payout method before they can create a listing.
  if (!(await hasPayoutMethod(provider.id))) {
    return {
      error:
        "Add a payout method (bank or crypto wallet) before you can create a listing.",
    };
  }

  const result = parseOfferingForm(formData);
  if (!result.ok) return { fieldErrors: result.fieldErrors };
  const data = result.data;

  // Create a fixed location only for at-host offerings with an address.
  let locationId: string | null = null;
  if (data.locationType === "at_host" && (data.addressLine1 || data.city)) {
    const [loc] = await db
      .insert(locations)
      .values(addressColumns(data))
      .returning({ id: locations.id });
    locationId = loc.id;
  }

  const [created] = await db
    .insert(offerings)
    .values({
      providerId: provider.id,
      slug: uniqueSlug(data.title),
      status: "draft",
      locationId,
      ...offeringColumns(data),
    })
    .returning({ id: offerings.id });

  await replaceOfferingMedia(created.id, data.photos, data.coverPhotos);

  if (data.locationType === "at_guest" && data.serviceAreaLabel) {
    await db.insert(serviceAreas).values({
      offeringId: created.id,
      label: data.serviceAreaLabel,
      radiusKm: data.serviceAreaRadiusKm ?? null,
      centerLat: data.serviceAreaLat ?? null,
      centerLng: data.serviceAreaLng ?? null,
      maxTravelMinutes: data.serviceAreaMaxTravelMinutes ?? 120,
    });
  }

  revalidatePath("/host");
  redirect(`/host/listings/${created.id}`);
}

export async function updateOffering(
  offeringId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { offering } = await requireOwnedOffering(offeringId);

  const result = parseOfferingForm(formData);
  if (!result.ok) return { fieldErrors: result.fieldErrors };
  const data = result.data;

  // Upsert / detach the fixed location depending on the location type.
  let locationId: string | null = offering.locationId;
  if (data.locationType === "at_host" && (data.addressLine1 || data.city)) {
    if (offering.locationId) {
      await db
        .update(locations)
        .set(addressColumns(data))
        .where(eq(locations.id, offering.locationId));
    } else {
      const [loc] = await db
        .insert(locations)
        .values(addressColumns(data))
        .returning({ id: locations.id });
      locationId = loc.id;
    }
  } else {
    locationId = null;
  }

  await db
    .update(offerings)
    .set({ ...offeringColumns(data), locationId, updatedAt: new Date() })
    .where(eq(offerings.id, offeringId));

  // Photo gallery is single-source-of-truth from the form: replace wholesale.
  await replaceOfferingMedia(offeringId, data.photos, data.coverPhotos);

  // Service area is single-row for the MVP: replace it wholesale.
  await db.delete(serviceAreas).where(eq(serviceAreas.offeringId, offeringId));
  if (data.locationType === "at_guest" && data.serviceAreaLabel) {
    await db.insert(serviceAreas).values({
      offeringId,
      label: data.serviceAreaLabel,
      radiusKm: data.serviceAreaRadiusKm ?? null,
      centerLat: data.serviceAreaLat ?? null,
      centerLng: data.serviceAreaLng ?? null,
      maxTravelMinutes: data.serviceAreaMaxTravelMinutes ?? 120,
    });
  }

  revalidatePath(`/host/listings/${offeringId}`);
  revalidatePath("/host");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Status transitions (bound to an id, invoked from simple <form> buttons)
// ---------------------------------------------------------------------------

/**
 * Request to publish. The listing doesn't go live directly — it stays a hidden
 * draft flagged for admin review; an admin approves it to actually publish it.
 */
export async function publishOffering(offeringId: string) {
  const { provider, offering } = await requireOwnedOffering(offeringId);

  // Can't publish a bookable listing with no way to get paid.
  if (!(await hasPayoutMethod(provider.id))) {
    redirect("/host/payouts");
  }

  await db
    .update(offerings)
    .set({
      status: "draft",
      publishedAt: null,
      metadata: { ...offering.metadata, moderationStatus: "pending" },
      updatedAt: new Date(),
    })
    .where(eq(offerings.id, offeringId));
  revalidatePath(`/host/listings/${offeringId}`);
  revalidatePath("/host");
}

export async function unpublishOffering(offeringId: string) {
  await requireOwnedOffering(offeringId);
  await db
    .update(offerings)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(offerings.id, offeringId));
  revalidatePath(`/host/listings/${offeringId}`);
  revalidatePath("/host");
}

export async function archiveOffering(offeringId: string) {
  await requireOwnedOffering(offeringId);
  await db
    .update(offerings)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(offerings.id, offeringId));
  revalidatePath(`/host/listings/${offeringId}`);
  revalidatePath("/host");
}

export async function deleteOffering(offeringId: string) {
  await requireOwnedOffering(offeringId);
  // FKs cascade to slots, media and service areas.
  await db.delete(offerings).where(eq(offerings.id, offeringId));
  revalidatePath("/host");
  redirect("/host");
}

// ---------------------------------------------------------------------------
// Discounts (percentage deals applied to the listing price)
// ---------------------------------------------------------------------------

const discountPercent = z.coerce.number().int().min(1).max(90);
const discountsSchema = z.object({
  limitedTime: z.boolean(),
  earlyBird: z.boolean(),
  limitedTimePercent: discountPercent.optional(),
  earlyBirdPercent: discountPercent.optional(),
});

/**
 * Update the host-set discounts on a listing. Editable any time, including after
 * the listing is live, so a host can start, change, or end a deal. The larger
 * active discount is what guests see applied to the price.
 */
export async function updateDiscounts(
  offeringId: string,
  input: {
    limitedTime: boolean;
    earlyBird: boolean;
    limitedTimePercent?: number;
    earlyBirdPercent?: number;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { offering } = await requireOwnedOffering(offeringId);

  const parsed = discountsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a discount between 1% and 90%." };
  }
  const d = parsed.data;
  if (d.limitedTime && !d.limitedTimePercent) {
    return { ok: false, error: "Set an amount for the limited-time discount." };
  }
  if (d.earlyBird && !d.earlyBirdPercent) {
    return { ok: false, error: "Set an amount for the early bird discount." };
  }

  const discounts = {
    ...offering.metadata?.discounts,
    limitedTime: d.limitedTime,
    earlyBird: d.earlyBird,
    limitedTimePercent: d.limitedTime ? d.limitedTimePercent : undefined,
    earlyBirdPercent: d.earlyBird ? d.earlyBirdPercent : undefined,
  };

  await db
    .update(offerings)
    .set({
      metadata: { ...offering.metadata, discounts },
      updatedAt: new Date(),
    })
    .where(eq(offerings.id, offeringId));

  revalidatePath(`/host/listings/${offeringId}`);
  revalidatePath(`/services/${offeringId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Menu items (priced choices within an offering)
// ---------------------------------------------------------------------------

const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  price: z.coerce.number().min(0, "Price can't be negative").max(1_000_000),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().url().max(1000).optional(),
});

export async function addMenuItem(
  offeringId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOwnedOffering(offeringId);

  const parsed = menuItemSchema.safeParse({
    name: str(formData, "name"),
    price: str(formData, "price"),
    description: str(formData, "description") || undefined,
    imageUrl: str(formData, "imageUrl") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error) };
  }

  await db.insert(menuItems).values({
    offeringId,
    name: parsed.data.name,
    priceCents: priceToCents(parsed.data.price),
    description: parsed.data.description ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
  });

  revalidatePath(`/host/listings/${offeringId}`);
  return { ok: true };
}

export async function removeMenuItem(offeringId: string, formData: FormData) {
  await requireOwnedOffering(offeringId);
  const id = str(formData, "menuItemId");
  if (id) {
    await db
      .delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.offeringId, offeringId)));
  }
  revalidatePath(`/host/listings/${offeringId}`);
}

// ---------------------------------------------------------------------------
// Recurring weekly availability
// ---------------------------------------------------------------------------

// ISO-8601 weekdays: 1 = Monday ... 7 = Sunday.
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM, 24h

/**
 * Replace the offering's whole weekly availability pattern. The form submits
 * every weekday; each enabled day contributes one row (a start/end window) that
 * repeats every week until the host edits it again.
 */
export async function setWeeklyAvailability(
  offeringId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOwnedOffering(offeringId);

  const fieldErrors: Record<string, string[]> = {};
  const rows: { offeringId: string; dayOfWeek: number; startTime: string; endTime: string }[] = [];

  for (const day of WEEKDAYS) {
    if (formData.get(`enabled_${day}`) !== "on") continue;

    const start = str(formData, `start_${day}`);
    const end = str(formData, `end_${day}`);

    if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
      fieldErrors[`day_${day}`] = ["Set a valid start and end time"];
      continue;
    }
    if (end <= start) {
      fieldErrors[`day_${day}`] = ["End must be after the start time"];
      continue;
    }
    rows.push({ offeringId, dayOfWeek: day, startTime: start, endTime: end });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Replace the entire schedule atomically.
  await db.transaction(async (tx) => {
    await tx
      .delete(availabilityRules)
      .where(eq(availabilityRules.offeringId, offeringId));
    if (rows.length > 0) {
      await tx.insert(availabilityRules).values(rows);
    }
  });

  revalidatePath(`/host/listings/${offeringId}`);
  return { ok: true };
}
