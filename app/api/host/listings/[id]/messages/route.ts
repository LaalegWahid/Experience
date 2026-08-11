import { NextResponse } from "next/server";
import { getOwnedOfferingForApi } from "@/lib/host";
import { createMessage, getConversation } from "@/lib/messages";
import { tryCatch } from "@/shared/utils/TryCatch";

type Ctx = { params: Promise<{ id: string }> };

const MAX_LENGTH = 2000;

// GET ?guestId=… — the host's view of one guest conversation.
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;

  const ownedResult = await tryCatch(getOwnedOfferingForApi(id));
  if (!ownedResult.ok) {
    console.error("[host:messages:GET] failed:", ownedResult.error);
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }
  if (!ownedResult.data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const hostUserId = ownedResult.data.user.id;

  const guestId = new URL(request.url).searchParams.get("guestId");
  if (!guestId) {
    return NextResponse.json({ error: "Missing guestId." }, { status: 400 });
  }

  const rowsResult = await tryCatch(getConversation(id, guestId));
  if (!rowsResult.ok) {
    console.error("[host:messages:GET] failed:", rowsResult.error);
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    messages: rowsResult.data.map((m) => ({
      id: m.id,
      body: m.body,
      // From the host's perspective, "mine" means the host sent it.
      mine: m.senderId === hostUserId,
      createdAt: m.createdAt,
    })),
  });
}

// POST { guestId, body } — the host replies to a guest.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;

  const ownedResult = await tryCatch(getOwnedOfferingForApi(id));
  if (!ownedResult.ok) {
    console.error("[host:messages:POST] failed:", ownedResult.error);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }
  if (!ownedResult.data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const hostUserId = ownedResult.data.user.id;

  const bodyResult = await tryCatch(
    request.json() as Promise<{ guestId?: string; body?: unknown }>,
  );
  if (!bodyResult.ok) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { guestId } = bodyResult.data;
  if (!guestId) {
    return NextResponse.json({ error: "Missing guestId." }, { status: 400 });
  }

  const text =
    typeof bodyResult.data.body === "string" ? bodyResult.data.body.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 },
    );
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const createResult = await tryCatch(
    createMessage({
      offeringId: id,
      guestId,
      senderId: hostUserId,
      body: text,
    }),
  );
  if (!createResult.ok) {
    console.error("[host:messages:POST] failed:", createResult.error);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }

  const [msg] = createResult.data;
  return NextResponse.json(
    {
      message: { id: msg.id, body: msg.body, mine: true, createdAt: msg.createdAt },
    },
    { status: 201 },
  );
}
