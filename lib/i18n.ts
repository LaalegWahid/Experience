import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "@/shared/i18n/config";
import { translate, type TranslationKey } from "@/shared/i18n/dictionaries";

/** The viewer's chosen locale, read from the cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

/** A translator bound to the viewer's locale, for use in Server Components. */
export async function getT(): Promise<(key: TranslationKey) => string> {
  const locale = await getLocale();
  return (key: TranslationKey) => translate(locale, key);
}
