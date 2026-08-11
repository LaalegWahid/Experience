"use client";

import { useState } from "react";
import Link from "next/link";
import { becomeHost } from "@/app/actions";

// Styled for placement on the accent (terracotta) hero band.
const primaryClass =
  "flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-accent transition-colors hover:bg-white/90";
const secondaryClass =
  "flex h-12 items-center justify-center rounded-full border border-white/40 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10";

type Props = {
  isAuthenticated: boolean;
  role: string | null;
};

export function HeroActions({ isAuthenticated, role }: Props) {
  const [confirming, setConfirming] = useState(false);

  const exploreHref = "/services";
  const isHost = role === "host" || role === "admin";

  return (
    <>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link href={exploreHref} className={primaryClass}>
          Explore experiences
        </Link>

        {!isAuthenticated ? (
          <Link href="/register" className={secondaryClass}>
            Become a host
          </Link>
        ) : isHost ? (
          <Link href="/host" className={secondaryClass}>
            Host dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={secondaryClass}
          >
            Become a host
          </button>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">
              Become a host?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              You&apos;ll be able to create listings, manage availability, and
              receive bookings. You keep everything you can do as a guest. You
              can still book experiences.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <form action={becomeHost}>
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  Yes, become a host
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
