import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { offerings } from "@/db/schema";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getOfferingById } from "@/lib/offerings";
import { offeringUpdateSchema } from "@/lib/api-offerings";
import { serializeOfferingDetail } from "@/lib/api-serializers";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/offerings/{id} — public detail for a published offering, or any
// status if the caller owns it.
export async function GET(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const offering = await getOfferingById(id);
  if (!offering) return apiError(404, "Offering not found.", "not_found");

  const owned = offering.provider.userId === actor.user.id;
  if (offering.status !== "published" && !owned) {
    return apiError(404, "Offering not found.", "not_found");
  }
  return apiOk(serializeOfferingDetail(offering));
}

// PATCH /api/v1/offerings/{id} — update / publish a listing the caller owns.
export async function PATCH(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const offering = await getOfferingById(id);
  if (!offering || offering.provider.userId !== actor.user.id) {
    return apiError(404, "Offering not found.", "not_found");
  }

  const body = await request.json().catch(() => null);
  const parsed = offeringUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid offering payload.",
      "validation_error",
    );
  }
  const d = parsed.data;

  const updates: Partial<typeof offerings.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (d.type !== undefined) updates.type = d.type;
  if (d.title !== undefined) updates.title = d.title;
  if (d.description !== undefined) updates.description = d.description ?? null;
  if (d.category !== undefined) updates.category = d.category ?? null;
  if (d.subcategory !== undefined) updates.subcategory = d.subcategory ?? null;
  if (d.format !== undefined) updates.format = d.format;
  if (d.locationType !== undefined) updates.locationType = d.locationType;
  if (d.priceCents !== undefined) updates.priceCents = d.priceCents;
  if (d.currency !== undefined) updates.currency = d.currency.toUpperCase();
  if (d.pricingType !== undefined) updates.pricingType = d.pricingType;
  if (d.durationMinutes !== undefined) updates.durationMinutes = d.durationMinutes;
  if (d.capacity !== undefined) updates.capacity = d.capacity;
  if (d.bookingCutoffMinutes !== undefined) {
    updates.bookingCutoffMinutes = d.bookingCutoffMinutes;
  }
  if (d.includedItems !== undefined) updates.includedItems = d.includedItems;
  if (d.requirements !== undefined) updates.requirements = d.requirements;
  if (d.qualifications !== undefined) {
    updates.qualifications = d.qualifications ?? null;
  }
  if (d.cancellationPolicy !== undefined) {
    updates.cancellationPolicy = d.cancellationPolicy;
  }
  if (d.status !== undefined) {
    updates.status = d.status;
    if (d.status === "published") {
      updates.publishedAt = offering.publishedAt ?? new Date();
    }
  }

  await db.update(offerings).set(updates).where(eq(offerings.id, id));

  const full = await getOfferingById(id);
  return apiOk(full ? serializeOfferingDetail(full) : { id });
}
