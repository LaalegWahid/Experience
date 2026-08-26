import { redirect } from "next/navigation";
import { getProviderForUser, getSessionUser } from "@/lib/host";
import { OnboardingWizard } from "./onboarding-wizard";

// Open to any signed-in user (a guest becomes a host here). Already-hosting
// users are sent to their dashboard.
export default async function BecomeAHostPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/become-a-host");
  if (await getProviderForUser(user.id)) redirect("/host");

  const parts = user.name.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  return (
    <OnboardingWizard
      firstName={firstName}
      lastName={lastName}
      email={user.email}
    />
  );
}
