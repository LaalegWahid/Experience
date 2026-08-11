"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { formatMoney } from "@/shared/utils/money";
import type { OfferingListItem } from "@/lib/offerings";

// Local copy of lib/offerings' formatDuration — that module pulls in the db,
// so it can't be imported into a client component.
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

// A single-line text row that softly fades out at the right edge instead of a
// hard ellipsis crop, so long titles/categories/host names trail off gently.
const FADE_ROW =
  "block overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_82%,transparent)] [-webkit-mask-image:linear-gradient(to_right,black_82%,transparent)]";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {dir === "left" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

export function ServicesCarousel({
  items,
  favoriteIds,
  isAuthenticated,
}: {
  items: OfferingListItem[];
  favoriteIds: string[];
  isAuthenticated: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const favSet = new Set(favoriteIds);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="group/carousel relative">
      <div
        ref={trackRef}
        onScroll={update}
        className="flex snap-x gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((o) => (
          <article
            key={o.id}
            className="group w-44 shrink-0 snap-start sm:w-52 lg:w-60"
          >
            <div className="relative">
              <Link
                href={`/services/${o.id}`}
                className="block aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
              >
                {o.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.coverImageUrl}
                    alt={o.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-medium text-zinc-400">
                    {o.category ??
                      o.type.charAt(0).toUpperCase() + o.type.slice(1)}
                  </span>
                )}
              </Link>
              <div className="absolute right-3 top-3 z-10">
                <FavoriteButton
                  offeringId={o.id}
                  isAuthenticated={isAuthenticated}
                  initialFavorited={favSet.has(o.id)}
                  overlay
                />
              </div>
            </div>

            <div className="mt-2.5 flex flex-col ">
              <h3 className={`${FADE_ROW} font-medium text-foreground`}>
                <Link
                  href={`/services/${o.id}`}
                  className="transition-colors hover:underline"
                >
                  {o.title}
                </Link>
              </h3>
              {o.category && (
                <p
                  className={`${FADE_ROW} text-sm text-zinc-500 dark:text-zinc-400`}
                >
                  {o.category}
                </p>
              )}
              <p
                className={`${FADE_ROW} text-sm text-zinc-500 dark:text-zinc-400`}
              >
                Hosted by {o.hostName}
              </p>
              <p className="pt-0.5 text-sm text-foreground">
                <span className="font-semibold">
                  {formatMoney(o.priceCents, o.currency)}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {" · "}
                  {formatDuration(o.durationMinutes)}
                </span>
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Scroll arrows — desktop only; touch users simply swipe the row. */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll left"
        className={`absolute left-1 top-[38%] z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-background text-foreground shadow-md transition-opacity hover:scale-105 md:flex dark:border-zinc-700 ${
          atStart
            ? "pointer-events-none opacity-0"
            : "opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
        }`}
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Scroll right"
        className={`absolute right-1 top-[38%] z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-background text-foreground shadow-md transition-opacity hover:scale-105 md:flex dark:border-zinc-700 ${
          atEnd
            ? "pointer-events-none opacity-0"
            : "opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
        }`}
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}
