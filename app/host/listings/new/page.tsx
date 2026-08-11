import { eq } from "drizzle-orm";
import { db } from "@/db";
import { offerings, payoutMethods } from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { ListingWizard, type WizardPayoutDefaults } from "./listing-wizard";
import { ExperienceWizard } from "./experience-wizard";
import { ListingTypeChoice } from "./listing-type-choice";
import { ExperienceOnboarding } from "./experience-onboarding";
import type { ExperienceSnapshot, WizardSnapshot } from "./wizard-types";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    type?: string;
    city?: string;
    draft?: string;
  }>;
}) {
  const { provider } = await requireProvider();
  const sp = await searchParams;

  // Prefill the payout step from the provider's existing method, if any.
  const [payout] = await db
    .select()
    .from(payoutMethods)
    .where(eq(payoutMethods.providerId, provider.id))
    .limit(1);
  const payoutDefaults: WizardPayoutDefaults = payout
    ? {
        type: payout.type,
        accountHolderName: payout.accountHolderName ?? undefined,
        iban: payout.iban ?? undefined,
        bic: payout.bic ?? undefined,
        bankName: payout.bankName ?? undefined,
        country: payout.country ?? undefined,
        chain: payout.chain ?? undefined,
        stablecoin: payout.stablecoin ?? undefined,
        walletAddress: payout.walletAddress ?? undefined,
      }
    : {};

  // Resuming an in-progress draft from the dashboard: reopen the wizard at the
  // step the host stopped on, pre-filled from the saved snapshot.
  if (sp.draft) {
    const [draft] = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, sp.draft))
      .limit(1);
    if (draft && draft.providerId === provider.id) {
      const draftCity =
        draft.metadata?.residentialAddress?.city ??
        draft.metadata?.startingLocation ??
        provider.city ??
        "";
      if (draft.type === "experience") {
        return (
          <ExperienceWizard
            category={draft.category ?? ""}
            subcategory={draft.subcategory ?? ""}
            city={draftCity}
            displayName={provider.displayName}
            initialState={(draft.metadata?.draftState ?? null) as ExperienceSnapshot | null}
            initialDraftId={draft.id}
          />
        );
      }
      return (
        <ListingWizard
          type={draft.type}
          category={draft.category ?? ""}
          city={draftCity}
          displayName={provider.displayName}
          initialState={(draft.metadata?.draftState ?? null) as WizardSnapshot | null}
          initialDraftId={draft.id}
          payoutDefaults={payoutDefaults}
        />
      );
    }
  }

  // Fresh start (no type/category chosen yet) → ask Service vs Experience first.
  if (!sp.type && !sp.category) {
    return <ListingTypeChoice />;
  }

  // Experience flow: collect category / sub-type / city before the wizard.
  if (sp.type === "experience" && !sp.category) {
    return <ExperienceOnboarding defaultCity={provider.city ?? ""} />;
  }

  if (sp.type === "experience") {
    return (
      <ExperienceWizard
        category={sp.category ?? ""}
        subcategory={sp.subcategory ?? ""}
        city={sp.city ?? provider.city ?? ""}
        displayName={provider.displayName}
      />
    );
  }

  return (
    <ListingWizard
      type="service"
      category={sp.category ?? ""}
      city={sp.city ?? provider.city ?? ""}
      displayName={provider.displayName}
      payoutDefaults={payoutDefaults}
    />
  );
}
