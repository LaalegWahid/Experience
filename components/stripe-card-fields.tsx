"use client";

import { useEffect, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js";
import { useLanguage } from "./language-provider";

/*
 * Custom, fully styleable card UI.
 *
 * Stripe requires the raw card number / expiry / CVC to live inside its own
 * iframes (for PCI), but everything around them — labels, layout, borders,
 * focus + error states — is our own markup, restyleable however you like. Only
 * the text *inside* each field is themed via the `style` option below.
 */

// The container around each Stripe iframe. Borders react to Stripe's own
// state classes (.StripeElement--focus / --invalid) via :has().
const fieldBox =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 transition-colors [&:has(.StripeElement--focus)]:border-accent [&:has(.StripeElement--invalid)]:border-red-500 dark:border-zinc-700";
const labelText = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function StripeCardFields() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);

  // Keep the in-iframe text color in sync with the site theme.
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const options = {
    style: {
      base: {
        color: dark ? "#ededed" : "#171717",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        "::placeholder": { color: dark ? "#71717a" : "#a1a1aa" },
      },
      invalid: { color: "#ef4444" },
    },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className={labelText}>{t("card.number")}</span>
        <div className={fieldBox}>
          <CardNumberElement
            options={{ ...options, showIcon: true, placeholder: "1234 1234 1234 1234" }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={labelText}>{t("card.expiry")}</span>
          <div className={fieldBox}>
            <CardExpiryElement options={options} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={labelText}>{t("card.cvc")}</span>
          <div className={fieldBox}>
            <CardCvcElement options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}
