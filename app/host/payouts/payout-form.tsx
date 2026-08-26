"use client";

import { savePayoutMethod } from "./actions";
import {
  PayoutMethodForm,
  type PayoutDefaults,
} from "@/components/payouts/payout-method-form";

export type { PayoutDefaults };

export function PayoutForm({ defaults = {} }: { defaults?: PayoutDefaults }) {
  return (
    <PayoutMethodForm
      action={savePayoutMethod}
      defaults={defaults}
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
        submit: "Save payout method",
        submitting: "Saving…",
        saved: "Payout method saved.",
      }}
    />
  );
}
