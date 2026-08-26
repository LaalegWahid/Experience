"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gathraLogo } from "@/shared/brand";

type Choice = {
  type: "service" | "experience";
  title: string;
  description: string;
  icon: React.ReactNode;
};

const CHOICES: Choice[] = [
  {
    type: "service",
    title: "Service",
    description: "A skill or service guests book you for, like coaching, beauty, or a private chef.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <path d="M3 18h18" />
        <path d="M5 18v-1a7 7 0 0 1 14 0v1" />
        <path d="M12 7V4" />
        <path d="M10 4h4" />
      </svg>
    ),
  },
  {
    type: "experience",
    title: "Experience",
    description: "An activity or outing you lead for guests, like a class, tour, or tasting.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0-6 6c0 3.5 2.6 6.2 4.5 7.5h3C15.4 15.2 18 12.5 18 9a6 6 0 0 0-6-6z" />
        <path d="M10 16.5h4l-.6 3.5h-2.8z" />
        <path d="M10.4 20h3.2" />
      </svg>
    ),
  },
];

/**
 * Airbnb-style "What would you like to host?" choice, shown when a host starts a
 * new listing. Picking a type opens the listing wizard in that mode.
 */
export function ListingTypeChoice() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Image
          src={gathraLogo}
          alt="Gathra"
          priority
          className="h-8 w-auto sm:h-10"
        />
        <Link
          href="/host"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Cancel
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What would you like to host?
        </h1>
        <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">
          You can always add more listings later.
        </p>

        <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {CHOICES.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() =>
                router.push(`/host/listings/new?type=${c.type}`)
              }
              className="flex flex-col items-start gap-4 rounded-3xl border border-zinc-200 bg-background p-6 text-left transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg hover:shadow-zinc-200/60 dark:border-zinc-800 dark:hover:border-zinc-200 dark:hover:shadow-none"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                {c.icon}
              </span>
              <span className="text-xl font-semibold text-foreground">
                {c.title}
              </span>
              <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {c.description}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
