"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { payoutMethods } from "@/db/schema";
import { requireProvider } from "@/lib/host";
import { str, type FormState } from "@/shared/utils/form";
import { chainFamily } from "@/shared/data/payouts";
import {
  isValidBic,
  isValidIban,
  isValidWalletAddress,
  normalizeIban,
} from "@/shared/utils/payout";

type PayoutInsert = typeof payoutMethods.$inferInsert;
type PayoutColumns = Omit<PayoutInsert, "providerId">;

/**
 * Save (insert or replace) the provider's single payout method. Validates the
 * fields relevant to the chosen type and clears the other type's columns so a
 * stale bank/wallet value never lingers.
 */
export async function savePayoutMethod(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { provider } = await requireProvider();

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
    .insert(payoutMethods)
    .values({ providerId: provider.id, ...columns })
    .onConflictDoUpdate({
      target: payoutMethods.providerId,
      set: { ...columns, updatedAt: new Date() },
    });

  revalidatePath("/host/payouts");
  revalidatePath("/host");
  return { ok: true };
}
