"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { getProviderForUser, getSessionUser } from "@/lib/host";

const onboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth"),
  type: z.enum(["individual", "business"]).default("individual"),
  category: z.string().trim().min(1, "Choose a service").max(120),
  city: z.string().trim().min(1, "Choose a city").max(120),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

function ageFrom(dob: string): number {
  const d = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}


export async function completeHostOnboarding(
  input: OnboardingInput,
): Promise<{ error?: string }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { error: "Please sign in to continue." };

  // Idempotent: already a host with a profile.
  if (await getProviderForUser(sessionUser.id)) return {};

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please complete all fields.",
    };
  }
  const d = parsed.data;

  if (Number.isNaN(new Date(`${d.dateOfBirth}T00:00:00`).getTime())) {
    return { error: "Enter a valid date of birth." };
  }
  if (ageFrom(d.dateOfBirth) < 18) {
    return { error: "You must be at least 18 to host." };
  }

  await db.insert(providers).values({
    userId: sessionUser.id,
    displayName: `${d.firstName} ${d.lastName}`.trim(),
    type: d.type,
    dateOfBirth: d.dateOfBirth,
    city: d.city,
  });

  // Upgrade guest -> host (leave admins untouched).
  if (sessionUser.role !== "host" && sessionUser.role !== "admin") {
    await db
      .update(user)
      .set({ role: "host", updatedAt: new Date() })
      .where(eq(user.id, sessionUser.id));
  }

  revalidatePath("/host");
  return {};
}
