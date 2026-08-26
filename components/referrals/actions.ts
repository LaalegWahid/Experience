"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { referrerPayoutMethods } from "@/db/schema";
import { getSessionUser } from "@/lib/host";
import { getOfferingById } from "@/lib/offerings";
import {
  createServiceReferral,
  hasReferrerPayoutMethod,
  referralUrl,
} from "@/lib/referrals";
import { chainFamily } from "@/shared/data/payouts";
import { env } from "@/shared/utils/env";
import { str, type FormState } from "@/shared/utils/form";
import {
  isValidBic,
  isValidIban,
  isValidWalletAddress,
  normalizeIban,
} from "@/shared/utils/payout";

// On success `createdLink` carries the full referral URL (and the service it
// promotes) back so the referrer can copy it. Links are single-use and expire
// 24h after creation.
export type CreateReferralState = FormState & {
  createdLink?: { url: string; expiresAt: string; serviceTitle: string };
};

/**
 * Generate a referral link for a specific service. Requires the referrer to be
 * signed in with a payout method on file, and the service to be published.
 */
export async function createServiceReferralLink(
  _prev: CreateReferralState,
  formData: FormData,
): Promise<CreateReferralState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const offeringId = str(formData, "offeringId");
  if (!offeringId) return { error: "Choose a service to refer." };

  if (!(await hasReferrerPayoutMethod(user.id))) {
    return { error: "Add a payout method before creating a referral link." };
  }

  const offering = await getOfferingById(offeringId);
  if (!offering || offering.status !== "published") {
    return { error: "That service isn't available to refer." };
  }

  const referral = await createServiceReferral(user.id, offering.id);

  revalidatePath("/refer");
  return {
    ok: true,
    createdLink: {
      url: referralUrl(env.BETTER_AUTH_URL, referral.token),
      expiresAt: referral.expiresAt.toISOString(),
      serviceTitle: offering.title,
    },
  };
}

type PayoutInsert = typeof referrerPayoutMethods.$inferInsert;
type PayoutColumns = Omit<PayoutInsert, "userId">;

/**
 * Save (insert or replace) the referrer's single payout method. Mirrors the
 * host payout save: validates the chosen type and clears the other type's
 * columns so a stale value never lingers.
 */
export async function saveReferrerPayoutMethod(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const type = str(formData, "type");
  if (type !== "bank" && type !== "crypto") {
    return { error: "Choose a payout method." };
  }

  const fieldErrors: Record<string, string[]> = {};
  let columns: PayoutColumns;

  if (type === "bank") {
    const accountHolderName = str(formData, "accountHolderName");
    const iban = normalizeIban(str(formData, "iban"));
    const bic = str(formData, "bic");
    const bankName = str(formData, "bankName");
    const country = str(formData, "country");

    if (accountHolderName.length < 2) {
      fieldErrors.accountHolderName = ["Enter the account holder's name"];
    }
    if (!isValidIban(iban)) {
      fieldErrors.iban = ["Enter a valid IBAN / RIB"];
    }
    if (bic && !isValidBic(bic)) {
      fieldErrors.bic = ["Enter a valid BIC/SWIFT, or leave it blank"];
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

    columns = {
      type: "bank",
      accountHolderName,
      iban,
      bic: bic || null,
      bankName: bankName || null,
      country: country || null,
      walletAddress: null,
      chain: null,
      stablecoin: null,
    };
  } else {
    const chain = str(formData, "chain");
    const stablecoinRaw = str(formData, "stablecoin");
    const walletAddress = str(formData, "walletAddress");
    const family = chainFamily(chain);
    const stablecoin =
      stablecoinRaw === "USDC" || stablecoinRaw === "USDT"
        ? stablecoinRaw
        : null;

    if (!family) fieldErrors.chain = ["Pick a supported network"];
    if (!stablecoin) fieldErrors.stablecoin = ["Pick a stablecoin"];
    if (!walletAddress) {
      fieldErrors.walletAddress = ["Enter your wallet address"];
    } else if (family && !isValidWalletAddress(walletAddress, family)) {
      fieldErrors.walletAddress = [
        "That doesn't look like a valid address for this network",
      ];
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

    columns = {
      type: "crypto",
      // Validated above: `family` exists, so `chain` is a valid enum value.
      chain: chain as PayoutInsert["chain"],
      stablecoin,
      walletAddress,
      accountHolderName: null,
      iban: null,
      bic: null,
      bankName: null,
      country: null,
    };
  }

  await db
    .insert(referrerPayoutMethods)
    .values({ userId: user.id, ...columns })
    .onConflictDoUpdate({
      target: referrerPayoutMethods.userId,
      set: { ...columns, updatedAt: new Date() },
    });

  revalidatePath("/refer");
  return { ok: true };
}
