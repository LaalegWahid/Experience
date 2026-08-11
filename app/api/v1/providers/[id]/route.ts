import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { requireApiActor } from "@/lib/api-auth";
import { apiError, apiOk } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/v1/providers/{id} — public provider profile.
export async function GET(request: Request, { params }: Ctx) {
  const actor = await requireApiActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return apiError(404, "Provider not found.", "not_found");
  }

  const [p] = await db
    .select({
      id: providers.id,
      displayName: providers.displayName,
      type: providers.type,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
      isVerified: providers.isVerified,
    })
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);

  if (!p) return apiError(404, "Provider not found.", "not_found");

  return apiOk({
    id: p.id,
    name: p.displayName,
    type: p.type,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    isVerified: p.isVerified,
  });
}
