"use client";

import { useState } from "react";
import type { OfferingReview } from "@/lib/reviews";

// Cycled by a hash of the guest's name, so the same reviewer always lands on
// the same color and colors stay varied across a page of reviews.
const AVATAR_COLORS = [
  "#e05d6f", // pink
  "#8b5cf6", // purple
  "#f2994a", // orange
  "#2ec4b6", // teal
  "#4f8ef0", // blue
  "#c2410c", // rust
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-foreground" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-zinc-300 dark:text-zinc-600">
        {"★".repeat(5 - rounded)}
      </span>
    </span>
  );
}

// "2 weeks ago", "3 months ago", etc. — no external dependency needed for
// this coarse a granularity.
function relativeTime(date: Date): string {
  const seconds = (Date.now() - date.getTime()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -value,
        unit,
      );
    }
  }
  return "just now";
}

// Roughly 3 lines' worth at this card's text size — past this, the comment
// gets clamped with a "Read more" toggle instead of always showing in full.
const TRUNCATE_AT = 160;

function ReviewCard({ review }: { review: OfferingReview }) {
  const [expanded, setExpanded] = useState(false);
  const comment = review.comment ?? "";
  const needsToggle = comment.length > TRUNCATE_AT;

  return (
    <div className="flex gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: avatarColor(review.guestName) }}
        aria-hidden="true"
      >
        {review.guestName.trim().charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-foreground">
          {review.guestName}
        </span>
        <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Stars rating={review.rating} /> · {relativeTime(review.createdAt)}
        </span>
        {comment && (
          <>
            <p
              className={`mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              {comment}
            </p>
            {needsToggle && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 w-fit text-sm font-medium text-foreground underline underline-offset-2"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 6;

export function ReviewList({ reviews }: { reviews: OfferingReview[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        {visible.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {!showAll && reviews.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-auto rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Show all {reviews.length} reviews
        </button>
      )}
    </div>
  );
}
