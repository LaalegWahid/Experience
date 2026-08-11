"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Reveal } from "@/components/landing/reveal";
import { gathraLogo } from "@/shared/brand";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

// ── Fee calculator data ─────────────────────────────────────────────────────

const COMPETITORS = [
  { name: "Uber", pct: 25, logo: "/competitors_logos/uber-icon.png" },
  { name: "Fiverr", pct: 20, logo: "/competitors_logos/fiverr-icon.png" },
  { name: "Airbnb", pct: 20, logo: "/competitors_logos/airbnb-icon-logo.png" },
  { name: "TaskRabbit", pct: 15, logo: "/competitors_logos/taskrabit.png" },
];

const GATHRA_LOGO = gathraLogo.src;
const GATHRA_PCT = 10;
const MAX_PCT = 25;
const AVG_COMPETITOR_PCT =
  COMPETITORS.reduce((s, c) => s + c.pct, 0) / COMPETITORS.length;

const PRICE_MIN = 25;
const PRICE_MAX = 500;

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

// ── Hooks ───────────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

// ── Fee bar ─────────────────────────────────────────────────────────────────

function FeeRow({
  name,
  pct,
  price,
  grow,
  delay,
  logo,
  lead = false,
  lowestLabel,
}: {
  name: string;
  pct: number;
  price: number;
  grow: boolean;
  delay: number;
  logo: string;
  lead?: boolean;
  lowestLabel?: string;
}) {
  const width = Math.round((pct / MAX_PCT) * 100);
  const take = (price * pct) / 100;

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 ${
        lead
          ? "-mx-3 rounded-2xl bg-accent/10 px-3 py-3 ring-1 ring-accent/25 sm:-mx-4 sm:px-4"
          : ""
      }`}
    >
      {/* Brand mark — instant recognition, the hook of the comparison. */}
      <div
        className={`relative shrink-0 ${lead ? "h-12 w-12" : "h-10 w-10"}`}
      >
        <Image
          src={logo}
          alt={name}
          fill
          sizes="48px"
          className="object-contain"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span
              className={
                lead
                  ? "text-base font-bold text-foreground"
                  : "text-sm font-semibold text-zinc-600 dark:text-zinc-300"
              }
            >
              {name}
            </span>
            {lead && lowestLabel && (
              <span className="rounded-pill bg-green-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                {lowestLabel}
              </span>
            )}
          </span>
          <span
            className={`shrink-0 tabular-nums ${
              lead
                ? "text-xl font-bold text-green-600"
                : "text-base font-bold text-red-500"
            }`}
          >
            {lead ? "" : "−"}
            {usd(take)}
          </span>
        </div>

        <div
          className={`overflow-hidden rounded-pill ${
            lead
              ? "h-3 bg-green-600/15"
              : "h-2.5 bg-red-500/15"
          }`}
        >
          <div
            className={`h-full rounded-pill ${
              lead
                ? "bg-green-600 shadow-sm shadow-green-600/40"
                : "bg-red-500 shadow-sm shadow-red-500/30"
            }`}
            style={{
              width: grow ? `${width}%` : "0%",
              transition: `width 800ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Bento cells ─────────────────────────────────────────────────────────────
// Each cell's visual IS the message. You see it and get it — zero reading
// required. Warm, cohesive, same border/radius language throughout.

const FACES = [
  "/images/chef.jpeg",
  "/images/yoga.jpeg",
  "/images/makeup.jpeg",
  "/images/teacher.jpeg",
];

// Section heading + kicker, shared by every cell for one consistent voice.
function CellKicker({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-semibold uppercase tracking-wide text-accent">
      {children}
    </span>
  );
}

function CommunityCell({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-nav-border bg-background p-8">
      <div>
        <CellKicker>{t("why.communityKicker")}</CellKicker>
        <h4 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("why.communityTitle")}
        </h4>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {t("why.communityBody")}
        </p>
      </div>
      {/* Bold overlapping avatar cluster, capped by an accent "+more" node —
          the faces are the message: real people, not a brand. */}
      <div className="flex -space-x-4">
        {FACES.map((src) => (
          <div
            key={src}
            className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-100 ring-4 ring-background dark:bg-zinc-800"
          >
            <Image src={src} alt="" fill sizes="64px" className="object-cover" />
          </div>
        ))}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground ring-4 ring-background">
          +9
        </div>
      </div>
    </div>
  );
}

// Ascending earnings — climbing $ values dramatize compounding referral income.
const REFERRAL_BARS = [
  { v: 4, h: 20 },
  { v: 12, h: 32 },
  { v: 24, h: 46 },
  { v: 41, h: 62 },
  { v: 66, h: 80 },
  { v: 98, h: 100 },
];

function ReferralCell({ t }: { t: (k: TranslationKey) => string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="relative flex h-full flex-col justify-between gap-7 overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.07] to-background p-8"
    >
      {/* Warm glow bleeding from the corner — gives the cell energy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative">
        <CellKicker>{t("why.referralsKicker")}</CellKicker>
        <div className="mt-3 flex items-end gap-2.5">
          <span className="text-7xl font-bold leading-[0.8] tracking-tighter text-accent sm:text-8xl">
            +4%
          </span>
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-pill bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            back
          </span>
        </div>
      </div>

      {/* Growth chart — climbing bars, each topped with its running $, plus a
          coin cresting the peak. The numbers ride up as the bars grow. */}
      <div className="relative flex h-40 items-end gap-2.5">
        {REFERRAL_BARS.map((bar, i) => (
          <div
            key={bar.v}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span
              className="text-xs font-bold tabular-nums text-accent sm:text-sm"
              style={{
                opacity: inView ? 1 : 0,
                transition: `opacity 400ms ease ${i * 90 + 300}ms`,
              }}
            >
              ${bar.v}
            </span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-accent/40 to-accent shadow-sm shadow-accent/30"
              style={{
                height: inView ? `${bar.h}%` : "0%",
                transition: `height 750ms cubic-bezier(0.22,1,0.36,1) ${i * 90}ms`,
              }}
            />
          </div>
        ))}
        <div
          className="absolute -top-3 right-1 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl shadow-accent/50 ring-4 ring-background"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "scale(1)" : "scale(0.6)",
            transition: "opacity 400ms ease 750ms, transform 400ms ease 750ms",
          }}
        >
          <CircleDollarSign className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      <div className="relative">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("why.referralsBody")}
        </p>
        <Link
          href="/refer"
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
        >
          {t("why.referralsCta")}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}

function PaymentsCell({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-nav-border bg-background p-8">
      <div>
        <CellKicker>{t("why.paymentsKicker")}</CellKicker>
        <h4 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {t("why.paymentsTitle")}
        </h4>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {t("why.paymentsBody")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* A real-looking card — far bolder than an icon-in-a-box. */}
        <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-ink to-[#3b3e6b] p-3 text-white shadow-lg">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="h-5 w-7 rounded bg-accent/80" />
              <CreditCard className="h-4 w-4 opacity-70" aria-hidden="true" />
            </div>
            <span className="font-mono text-xs tracking-[0.2em] text-white/80">
              •••• 4242
            </span>
          </div>
        </div>
        <span className="text-lg font-light text-zinc-300 dark:text-zinc-600">
          +
        </span>
        {/* Stablecoin counterpart — the USDC coin we actually pay out in. */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="relative h-16 w-16 drop-shadow-md">
            <Image
              src="/competitors_logos/USDC.png"
              alt="USDC"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <span className="text-xs font-bold tracking-wide text-foreground">USDC</span>
        </div>
      </div>
    </div>
  );
}

function ApiCell({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-nav-border bg-background p-8">
      <div>
        <CellKicker>{t("why.apiKicker")}</CellKicker>
        <h4 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {t("why.apiTitle")}
        </h4>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {t("why.apiBody")}
        </p>
      </div>
      {/* A real terminal window — reads as "developers actually build here". */}
      <div className="overflow-hidden rounded-xl bg-black font-mono text-sm shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="px-4 py-3.5">
          <p>
            <span className="font-bold text-accent">GET</span>{" "}
            <span className="text-white/90">/api/v1/offerings</span>
          </p>
          <p className="mt-1.5 text-green-400">200 OK · agent-ready</p>
        </div>
      </div>
      <Link
        href="/developer"
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
      >
        {t("why.apiCta")}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function WhyStory() {
  const { t } = useLanguage();
  const { ref, inView } = useInView<HTMLDivElement>();

  const [price, setPrice] = useState(150);

  const gathraKept = price * (1 - GATHRA_PCT / 100);
  const savedVsAvg = price * ((AVG_COMPETITOR_PCT - GATHRA_PCT) / 100);

  return (
    <section className="bg-nav-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        {/* Section header */}
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("why.title")}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {t("why.subtitle")}
          </p>
        </div>

        {/* ── Fee calculator ─────────────────────────────────────────────── */}
        <Reveal>
          <div
            ref={ref}
            className="mt-12 flex flex-col gap-8 rounded-3xl border border-nav-border bg-background p-6 sm:p-10"
          >
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                {t("why.feesEyebrow")}
              </span>
              <h3 className="max-w-2xl text-3xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {t("why.feesTitle")}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="booking-price"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {t("why.calcPriceLabel")}
                </label>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {usd(price)}
                </span>
              </div>
              <input
                id="booking-price"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={5}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                aria-label={t("why.calcPriceLabel")}
                className="w-full cursor-pointer accent-accent"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl bg-accent/10 px-5 py-4 sm:px-6">
              <p className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-accent sm:text-5xl">
                  {usd(gathraKept)}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("why.calcKept")}
                </span>
              </p>
              <span className="rounded-pill bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                +{usd(savedVsAvg)} {t("why.calcVsAvg")}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t("why.calcTakeHeading")}
              </p>

              {COMPETITORS.map((c, i) => (
                <FeeRow
                  key={c.name}
                  name={c.name}
                  pct={c.pct}
                  price={price}
                  grow={inView}
                  delay={i * 120}
                  logo={c.logo}
                />
              ))}

              <div className="my-1 border-t border-dashed border-nav-border" />

              <FeeRow
                name="Gathra"
                pct={GATHRA_PCT}
                price={price}
                grow={inView}
                delay={COMPETITORS.length * 120}
                logo={GATHRA_LOGO}
                lead
                lowestLabel={t("why.feesLowest")}
              />
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {t("why.feesFootnote")}
            </p>
          </div>
        </Reveal>

        {/* ── Bento: the added value, all visible at once ────────────────── */}
        <div className="mt-24 flex max-w-2xl flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            {t("why.moreEyebrow")}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("why.moreTitle")}
          </h3>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {t("why.moreSubtitle")}
          </p>
        </div>

        {/* Asymmetric bento — different sizes create visual interest without
            falling into the equal-card-grid template. Community is wide (the
            warmest, most human prop), referral is tall and centered (the stat
            does the work), payments + API are stacked on the right. */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <CommunityCell t={t} />
          </Reveal>
          <Reveal delay={80} className="sm:row-span-2 h-full">
            <ReferralCell t={t} />
          </Reveal>
          <Reveal delay={160}>
            <PaymentsCell t={t} />
          </Reveal>
          <Reveal delay={240}>
            <ApiCell t={t} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
