"use client";

import { useEffect, useState } from "react";

export type DetailCardItem = {
  title: string;
  description?: string;
  /** Small label shown top-right on the card (e.g. a duration or a price). */
  meta?: string;
  imageUrl?: string;
};

/**
 * A list of clickable cards (image left, title + description right) that open a
 * detail popup with a thumbnail strip and an image carousel. Shared by the
 * experience itinerary and the service menu.
 */
export function DetailCardList({
  heading,
  items,
}: {
  heading?: string;
  items: DetailCardItem[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {heading && (
        <h2 className="text-lg font-medium text-foreground">{heading}</h2>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              className="flex w-full items-stretch overflow-hidden rounded-2xl border border-zinc-200 bg-background text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-24 shrink-0 self-stretch object-cover"
                />
              )}
              <span className="flex flex-1 flex-col gap-1 p-4">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.meta && (
                    <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                      {item.meta}
                    </span>
                  )}
                </span>
                {item.description && (
                  <span className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {activeIndex !== null && (
        <DetailCardModal
          items={items}
          index={activeIndex}
          onSelect={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  );
}

function DetailCardModal({
  items,
  index,
  onSelect,
  onClose,
}: {
  items: DetailCardItem[];
  index: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const hasAnyImage = items.some((s) => s.imageUrl);

  // Close on Escape; step through items with arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        onSelect((index + 1) % items.length);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        onSelect((index - 1 + items.length) % items.length);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onSelect, index, items.length]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="flex items-center gap-3 sm:gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail strip — one per item; click to switch the card. */}
        {items.length > 1 && (
          <div className="hidden max-h-[80vh] flex-col gap-4 overflow-y-auto sm:flex">
            {items.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`View ${s.title}`}
                aria-current={i === index}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl transition ${
                  i === index
                    ? "ring-2 ring-white"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-zinc-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Detail card */}
        <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-background p-3 shadow-2xl sm:flex-row dark:border dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Carousel: a vertical track of every image, translated to the active
              one. Moving down the list slides up, and back up slides down. */}
          {hasAnyImage && (
            <div className="aspect-square w-full shrink-0 self-center overflow-hidden rounded-2xl sm:w-2/5">
              <div
                className="flex h-full flex-col transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `translateY(-${index * 100}%)` }}
              >
                {items.map((s, i) => (
                  <div key={i} className="h-full w-full shrink-0">
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            key={index}
            className="flex flex-1 animate-itin-fade flex-col items-center justify-center gap-3 p-6 text-center sm:p-8"
          >
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {item.title}
            </h3>
            {item.meta && (
              <span className="text-sm font-semibold text-accent">
                {item.meta}
              </span>
            )}
            {item.description && (
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
