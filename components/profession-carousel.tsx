"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Item = { image: string; label: string; blurb: string };

const AUTOPLAY_MS = 2800;

export function ProfessionCarousel({ items }: { items: Item[] }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance on its own; pauses while hovered.
  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <div
      className="relative h-72 select-none sm:h-80"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {items.map((p, i) => {
          // Signed distance from the active card, wrapping around the ends.
          let off = i - active;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const abs = Math.abs(off);
          const hidden = abs > 2;
          const isCenter = off === 0;

          const rotateY = isCenter ? 0 : off > 0 ? -42 : 42;
          const scale = isCenter ? 1 : Math.max(0.7, 0.84 - (abs - 1) * 0.07);
          const transform = `translate(-50%, -50%) translateX(${off * 52}%) rotateY(${rotateY}deg) scale(${scale})`;

          return (
            <button
              type="button"
              key={p.label}
              onClick={() => setActive(i)}
              aria-label={p.label}
              aria-hidden={hidden}
              tabIndex={hidden ? -1 : 0}
              className="absolute left-1/2 top-1/2 h-56 w-72 overflow-hidden rounded-2xl shadow-xl transition-all duration-500 ease-out sm:h-64 sm:w-80"
              style={{
                transform,
                zIndex: 100 - abs,
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? "none" : "auto",
              }}
            >
              <Image
                src={p.image}
                alt={p.label}
                fill
                sizes="320px"
                className="object-cover"
              />
              <div
                className={`absolute inset-0 transition-colors ${
                  isCenter
                    ? "bg-linear-to-t from-black/75 via-black/15 to-transparent"
                    : "bg-black/45"
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                <h3 className="text-base font-semibold text-white">{p.label}</h3>
                {isCenter && (
                  <p className="text-xs text-white/80">{p.blurb}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Position dots */}
      <div className="absolute inset-x-0 bottom-0 z-[200] flex justify-center gap-1.5">
        {items.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${p.label}`}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-accent" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
