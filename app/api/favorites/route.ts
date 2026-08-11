import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { addFavorite, removeFavorite } from "@/lib/favorites";
import { getOfferingById } from "@/lib/offerings";
import { tryCatch } from "@/shared/utils/TryCatch";

async function requireUserAndOffering(request: Request) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) return { error: "Server error.", status: 500 } as const;
  const session = sessionResult.data;
  if (!session?.user) return { error: "Unauthorized.", status: 401 } as const;

  const bodyResult = await tryCatch(
    request.json() as Promise<{ offeringId?: string }>,
  );
  if (!bodyResult.ok || !bodyResult.data.offeringId) {
    return { error: "Missing offeringId.", status: 400 } as const;
  }

  const offeringResult = await tryCatch(
    getOfferingById(bodyResult.data.offeringId),
  );
  if (!offeringResult.ok) return { error: "Server error.", status: 500 } as const;
  if (!offeringResult.data) {
    return { error: "Service not found.", status: 404 } as const;
  }

  return { userId: session.user.id, offeringId: offeringResult.data.id } as const;
}

// POST { offeringId } — add to favorites.
export async function POST(request: Request) {
  const ctx = await requireUserAndOffering(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const result = await tryCatch(addFavorite(ctx.userId, ctx.offeringId));
  if (!result.ok) {
    console.error("[favorites:POST] failed:", result.error);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ favorited: true });
}

// DELETE { offeringId } — remove from favorites.
export async function DELETE(request: Request) {
  const ctx = await requireUserAndOffering(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const result = await tryCatch(removeFavorite(ctx.userId, ctx.offeringId));
  if (!result.ok) {
    console.error("[favorites:DELETE] failed:", result.error);
    return NextResponse.json({ error: "Could not remove." }, { status: 500 });
  }
  return NextResponse.json({ favorited: false });
}
