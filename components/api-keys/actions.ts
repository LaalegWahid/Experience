"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { getProviderForUser, getSessionUser } from "@/lib/host";
import { generateApiKey } from "@/lib/api-key";
import { str, type FormState } from "@/shared/utils/form";

// On success, `createdKey.raw` carries the full secret back to the client so it
// can be shown exactly once — it is never persisted or returned again.
export type CreateKeyState = FormState & {
  createdKey?: { raw: string; name: string };
};

export async function createApiKey(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const name = str(formData, "name") || "Default key";
  if (name.length > 80) return { error: "Key name is too long." };

  // Capability follows the account's role: a host can call host + guest APIs,
  // a guest only the guest APIs. Enforced server-side per request too.
  const isHost = (await getProviderForUser(user.id)) != null;
  const scopes = isHost ? ["host", "guest"] : ["guest"];

  const { raw, prefix, hash } = generateApiKey();
  await db.insert(apiKeys).values({
    userId: user.id,
    name,
    prefix,
    keyHash: hash,
    scopes,
  });

  revalidatePath("/host");
  revalidatePath("/appointments");
  return { ok: true, createdKey: { raw, name } };
}

export async function revokeApiKey(keyId: string) {
  const user = await getSessionUser();
  if (!user) return;

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, user.id),
        isNull(apiKeys.revokedAt),
      ),
    );

  revalidatePath("/host");
  revalidatePath("/appointments");
}
