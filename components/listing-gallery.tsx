"use client";

import { useEffect, useState } from "react";
import { useLockBodyScroll } from "./use-lock-body-scroll";

/**
 * A responsive grid of a listing's photos. Tapping one opens a minimal lightbox
 * with keyboard + arrow navigation. Photos are passed in already ordered.
 */
export function ListingGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (images.length === 0) return null;

  // Featured layout: one large photo left, two stacked right. Only the first
  // three render as tiles; a "+N" overlay on the last tile opens the rest.
  const tiles = images.slice(0, 3);
  const remaining = images.length - tiles.length;

  const tile = (src: string, i: number, className: string) => (
    <button
      key={`${src}-${i}`}
      type="button"
      onClick={() => setActive(i)}
      aria-label={`${alt} — photo ${i + 1} of ${images.length}`}
      className={`group relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
      />
      {/* The last tile advertises the photos that didn't fit. */}
      {remaining > 0 && i === tiles.length - 1 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg font-semibold text-white">
          +{remaining}
        </span>
      )}
    </button>
  );

  return (
    <>
      {tiles.length === 1 ? (
        tile(tiles[0], 0, "block aspect-[3/2] w-full")
      ) : tiles.length === 2 ? (
        <div className="grid aspect-[3/2] grid-cols-2 gap-3">
          {tiles.map((src, i) => tile(src, i, ""))}
        </div>
      ) : (
        <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-3">
          {tile(tiles[0], 0, "col-span-2 row-span-2")}
          {tile(tiles[1], 1, "")}
          {tile(tiles[2], 2, "")}
        </div>
      )}

      {active !== null && (
        <Lightbox
          images={images}
          index={active}
          alt={alt}
          onSelect={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  index,
  alt,
  onSelect,
  onClose,
}: {
  images: string[];
  index: number;
  alt: string;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const prev = () => onSelect((index - 1 + images.length) % images.length);
  const next = () => onSelect((index + 1) % images.length);

  // The lightbox only mounts while open, so this always locks on mount.
  useLockBodyScroll(true);

  // Close on Escape; step through photos with the arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onSelect((index + 1) % images.length);
      else if (e.key === "ArrowLeft")
        onSelect((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, images.length, onSelect, onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`${alt} — photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain"
      />

      {images.length > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  );
}
