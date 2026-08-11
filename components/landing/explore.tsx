"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChefHat,
  Scissors,
  Heart,
  GraduationCap,
  Wrench,
  Car,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

const CTA_HREF = "/become-a-host";

// Each category drives the live listing preview and the earnings figure.
// `earn` is an illustrative monthly average, clearly labelled as such below.
const CATEGORIES: {
  key: string;
  Icon: LucideIcon;
  image: string;
  title: string;
  host: string;
  avatar: string;
  price: string;
  rating: string;
  blurb: string;
  earn: number;
}[] = [
  {
    key: "Cooking",
    Icon: ChefHat,
    image: "/images/chef.jpeg",
    title: "Pasta night with Lina",
    host: "Lina",
    avatar: "/images/chef.jpeg",
    price: "$45",
    rating: "5.0",
    blurb: "Dinners, tastings, and hands-on cooking classes.",
    earn: 720,
  },
  {
    key: "Wellness",
    Icon: Heart,
    image: "/images/yoga.jpeg",
    title: "Sunrise yoga in the park",
    host: "Marco",
    avatar: "/images/yoga.jpeg",
    price: "$20",
    rating: "4.9",
    blurb: "Yoga, training, and outdoor sessions guests love.",
    earn: 540,
  },
  {
    key: "Beauty",
    Icon: Scissors,
    image: "/images/makeup.jpeg",
    title: "Night-out glam session",
    host: "Sara",
    avatar: "/images/makeup.jpeg",
    price: "$60",
    rating: "5.0",
    blurb: "Makeup, hair, and beauty experiences at home.",
    earn: 900,
  },
  {
    key: "Teaching",
    Icon: GraduationCap,
    image: "/images/teacher.jpeg",
    title: "Beginner guitar lesson",
    host: "Owen",
    avatar: "/images/teacher.jpeg",
    price: "$35",
    rating: "4.8",
    blurb: "Share a skill, craft, or subject you know well.",
    earn: 560,
  },
  {
    key: "Home",
    Icon: Wrench,
    image: "/images/handyman.jpeg",
    title: "Same-day handyman",
    host: "Diego",
    avatar: "/images/handyman.jpeg",
    price: "$50",
    rating: "4.9",
    blurb: "Cleaning, repairs, and handy work done right.",
    earn: 1040,
  },
  {
    key: "Auto",
    Icon: Car,
    image: "/images/mecanique.jpeg",
    title: "Mobile car service",
    host: "Yara",
    avatar: "/images/mecanique.jpeg",
    price: "$70",
    rating: "4.8",
    blurb: "Auto, tech, and on-demand local services.",
    earn: 880,
  },
];

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function Explore() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const cat = CATEGORIES[active];
  const catLabel = (key: string) => t(`exp.cat.${key}` as TranslationKey);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Left: controls */}
      <div className="flex flex-col gap-7">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Experience categories"
        >
          {CATEGORIES.map((c, i) => {
            const selected = i === active;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(i)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-accent text-accent-foreground"
                    : "border border-nav-border bg-background text-zinc-600 hover:border-foreground/30 hover:text-foreground dark:text-zinc-300"
                }`}
              >
                <c.Icon className="h-4 w-4" aria-hidden="true" />
                {catLabel(c.key)}
              </button>
            );
          })}
        </div>

        {/* key re-mounts these on change so they pop in with animate-rise */}
        <p
          key={`blurb-${cat.key}`}
          className="animate-rise min-h-[3.5rem] max-w-md text-lg text-zinc-600 dark:text-zinc-400"
        >
          {t(`exp.blurb.${cat.key}` as TranslationKey)}
        </p>

        {/* Earnings stat — quiet label, the figure does the talking. */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("exp.earnAround").replace("{cat}", catLabel(cat.key))}
          </span>
          <span className="flex items-baseline gap-2">
            <span
              key={`earn-${cat.key}`}
              className="animate-rise text-5xl font-bold tracking-tight text-foreground tabular-nums sm:text-6xl"
            >
              {usd.format(cat.earn)}
            </span>
            <span className="text-base font-normal text-zinc-500">
              {t("exp.perMonth")}
            </span>
          </span>
        </div>

        <Link
          href={CTA_HREF}
          className="inline-flex h-11 w-fit items-center justify-center self-start rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-md shadow-black/10 transition-opacity hover:opacity-90"
        >
          {t("exp.startWith").replace("{cat}", catLabel(cat.key))}
        </Link>
        <p className="text-xs text-zinc-400">{t("exp.disclaimer")}</p>
      </div>

      {/* Right: live listing card that swaps with the category — the site's
          real card language, not a phone frame. */}
      <div className="lg:justify-self-end lg:w-[26rem]">
        <div
          key={cat.key}
          className="animate-rise overflow-hidden rounded-3xl border border-nav-border bg-background shadow-xl shadow-black/5"
        >
          <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={cat.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 26rem"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1 text-sm font-semibold text-foreground shadow-sm">
              {t("exp.perGuest").replace("{price}", cat.price)}
            </span>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {cat.title}
                </p>
                <p className="text-sm text-zinc-500">
                  {t("exp.hostedBy").replace("{name}", cat.host)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent">
                <Star className="h-3.5 w-3.5 fill-accent" aria-hidden="true" />
                {cat.rating}
              </span>
            </div>

            <div className="flex items-center gap-3 border-t border-nav-border pt-4">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={cat.avatar}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <span className="flex h-10 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {t("exp.book")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
