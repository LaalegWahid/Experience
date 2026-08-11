import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOfferingById } from "@/lib/offerings";
import { createMessage, getConversation } from "@/lib/messages";
import { tryCatch } from "@/shared/utils/TryCatch";

type Ctx = { params: Promise<{ id: string }> };

const MAX_LENGTH = 2000;

// GET — the current guest's conversation with this offering's host.
export async function GET(_request: Request, { params }: Ctx) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) {
    console.error("[messages:GET] failed:", sessionResult.error);
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }
  const session = sessionResult.data;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const offeringResult = await tryCatch(getOfferingById(id));
  if (!offeringResult.ok) {
    console.error("[messages:GET] failed:", offeringResult.error);
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }
  if (!offeringResult.data) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const rowsResult = await tryCatch(getConversation(id, session.user.id));
  if (!rowsResult.ok) {
    console.error("[messages:GET] failed:", rowsResult.error);
    return NextResponse.json(
      { error: "Could not load messages." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    messages: rowsResult.data.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === session.user.id,
      createdAt: m.createdAt,
    })),
  });
}

// POST — the guest sends a message to the host.
export async function POST(request: Request, { params }: Ctx) {
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  if (!sessionResult.ok) {
    console.error("[messages:POST] failed:", sessionResult.error);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }
  const session = sessionResult.data;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const offeringResult = await tryCatch(getOfferingById(id));
  if (!offeringResult.ok) {
    console.error("[messages:POST] failed:", offeringResult.error);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 },
    );
  }
  const offering = offeringResult.data;
  if (!offering) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  if (offering.status !== "published") {
    return NextResponse.json(
      { error: "This service is not available." },
      { status: 409 },
    );
  }
  if (offering.provider?.userId === session.user.id) {
    return NextResponse.json(
      { error: "You are the host of this service." },
      { status: 400 },
    );
  }

  const bodyResult = await tryCatch(
    request.json() as Promise<{ body?: unknown }>,
  );
  if (!bodyResult.ok) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = bodyResult.data;
  const text = typeof payload.body === "string" ? payload.body.trim() : "";
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
      guestId: session.user.id,
      senderId: session.user.id,
      body: text,
    }),
  );
  if (!createResult.ok) {
    console.error("[messages:POST] failed:", createResult.error);
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
