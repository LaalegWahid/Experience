import { z } from "zod";

// JSON payloads for the host-write offering endpoints. Prices are integer minor
// units (cents) in the API — cleaner for machine clients than decimals.

export const offeringCreateSchema = z.object({
  type: z.enum(["service", "experience"]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(120).optional(),
  format: z
    .enum(["public_group", "private_group", "one_on_one", "class_workshop"])
    .default("public_group"),
  locationType: z.enum(["at_host", "at_guest", "online"]).default("at_host"),
  priceCents: z.number().int().min(0).max(100_000_000),
  // Payments are accepted only in USD or EUR.
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(["USD", "EUR"]))
    .default("USD"),
  pricingType: z.enum(["per_person", "per_booking"]).default("per_person"),
  durationMinutes: z.number().int().min(5).max(1440),
  capacity: z.number().int().min(1).max(1000).default(1),
  bookingCutoffMinutes: z.number().int().min(0).max(43_200).default(0),
  includedItems: z.array(z.string().max(200)).max(50).default([]),
  requirements: z.array(z.string().max(200)).max(50).default([]),
  qualifications: z.string().trim().max(3000).optional(),
  cancellationPolicy: z
    .enum(["flexible", "moderate", "strict"])
    .default("flexible"),
});

export const offeringUpdateSchema = offeringCreateSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type OfferingCreateInput = z.infer<typeof offeringCreateSchema>;
export type OfferingUpdateInput = z.infer<typeof offeringUpdateSchema>;
