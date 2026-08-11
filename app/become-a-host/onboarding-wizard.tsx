"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { completeHostOnboarding } from "./actions";
import {
  SERVICE_CATEGORIES,
  findServiceCategory,
} from "@/shared/data/service-categories";
import { searchCities } from "@/shared/data/cities";
import { useLanguage } from "@/components/language-provider";
import { gathraLogo } from "@/shared/brand";

const TOTAL_STEPS = 5;

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3.5 text-base text-foreground outline-none transition-colors focus:border-foreground dark:border-zinc-700 dark:focus:border-zinc-200";

function ageFrom(dob: string): number {
  const d = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function OnboardingWizard({
  firstName: initialFirst,
  lastName: initialLast,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [dob, setDob] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  }, []);

  const back = () => (step === 0 ? router.push("/") : setStep((s) => s - 1));
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));

  const aboutValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dob !== "" &&
    ageFrom(dob) >= 18;

  async function finish() {
    setError(null);
    setPending(true);
    const res = await completeHostOnboarding({
      firstName,
      lastName,
      dateOfBirth: dob,
      type: "individual",
      category,
      city,
    });
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
    const cat = findServiceCategory(category);
    const params = new URLSearchParams({
      category,
      type: cat?.type ?? "service",
      city,
    });
    router.push(`/host/listings/new?${params.toString()}`);
  }

  const showFooter = step === 0 || step === 3 || step === 4;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Image
          src={gathraLogo}
          alt="Local Experiences"
          priority
          className="h-10 w-auto dark:invert"
        />
        <button
          type="button"
          onClick={back}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {t("onb.back")}
        </button>
      </header>

      {/* Step content */}
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        {step === 0 && (
          <div className="w-full max-w-md">
            <Heading title={t("onb.aboutTitle")} center />
            <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
              {t("onb.aboutSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("onb.firstName")}>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("onb.lastName")}>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={t("onb.dob")}>
                <input
                  type="date"
                  value={dob}
                  max={maxDob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClass}
                />
                <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("onb.ageNote")}
                </span>
              </Field>
              <Field label={t("onb.email")}>
                <input
                  value={email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-900`}
                />
              </Field>
              <p className="text-xs text-zinc-400">{t("onb.terms")}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-zinc-200 bg-background p-10 text-center shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:shadow-none">
            <Image src={gathraLogo} alt="" className="h-12 w-auto" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("onb.belongTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("onb.belongBody")}
            </p>
            <button
              type="button"
              onClick={next}
              className="w-full rounded-full bg-accent py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              {t("onb.agree")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("onb.decline")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-4xl">
            <Heading title={t("onb.whichService")} center big />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {SERVICE_CATEGORIES.map((c) => {
                const selected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCategory(c.value);
                      setStep(3);
                    }}
                    className={`flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all ${
                      selected
                        ? "border-foreground shadow-md ring-1 ring-foreground"
                        : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg dark:border-zinc-800 dark:hover:border-zinc-600"
                    }`}
                  >
                    <Image
                      src={c.icon}
                      alt=""
                      width={72}
                      height={72}
                      className="h-16 w-16 object-contain"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {c.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <SplitLayout preview={<PreviewCard category={category} />}>
            <Heading title={t("onb.whereTitle")} big />
            <button
              type="button"
              onClick={() => setCityOpen(true)}
              className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-zinc-300 px-4 py-4 text-left transition-colors hover:border-foreground dark:border-zinc-700"
            >
              <PinIcon />
              <span className={city ? "text-foreground" : "text-zinc-400"}>
                {city || t("onb.enterCity")}
              </span>
            </button>
          </SplitLayout>
        )}

        {step === 4 && (
          <SplitLayout
            preview={<PreviewCard category={category} city={city} tilt />}
          >
            <Heading title={t("onb.createTitle")} big />
            <p className="mt-4 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("onb.createBody")}
            </p>
            {error && (
              <p className="mt-6 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </SplitLayout>
        )}
      </main>

      {/* Footer (action row) */}
      {showFooter && (
        <div className="flex items-center justify-between px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-10">
          <button
            type="button"
            onClick={back}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("onb.back")}
          </button>
          {step === 0 && (
            <PrimaryButton disabled={!aboutValid} onClick={next}>
              {t("onb.agree")}
            </PrimaryButton>
          )}
          {step === 3 && (
            <PrimaryButton disabled={!city.trim()} onClick={next}>
              {t("onb.next")}
            </PrimaryButton>
          )}
          {step === 4 && (
            <PrimaryButton disabled={pending} onClick={finish}>
              {pending ? t("onb.settingUp") : t("nav.getStarted")}
            </PrimaryButton>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {cityOpen && (
        <CityModal
          onClose={() => setCityOpen(false)}
          onSelect={(c) => {
            setCity(c);
            setCityOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CityModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (city: string) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCities(query), [query]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-28"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl dark:border dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center">
          <h2 className="text-base font-semibold text-foreground">
            {t("onb.enterCity")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("booking.close")}
            className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-full border border-zinc-300 px-4 py-3 focus-within:border-foreground dark:border-zinc-700">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("onb.searchCity")}
            className="w-full bg-transparent text-base text-foreground outline-none"
          />
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t("onb.suggested")}
        </p>
        <ul className="mt-2 max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <li className="px-1 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              {t("onb.noCities")}
            </li>
          ) : (
            results.map((c) => (
              <li key={`${c.city}-${c.country}`}>
                <button
                  type="button"
                  onClick={() => onSelect(c.city)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <PinIcon small />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-foreground">
                      {c.city}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.country}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function PinIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${small ? "h-4 w-4" : "h-5 w-5"} shrink-0 text-zinc-500`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SplitLayout({
  preview,
  children,
}: {
  preview: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
      <div>{children}</div>
      <div className="hidden lg:flex lg:justify-center">{preview}</div>
    </div>
  );
}

function PreviewCard({
  category,
  city,
  tilt = false,
}: {
  category: string;
  city?: string;
  tilt?: boolean;
}) {
  const { t } = useLanguage();
  const cat = findServiceCategory(category);
  return (
    <div
      className={`w-full max-w-[260px] rounded-3xl border border-zinc-200 bg-background p-8 shadow-2xl shadow-zinc-300/40 dark:border-zinc-800 dark:shadow-none ${
        tilt ? "rotate-3" : ""
      }`}
    >
      <div className="flex h-32 items-center justify-center">
        {cat ? (
          <Image
            src={cat.icon}
            alt=""
            width={112}
            height={112}
            className="h-24 w-24 object-contain"
          />
        ) : (
          <span className="text-6xl">✨</span>
        )}
      </div>
      <p className="mt-4 text-center text-lg font-semibold text-foreground">
        {category || t("onb.yourService")}
      </p>
      {city && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {city}
        </p>
      )}
    </div>
  );
}

function Heading({
  title,
  center = false,
  big = false,
}: {
  title: string;
  center?: boolean;
  big?: boolean;
}) {
  return (
    <h1
      className={`font-semibold tracking-tight text-foreground ${
        center ? "text-center" : ""
      } ${big ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}
    >
      {title}
    </h1>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
