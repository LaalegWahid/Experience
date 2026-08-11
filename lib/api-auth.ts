import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, type ApiKey } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { hashApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api-response";

export type ApiActor = {
  user: { id: string; name: string; email: string; role: string };
  key: ApiKey;
};

/** Read the API key from `Authorization: Bearer …` or `x-api-key`. */
function extractKey(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim() || null;
  const xKey = request.headers.get("x-api-key");
  return xKey?.trim() || null;
}

/**
 * Resolve the actor behind an API key, or `null` if the key is missing,
 * unknown, revoked, or expired. Updates `lastUsedAt` opportunistically.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiActor | null> {
  const raw = extractKey(request);
  if (!raw) return null;

  const [row] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashApiKey(raw)), isNull(apiKeys.revokedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  const [u] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, row.userId))
    .limit(1);
  if (!u) return null;

  // Best-effort last-used stamp; don't block the request on it.
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return { user: u, key: row };
}

/**
 * Guard for route handlers: returns the authenticated actor, or a ready-to-send
 * 401 `NextResponse`. A key acts as its owner, so what it can do is decided by
 * the owner's role — guest endpoints accept any key; host endpoints additionally
 * require the owner to be a host (enforced in those routes via provider checks).
 *
 *   const actor = await requireApiActor(request);
 *   if (actor instanceof NextResponse) return actor;
 */
export async function requireApiActor(
  request: Request,
): Promise<ApiActor | NextResponse> {
  const actor = await authenticateApiKey(request);
  if (!actor) {
    return apiError(401, "Missing or invalid API key.", "unauthorized");
  }
  return actor;
}
