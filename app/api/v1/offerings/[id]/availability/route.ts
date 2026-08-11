import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { availabilityRules } from "@/db/schema";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getAvailabilityRules, getOfferingById } from "@/lib/offerings";
import { serializeAvailability } from "@/lib/api-serializers";

type Ctx = { params: Promise<{ id: string }> };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ruleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(TIME),
  endTime: z.string().regex(TIME),
});
const availabilityPutSchema = z.object({ rules: z.array(ruleSchema).max(7) });

// GET /api/v1/offerings/{id}/availability — the recurring weekly windows.
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

  const rules = await getAvailabilityRules(id);
  return apiOk(serializeAvailability(rules));
}

// PUT /api/v1/offerings/{id}/availability — replace the weekly schedule.
export async function PUT(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const offering = await getOfferingById(id);
  if (!offering || offering.provider.userId !== actor.user.id) {
    return apiError(404, "Offering not found.", "not_found");
  }

  const body = await request.json().catch(() => null);
  const parsed = availabilityPutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid availability payload.",
      "validation_error",
    );
  }

  for (const r of parsed.data.rules) {
    if (r.endTime <= r.startTime) {
      return apiError(
        422,
        `End time must be after start time (day ${r.dayOfWeek}).`,
        "validation_error",
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(availabilityRules)
      .where(eq(availabilityRules.offeringId, id));
    if (parsed.data.rules.length > 0) {
      await tx.insert(availabilityRules).values(
        parsed.data.rules.map((r) => ({
          offeringId: id,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      );
    }
  });

  const rules = await getAvailabilityRules(id);
  return apiOk(serializeAvailability(rules));
}
