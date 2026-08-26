import { NextResponse } from "next/server";
import { db } from "@/db";
import { offerings } from "@/db/schema";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getOfferingById, searchOfferings } from "@/lib/offerings";
import { getProviderForUser } from "@/lib/host";
import { offeringCreateSchema } from "@/lib/api-offerings";
import {
  serializeOfferingDetail,
  serializeOfferingListItem,
} from "@/lib/api-serializers";
import { uniqueSlug } from "@/shared/utils/slug";

// GET /api/v1/offerings — search published offerings.
export async function GET(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const params = new URL(request.url).searchParams;
  const num = (v: string | null) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const results = await searchOfferings({
    q: params.get("q") ?? undefined,
    host: params.get("host") ?? undefined,
    minPrice: num(params.get("minPrice")),
    maxPrice: num(params.get("maxPrice")),
  });

  return apiOk(results.map(serializeOfferingListItem));
}

// POST /api/v1/offerings — create a draft listing as the key owner's provider.
export async function POST(request: Request) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const provider = await getProviderForUser(actor.user.id);
  if (!provider) {
    return apiError(
      403,
      "Your account has no provider profile. Complete host onboarding first.",
      "no_provider",
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = offeringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid offering payload.",
      "validation_error",
    );
  }
  const d = parsed.data;

  const [created] = await db
    .insert(offerings)
    .values({
      providerId: provider.id,
      slug: uniqueSlug(d.title),
      status: "draft",
      type: d.type,
      title: d.title,
      description: d.description ?? null,
      category: d.category ?? null,
      subcategory: d.subcategory ?? null,
      format: d.format,
      locationType: d.locationType,
      priceCents: d.priceCents,
      currency: d.currency.toUpperCase(),
      pricingType: d.pricingType,
      durationMinutes: d.durationMinutes,
      capacity: d.capacity,
      bookingCutoffMinutes: d.bookingCutoffMinutes,
      includedItems: d.includedItems,
      requirements: d.requirements,
      qualifications: d.qualifications ?? null,
      cancellationPolicy: d.cancellationPolicy,
    })
    .returning({ id: offerings.id });

  const full = await getOfferingById(created.id);
  return apiOk(full ? serializeOfferingDetail(full) : { id: created.id }, 201);
}
