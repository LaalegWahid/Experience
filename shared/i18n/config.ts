/** Supported UI languages. */
export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie the chosen language is persisted in (readable by server + client). */
export const LOCALE_COOKIE = "locale";

/** Narrow an arbitrary string to a supported locale, falling back to default. */
export function normalizeLocale(value: string | undefined | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
