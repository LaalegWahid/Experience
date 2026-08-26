"use client";

import { saveReferrerPayoutMethod } from "./actions";
import {
  PayoutMethodForm,
  type PayoutDefaults,
} from "@/components/payouts/payout-method-form";
import { useLanguage } from "@/components/language-provider";

/** Referrer-facing payout form — same fields as the host one, own action. */
export function ReferrerPayoutForm({
  defaults = {},
  redirectTo,
}: {
  defaults?: PayoutDefaults;
  redirectTo?: string;
}) {
  const { t } = useLanguage();
  return (
    <PayoutMethodForm
      action={saveReferrerPayoutMethod}
      defaults={defaults}
      redirectTo={redirectTo}
      labels={{
        method: "Payout method",
        accountHolder: "Account holder name",
        iban: "IBAN / RIB",
        bicOptional: "BIC / SWIFT",
        countryOptional: "Country",
        bankNameOptional: "Bank name",
        network: "Network",
        stablecoin: "Stablecoin",
        walletAddress: "Wallet address",
        walletHint:
          "Make sure the address is on the selected network. Only stablecoins (USDC/USDT) are supported for now.",
        submit: t("ref.payoutSave"),
        submitting: t("ref.payoutSaving"),
        saved: t("ref.payoutSaved"),
      }}
    />
  );
}
