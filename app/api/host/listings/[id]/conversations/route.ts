import { NextResponse } from "next/server";
import { getOwnedOfferingForApi } from "@/lib/host";
import { getOfferingConversations } from "@/lib/messages";
import { tryCatch } from "@/shared/utils/TryCatch";

type Ctx = { params: Promise<{ id: string }> };

// GET — the list of guests who have messaged about this listing (host only).
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const ownedResult = await tryCatch(getOwnedOfferingForApi(id));
  if (!ownedResult.ok) {
    console.error("[host:conversations] failed:", ownedResult.error);
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  }
  if (!ownedResult.data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const conversationsResult = await tryCatch(getOfferingConversations(id));
  if (!conversationsResult.ok) {
    console.error("[host:conversations] failed:", conversationsResult.error);
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  }

  return NextResponse.json({ conversations: conversationsResult.data });
}
