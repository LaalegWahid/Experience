import { NextResponse } from "next/server";
import { getProviderForUser, getSessionUser } from "@/lib/host";
import { getProviderConversations } from "@/lib/messages";
import { tryCatch } from "@/shared/utils/TryCatch";

// GET — every guest conversation across all of the host's listings (host only).
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const provider = await getProviderForUser(user.id);
  if (!provider) {
    return NextResponse.json({ error: "Not a host." }, { status: 403 });
  }

  const conversationsResult = await tryCatch(
    getProviderConversations(provider.id),
  );
  if (!conversationsResult.ok) {
    console.error("[host:conversations:all] failed:", conversationsResult.error);
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  }

  return NextResponse.json({ conversations: conversationsResult.data });
}
