import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { getT } from "@/lib/i18n";

// Experimental hero concept for the "human-as-a-service community" positioning.
// Not indexed — a side-by-side prototype to compare against the live home hero.
export const metadata: Metadata = {
  title: "Hero preview",
  robots: { index: false, follow: false },
};

// Real neighbours offering real things — illustrative sample data (English,
// like the other landing previews) until/if this hero is adopted.
const PEOPLE = [
  { name: "Lina", service: "Pasta nights", image: "/images/chef.jpeg", rating: "5.0" },
  { name: "Marco", service: "Sunrise yoga", image: "/images/yoga.jpeg", rating: "4.9" },
  { name: "Sara", service: "Night-out glam", image: "/images/makeup.jpeg", rating: "5.0" },
  { name: "Owen", service: "Guitar lessons", image: "/images/teacher.jpeg", rating: "4.8" },
];

const PERKS = ["6–10% fees", "Cash or crypto", "Earn by referring"];

// A gentle horizontal stagger so the cards read as a casual cluster, not a list.
const OFFSET = ["lg:ml-0", "lg:ml-12", "lg:ml-4", "lg:ml-16"];

export default async function HeroPreviewPage() {
  const t = await getT();

  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-24">
          {/* Left — message + two-sided CTAs + perks. */}
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              {t("hae.heroTitle")}
            </h1>
            <p className="max-w-md text-xl text-zinc-600 dark:text-zinc-400">
              {t("hae.heroSubtitle")}
            </p>

            {/* Two sides of the community: become one, or book one. */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/become-a-host"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-base font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Start offering
              </Link>
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-full border border-nav-border px-7 text-base font-medium text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Find help
              </Link>
            </div>

            {/* Differentiators, surfaced up front. */}
            <ul className="flex flex-wrap gap-2 pt-2">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="flex items-center gap-2 rounded-full border border-nav-border px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — a cluster of real people offering services. */}
          <div className="relative">
            {/* Soft warmth behind the cluster. */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
            />
            <ul className="flex flex-col gap-4">
              {PEOPLE.map((p, i) => (
                <li
                  key={p.name}
                  className={`flex items-center gap-4 rounded-2xl border border-nav-border bg-background p-3 shadow-sm shadow-zinc-900/5 sm:p-4 ${OFFSET[i]}`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-sm text-zinc-500">{p.service}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    ★ {p.rating}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
