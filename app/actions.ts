"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

/**
 * Upgrade the current guest to a host, then send them to the host area.
 * Idempotent: hosts/admins are left as-is (a host already has every guest
 * privilege, so there's nothing to change). Reachable by direct POST, so the
 * session is always re-checked here.
 */
export async function becomeHost() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "guest";
  if (role === "guest") {
    await db
      .update(user)
      .set({ role: "host", updatedAt: new Date() })
      .where(eq(user.id, session.user.id));
  }

  redirect("/host");
}
