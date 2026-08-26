"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  type Locale,
} from "@/shared/i18n/config";
import { translate, type TranslationKey } from "@/shared/i18n/dictionaries";

type LanguageContextValue = {
  locale: Locale;
  /** Translate a key in the current locale. */
  t: (key: TranslationKey) => string;
  /** Persist + apply a new locale (re-renders server components via refresh). */
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Seeds client components with the cookie-derived locale (passed from the root
 * layout) so they translate in sync with the server. Switching writes the
 * cookie and calls `router.refresh()` so server components re-render too.
 */
export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // 1 year, root path; not httpOnly so the server can read it next request.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t: (key) => translate(locale, key),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
