# i18n Translation Progress (EN ⇄ ES)

Handoff doc so this work can resume in a fresh chat. Goal: make **every page**
of the app translatable to Spanish (no exceptions), matching the existing
English/Spanish dictionary system.

---

## How the i18n system works (read first)

- **Dictionary:** [`shared/i18n/dictionaries.ts`](shared/i18n/dictionaries.ts) holds a flat `en` object
  (source of truth for keys) and an `es` object (must have the same keys —
  enforced by `Record<TranslationKey, string>`). `TranslationKey = keyof typeof en`.
- **Locale is global:** stored in a cookie; switching it (`setLocale`) writes the
  cookie and calls `router.refresh()`, so the whole app re-renders. The *mechanism*
  already reaches every page — only the *content* (strings wired to `t()`) is missing.
- **Server components:** `const t = await getT();` (from `@/lib/i18n`). For
  page titles use `export async function generateMetadata()` + `getT()`.
- **Client components:** `const { t } = useLanguage();` (from `@/components/language-provider`).
- **Locale-aware dates:** `const locale = await getLocale()` (server) or
  `const { locale } = useLanguage()` (client), then pass to
  `date.toLocaleDateString(locale, …)` / `toLocaleString(locale, …)`.

### Conventions / patterns used
1. **Interpolation** (the dictionary has no built-in interpolation): keys hold
   `{placeholder}` tokens, filled at the call site:
   ```ts
   t("booking.dateAtTime").replace("{date}", date).replace("{time}", time)
   ```
2. **Enum / label maps:** convert maps of English values into maps of
   `TranslationKey` values, then resolve with `t()`:
   ```ts
   const FORMAT_KEYS: Record<string, TranslationKey> = { public_group: "service.format.publicGroup", … };
   const k = FORMAT_KEYS[x]; return k ? t(k) : x;
   ```
3. **Dynamic keys:** build a key string and cast:
   `t(`role.${role}` as TranslationKey)`.
4. **Server helper components** that need `t`: either make them `async` and call
   `getT()` inside, OR pass `t` (and `locale`) down as props
   (type `Translator = (key: TranslationKey) => string`). Both patterns are used
   (e.g. `app/appointments/page.tsx` passes `t`/`locale` to `Card`/`Section`).
5. **Don't translate:** brand name "Gathra", proper-noun sample data, and raw
   API/server error strings (only the client-side fallback messages).

### After adding keys, always typecheck
```bash
npx tsc --noEmit
```
Every batch so far ends at **0 errors**. Keep it that way.

---

## ✅ Completed (fully wired, typechecks clean)

- `app/page.tsx` — home/marketplace (pre-existing)
- `app/services/[id]/page.tsx` — service detail **body + calendar**
- Service-detail widget tree:
  - `components/reserve-button.tsx`
  - `components/booking-provider.tsx` (the whole booking modal)
  - `components/booking-payment-form.tsx`
  - `components/stripe-card-fields.tsx`
  - `components/usdc-pay-button.tsx`
  - `components/service-chat.tsx`
  - `components/menu-carousel.tsx`
  - `components/location-map.tsx`
  - `components/favorite-button.tsx`
  - `components/availability-calendar.tsx`
- `app/favorites/page.tsx`
- `app/page.tsx` (host landing, now the site root) + `components/landing/explore.tsx`
- `app/become-a-host/page.tsx` + `onboarding-wizard.tsx`
- Auth: `components/auth-modal.tsx`, `components/google-sign-in-button.tsx`
  (`/login` + `/register` are redirects → modal)
- `app/profile/page.tsx`
- `app/notifications/page.tsx`
- `app/appointments/page.tsx`
- `app/refer/page.tsx`
- `components/referrals/guest-referrals-section.tsx`
- `components/referrals/referrals-manager.tsx`
- `components/countdown.tsx`

**Namespaces already in the dictionary:** `nav.*`, `menu.*`, `role.*`, `lang.*`,
`home.*`, `search.*`, `service.*`, `calendar.*`, `reserve.*`, `favorite.*`,
`menuCarousel.*`, `locationMap.*`, `chat.*`, `booking.*`, `pay.*`, `usdc.*`,
`card.*`, `fav.*`, `onb.*`, `hae.*`, `exp.*`, `auth.*`, `profile.*`, `refer.*`,
`notif.*`, `appt.*`, `ref.*`, `cd.*`.

---

## ⬜ Remaining work (resume here)

### Batch 6 — Account (IN PROGRESS, nothing wired yet)
- [ ] `app/account/settings/page.tsx`  ← **RESUME HERE** (read but not edited;
      `settings[]` array has `title`/`description` to key-ify)
- [ ] `app/account/invoices/page.tsx`
- [ ] `app/account/payment-methods/page.tsx` (+ any client component it uses)

### Batch 7 — Host dashboard (9 pages, none done)
- [ ] `app/host/page.tsx`
- [ ] `app/host/today/page.tsx`
- [ ] `app/host/calendar/page.tsx` (+ `components/host-calendar.tsx`)
- [ ] `app/host/listings/page.tsx`
- [ ] `app/host/listings/[id]/page.tsx`
- [ ] `app/host/listings/new/page.tsx`
- [ ] `app/host/bookings/page.tsx`
- [ ] `app/host/messages/page.tsx`
- [ ] `app/host/payouts/page.tsx`
- [ ] their shared components (check each page's imports)

### Batch 8 — Admin (6 pages, none done)
- [ ] `app/admin/page.tsx`
- [ ] `app/admin/listings/page.tsx`
- [ ] `app/admin/reports/page.tsx`
- [ ] `app/admin/reservations/page.tsx`
- [ ] `app/admin/transactions/page.tsx`
- [ ] `app/admin/users/page.tsx`

### Batch 9 — Misc (2 pages)
- [ ] `app/invite/expired/page.tsx`
- [ ] `app/developer/page.tsx`

### Batch 10 — Final pass
- [ ] **SEO `metadata`** still hardcoded in English on some pages — convert to
      translated `generateMetadata`:
  - `app/page.tsx` (host landing root: PAGE_TITLE / PAGE_DESCRIPTION + OG/Twitter)
  - `app/services/[id]/page.tsx` ("Service not found" + description)
  - `app/account/settings/page.tsx` title (and any others as encountered)
- [ ] Decide on **decorative phone-mockup sample strings** on the landing page
      (fake listing names inside the tiny phone screenshots in
      `components/landing/phone-mockup.tsx` + `explore.tsx` preview card) —
      currently left as illustrative English on purpose. Translate if desired.
- [ ] Final `npx tsc --noEmit` → expect 0 errors.

---

## Resume checklist for a new chat
1. Read this file + `shared/i18n/dictionaries.ts` (to see existing keys/patterns).
2. Pick the next unchecked page; read it; extract user-visible strings.
3. Add `en` + `es` keys (same namespace style) to the dictionary.
4. Wire with `getT()` (server) or `useLanguage()` (client); use `.replace()` for
   interpolation; pass `t`/`locale` to server helper components as needed.
5. `npx tsc --noEmit` → fix to 0 errors.
6. Tick the boxes above and move on.
