"use client";

import { useState } from "react";

/**
 * The detail-page cover: one or more cover photos shown as a horizontal
 * carousel. With a single image it's just the photo; with several, arrows step
 * sideways and dots show position. Heights match the previous static cover.
 *
 * `topLeft`/`topRight` are optional overlay slots (e.g. a back button, or
 * favorite/share buttons) shown only on phones — the desktop layout has its
 * own back link and favorite button outside the cover, further down.
 * `mobileCounter` swaps the dots for a numeric "1/12" badge on phones, where
 * there's no host avatar overlapping the cover to make room for.
 */
export function CoverCarousel({
  images,
  alt,
  topLeft,
  topRight,
  mobileCounter = false,
  className = "h-56 sm:h-80",
}: {
  images: string[];
  alt: string;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  mobileCounter?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="h-full w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="h-full w-full object-contain" />
          </div>
        ))}
      </div>

      {topLeft && (
        <div className="absolute left-4 top-4 z-20 sm:hidden">{topLeft}</div>
      )}
      {topRight && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 sm:hidden">
          {topRight}
        </div>
      )}

      {count > 1 && (
        <>
          <CarouselArrow side="left" onClick={() => go(-1)} />
          <CarouselArrow side="right" onClick={() => go(1)} />

          {mobileCounter && (
            <span className="absolute bottom-8 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white sm:hidden">
              {index + 1}/{count}
            </span>
          )}

          {/* Bottom-left so the dots clear the host avatar centred below.
              Desktop only when a numeric counter takes over on phones. */}
          <div
            className={`absolute bottom-3 left-4 items-center gap-1.5 ${
              mobileCounter ? "hidden sm:flex" : "flex"
            }`}
          >
            {images.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 rounded-full shadow transition-all duration-200 ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CarouselArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-background ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
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
        {side === "left" ? (
          <path d="m15 18-6-6 6-6" />
        ) : (
          <path d="m9 18 6-6-6-6" />
        )}
      </svg>
    </button>
  );
}
