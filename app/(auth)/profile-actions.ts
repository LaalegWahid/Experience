"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Sets a password for the signed-in user when they add one on the sign-up
 * popup. Accounts created via the email code have no password yet, so this is
 * best-effort: failures (e.g. a password already exists) are swallowed because
 * the user is already authenticated and can always sign in with a code.
 */
export async function setInitialPassword(
  password: string,
): Promise<{ ok: boolean }> {
  if (!password || password.length < 8) return { ok: false };
  try {
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: await headers(),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
