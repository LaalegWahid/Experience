"use client";

import { createContext, useContext, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { BookingPaymentForm } from "@/components/booking-payment-form";
import { UsdcPayButton } from "@/components/usdc-pay-button";
import { tryCatch } from "@/shared/utils/TryCatch";
import { useAuthModal } from "./auth-modal-provider";
import { useLanguage } from "./language-provider";
import type { AvailabilityWindow } from "@/lib/offerings";
import type { SavedCard } from "@/lib/payment-methods";
import type { TranslationKey } from "@/shared/i18n/dictionaries";
import { formatMoney } from "@/shared/utils/money";

type BookingContextValue = {
  bookable: boolean;
  isAuthenticated: boolean;
  /** Open the booking modal, optionally pre-selecting a date ("YYYY-MM-DD"). */
  startBooking: (presetDate?: string) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}

const WEEKDAY_KEYS: TranslationKey[] = [
  "calendar.mon", // index 0 unused (ISO weekdays are 1–7)
  "calendar.mon",
  "calendar.tue",
  "calendar.wed",
  "calendar.thu",
  "calendar.fri",
  "calendar.sat",
  "calendar.sun",
];
const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// JS getDay() (0=Sun…6=Sat) → ISO weekday (1=Mon…7=Sun).
function isoWeekday(date: string): number {
  const js = new Date(`${date}T00:00:00`).getDay();
  return js === 0 ? 7 : js;
}

// Bookable start times within a window that still fit the full duration.
function slotsFor(window: AvailabilityWindow, durationMinutes: number): string[] {
  const start = toMinutes(window.startTime);
  const end = toMinutes(window.endTime);
  const slots: string[] = [];
  for (let t = start; t + durationMinutes <= end; t += 30) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
}

export type MenuChoice = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
};

type Props = {
  serviceId: string;
  isAuthenticated: boolean;
  bookable: boolean;
  availability: AvailabilityWindow[];
  durationMinutes: number;
  menu?: MenuChoice[];
  currency?: string;
  /** When "at_guest", the guest must share their location to book. */
  locationType?: string;
  children: React.ReactNode;
};

export function BookingProvider({
  serviceId,
  isAuthenticated,
  bookable,
  availability,
  durationMinutes,
  menu = [],
  currency = "USD",
  locationType = "at_host",
  children,
}: Props) {
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [baseAmount, setBaseAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locCheck, setLocCheck] = useState<{
    status: "idle" | "checking" | "valid" | "invalid" | "unverifiable";
    minutes?: number;
    max?: number;
    host?: { lat: number; lng: number };
  }>({ status: "idle" });

  const requiresLocation = locationType === "at_guest";
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
  const availableDays = [...new Set(availability.map((w) => w.dayOfWeek))].sort();
  const rule = date
    ? availability.find((w) => w.dayOfWeek === isoWeekday(date))
    : undefined;
  const slots = rule ? slotsFor(rule, durationMinutes) : [];

  function startBooking(presetDate?: string) {
    if (!bookable) return;
    if (!isAuthenticated) {
      openAuth({ redirect: `/services/${serviceId}` });
      return;
    }
    setDate(presetDate ?? "");
    setTime("");
    setMenuItemId(menu.length === 1 ? menu[0].id : "");
    setClientSecret(null);
    setError(null);
    setComplete(false);
    setLoading(false);
    setGeo(null);
    setGeoError(null);
    setLocating(false);
    setLocCheck({ status: "idle" });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setDate("");
    setTime("");
    setMenuItemId("");
    setClientSecret(null);
    setSavedCards([]);
    setPayAmount(null);
    setBaseAmount(null);
    setError(null);
    setComplete(false);
    setLoading(false);
    setGeo(null);
    setGeoError(null);
    setLocating(false);
    setLocCheck({ status: "idle" });
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setGeoError(t("booking.geoUnavailable"));
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeo(g);
        setLocating(false);
        void checkLocation(g);
      },
      () => {
        setGeoError(t("booking.geoDenied"));
        setLocating(false);
      },
    );
  }

  // Validation step between sharing a location and paying: confirm the guest
  // is within the host's travel range.
  async function checkLocation(g: { lat: number; lng: number }) {
    setLocCheck({ status: "checking" });
    const res = await tryCatch(
      fetch("/api/check-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, guestLat: g.lat, guestLng: g.lng }),
      }),
    );
    if (!res.ok || !res.data.ok) {
      console.log("[booking] location check failed (network).");
      setLocCheck({ status: "unverifiable" });
      return;
    }
    const parsed = await tryCatch(
      res.data.json() as Promise<{
        valid?: boolean;
        reason?: string;
        travelMinutes?: number;
        maxTravelMinutes?: number;
        host?: { lat: number; lng: number };
      }>,
    );
    const d = parsed.ok ? parsed.data : {};

    if (d.reason === "host_location_unset" || d.reason === "not_required") {
      console.log(
        "[booking] location can't be verified (host hasn't set a travel point) — allowing.",
      );
      setLocCheck({ status: "unverifiable" });
      return;
    }
    if (d.valid) {
      console.log(
        `[booking] location VALID — ~${d.travelMinutes} min away vs ${d.maxTravelMinutes} min max.`,
      );
      setLocCheck({
        status: "valid",
        minutes: d.travelMinutes,
        max: d.maxTravelMinutes,
        host: d.host,
      });
    } else {
      console.log(
        `[booking] location INVALID — ~${d.travelMinutes} min away exceeds ${d.maxTravelMinutes} min max. Cannot proceed to payment.`,
      );
      setLocCheck({
        status: "invalid",
        minutes: d.travelMinutes,
        max: d.maxTravelMinutes,
        host: d.host,
      });
    }
  }

  const locationConfirmed =
    locCheck.status === "valid" || locCheck.status === "unverifiable";

  async function proceed() {
    if (!date || !time) return;
    if (menu.length > 0 && !menuItemId) return;
    if (requiresLocation && !locationConfirmed) return;
    setLoading(true);
    setError(null);

    const res = await tryCatch(
      fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time,
          menuItemId: menuItemId || undefined,
          guestLat: geo?.lat,
          guestLng: geo?.lng,
        }),
      }),
    );
    if (!res.ok) {
      setLoading(false);
      setError(t("booking.networkError"));
      return;
    }
    const parsed = await tryCatch(
      res.data.json() as Promise<{
        clientSecret?: string;
        amount?: number;
        baseAmount?: number;
        currency?: string;
        savedCards?: SavedCard[];
        error?: string;
        reason?: string;
        travelMinutes?: number;
        maxTravelMinutes?: number;
      }>,
    );
    const data = parsed.ok ? parsed.data : {};
    setLoading(false);

    // Guest is farther than the host's travel time — log before stopping,
    // so it never reaches the payment step.
    if (data.reason === "outside_travel_range") {
      console.log(
        `[booking] location over travel limit — ~${data.travelMinutes} min away vs ${data.maxTravelMinutes} min max. Not proceeding to payment.`,
      );
    }

    if (!res.data.ok) {
      setError(
        data.error ??
          t("booking.checkoutFailed").replace("{status}", String(res.data.status)),
      );
      return;
    }
    if (!data.clientSecret) {
      setError(t("booking.noPayment"));
      return;
    }
    setSavedCards(data.savedCards ?? []);
    setPayAmount(data.amount ?? null);
    setBaseAmount(data.baseAmount ?? null);
    setClientSecret(data.clientSecret);
  }

  const inputClass =
    "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700 dark:focus:border-accent";

  return (
    <BookingContext.Provider value={{ bookable, isAuthenticated, startBooking }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-foreground">
                {complete
                  ? t("booking.titleConfirmed")
                  : clientSecret
                    ? t("booking.titlePayment")
                    : t("booking.titleChoose")}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={t("booking.close")}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto">
              {complete ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-950/50">
                    ✓
                  </span>
                  <p className="font-medium text-foreground">
                    {t("booking.confirmedThanks")}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t("booking.dateAtTime")
                      .replace("{date}", date)
                      .replace("{time}", time)}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
                  >
                    {t("booking.done")}
                  </button>
                </div>
              ) : clientSecret ? (
                <div>
                  <p className="border-b border-zinc-100 px-5 py-3 text-sm text-zinc-600 dark:border-zinc-800/70 dark:text-zinc-400">
                    {t("booking.appointment")}{" "}
                    <span className="font-medium text-foreground">
                      {t("booking.dateAtTime")
                        .replace("{date}", date)
                        .replace("{time}", time)}
                    </span>
                  </p>
                  <div className="flex flex-col gap-4 p-5">
                    <Elements stripe={stripePromise}>
                      <BookingPaymentForm
                        clientSecret={clientSecret}
                        savedCards={savedCards}
                        amountCents={payAmount}
                        currency={currency}
                        onSuccess={() => setComplete(true)}
                      />
                    </Elements>

                    {baseAmount != null && (
                      <>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                          {t("booking.orCrypto")}
                          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <UsdcPayButton
                          priceCents={baseAmount}
                          serviceId={serviceId}
                          date={date}
                          time={time}
                          menuItemId={menuItemId || undefined}
                          guestLat={geo?.lat}
                          guestLng={geo?.lng}
                          onSuccess={() => setComplete(true)}
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-5">
                  {availableDays.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t("booking.noAvailability")}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t("booking.availableOn").replace(
                          "{days}",
                          availableDays
                            .map((d) => t(WEEKDAY_KEYS[d]))
                            .join(", "),
                        )}
                      </p>

                      {requiresLocation && (
                        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                          <span className="text-sm font-medium text-foreground">
                            {t("booking.yourLocation")}
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t("booking.locationPrompt")}
                          </p>
                          <button
                            type="button"
                            onClick={shareLocation}
                            disabled={locating}
                            className="flex w-fit items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                          >
                            📍{" "}
                            {locating
                              ? t("booking.locating")
                              : geo
                                ? t("booking.locationShared")
                                : t("booking.shareLocation")}
                          </button>
                          {geoError && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {geoError}
                            </span>
                          )}
                          {locCheck.status === "checking" && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {t("booking.checkingDistance")}
                            </span>
                          )}
                          {locCheck.status === "valid" && (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {t("booking.withinRange").replace(
                                "{min}",
                                String(locCheck.minutes),
                              )}
                            </span>
                          )}
                          {locCheck.status === "invalid" && (
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              {t("booking.tooFar")
                                .replace("{min}", String(locCheck.minutes))
                                .replace("{max}", String(locCheck.max))}
                            </span>
                          )}
                          {locCheck.status === "unverifiable" && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {t("booking.locationNoted")}
                            </span>
                          )}
                          {locCheck.host && geo && (
                            <div className="flex flex-col gap-1">
                              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <iframe
                                  title={t("booking.mapTitle")}
                                  src={`https://maps.google.com/maps?saddr=${locCheck.host.lat},${locCheck.host.lng}&daddr=${geo.lat},${geo.lng}&output=embed`}
                                  className="h-48 w-full border-0"
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                />
                              </div>
                              <span className="text-[11px] text-zinc-400">
                                {t("booking.routeCaption")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {menu.length > 0 && (
                        <fieldset className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          <span>{t("booking.chooseOption")}</span>
                          {menu.map((m) => (
                            <label
                              key={m.id}
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-normal transition-colors ${
                                menuItemId === m.id
                                  ? "border-accent bg-accent/10"
                                  : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                              }`}
                            >
                              <span className="flex items-center gap-3 text-foreground">
                                <input
                                  type="radio"
                                  name="menuItem"
                                  value={m.id}
                                  checked={menuItemId === m.id}
                                  onChange={() => {
                                    setMenuItemId(m.id);
                                    setError(null);
                                  }}
                                />
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                  {m.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={m.imageUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-zinc-400">
                                      —
                                    </span>
                                  )}
                                </span>
                                {m.name}
                              </span>
                              <span className="font-medium text-foreground">
                                {formatMoney(m.priceCents, currency)}
                              </span>
                            </label>
                          ))}
                        </fieldset>
                      )}

                      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("booking.date")}
                        <input
                          type="date"
                          min={today}
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value);
                            setTime("");
                            setError(null);
                          }}
                          className={inputClass}
                        />
                      </label>

                      {date && !rule && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {t("booking.notAvailableOn").replace(
                            "{day}",
                            t(WEEKDAY_KEYS[isoWeekday(date)]),
                          )}
                        </p>
                      )}

                      {rule && slots.length === 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {t("booking.windowTooShort").replace(
                            "{min}",
                            String(durationMinutes),
                          )}
                        </p>
                      )}

                      {rule && slots.length > 0 && (
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {t("booking.startTime")}
                          <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">{t("booking.selectTime")}</option>
                            {slots.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs font-normal text-zinc-400">
                            {t("booking.slotMeta")
                              .replace("{min}", String(durationMinutes))
                              .replace("{start}", rule.startTime)
                              .replace("{end}", rule.endTime)}
                          </span>
                        </label>
                      )}

                      {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={proceed}
                        disabled={
                          !date ||
                          !time ||
                          loading ||
                          (menu.length > 0 && !menuItemId) ||
                          (requiresLocation && !locationConfirmed)
                        }
                        className="mt-1 flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {loading ? "…" : t("booking.continuePayment")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </BookingContext.Provider>
  );
}
