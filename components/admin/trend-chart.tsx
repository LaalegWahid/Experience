"use client";

import { useRef, useState } from "react";
import type { TrendPoint } from "@/lib/trends";

// The plot's viewBox is 0–100 wide (so an x value doubles as a left% for the
// HTML-overlaid dots/tooltip) and a fixed-height in px (so a y value doubles
// as a top-px offset). Keeping both in sync with the rendered box is what
// lets the overlay track the SVG without measuring it.
const PLOT_WIDTH = 100;
const PLOT_HEIGHT = 120;

/** Round a value up to a "clean" axis max: 1/2/5/10 × a power of ten. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNorm =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNorm * magnitude;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * A single-series daily trend chart: line + soft area fill, a crosshair
 * tooltip on hover, three gridlines, and an accessible table-view fallback.
 * Dots are plain HTML overlays (not SVG circles) because the chart stretches
 * non-uniformly to fill its card — an SVG circle would render as an ellipse.
 */
export function TrendChart({
  title,
  hint,
  points,
  formatValue,
}: {
  title: string;
  hint?: string;
  points: TrendPoint[];
  formatValue: (value: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const max = niceCeil(Math.max(...points.map((p) => p.value), 0));
  const mid = max / 2;
  const last = points[points.length - 1] as TrendPoint | undefined;

  // x is already a 0–100 percentage; y is already a 0–PLOT_HEIGHT px offset.
  const xAt = (i: number) =>
    points.length > 1 ? (i / (points.length - 1)) * PLOT_WIDTH : PLOT_WIDTH / 2;
  const yAt = (value: number) => PLOT_HEIGHT - (value / max) * PLOT_HEIGHT;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.value)}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${xAt(points.length - 1)} ${PLOT_HEIGHT} L ${xAt(0)} ${PLOT_HEIGHT} Z`
    : "";

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;
  const labelIndices =
    points.length > 1
      ? [0, Math.floor((points.length - 1) / 2), points.length - 1]
      : [0];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {hint && <p className="text-xs text-zinc-400">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="shrink-0 text-xs font-medium text-accent transition-opacity hover:opacity-80"
        >
          {showTable ? "View chart" : "View data"}
        </button>
      </div>

      <div className="text-2xl font-semibold tracking-tight text-foreground">
        {formatValue(total)}
      </div>

      {showTable ? (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800/70">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-left uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {points.map((p) => (
                <tr key={p.date}>
                  <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">
                    {formatDate(p.date)}
                  </td>
                  <td className="px-3 py-1.5 font-medium tabular-nums text-foreground">
                    {formatValue(p.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div
              className="flex w-10 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-zinc-400"
              style={{ height: PLOT_HEIGHT }}
            >
              <span>{formatValue(max)}</span>
              <span>{formatValue(mid)}</span>
              <span>{formatValue(0)}</span>
            </div>

            <div className="relative min-w-0 flex-1">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
                preserveAspectRatio="none"
                width="100%"
                height={PLOT_HEIGHT}
                className="block touch-none"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverIndex(null)}
                role="img"
                aria-label={`${title} over the last ${points.length} days, ending at ${formatValue(last?.value ?? 0)}`}
              >
                {[0, PLOT_HEIGHT / 2, PLOT_HEIGHT].map((y) => (
                  <line
                    key={y}
                    x1={0}
                    x2={PLOT_WIDTH}
                    y1={y}
                    y2={y}
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {areaPath && (
                  <path d={areaPath} fill="var(--accent)" fillOpacity={0.1} />
                )}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {hoverIndex !== null && (
                  <line
                    x1={xAt(hoverIndex)}
                    x2={xAt(hoverIndex)}
                    y1={0}
                    y2={PLOT_HEIGHT}
                    className="stroke-zinc-300 dark:stroke-zinc-700"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              {/* End marker */}
              {last && (
                <div
                  className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{
                    left: `${xAt(points.length - 1)}%`,
                    top: yAt(last.value),
                    backgroundColor: "var(--accent)",
                    borderColor: "var(--background)",
                  }}
                />
              )}

              {/* Hover marker + tooltip */}
              {hovered && hoverIndex !== null && (
                <>
                  <div
                    className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{
                      left: `${xAt(hoverIndex)}%`,
                      top: yAt(hovered.value),
                      backgroundColor: "var(--accent)",
                      borderColor: "var(--background)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute top-0 z-10 -translate-y-full rounded-lg border border-zinc-200 bg-background px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm dark:border-zinc-700"
                    style={{
                      left: `${xAt(hoverIndex)}%`,
                      transform: `translate(${
                        hoverIndex === 0
                          ? "0%"
                          : hoverIndex === points.length - 1
                            ? "-100%"
                            : "-50%"
                      }, -8px)`,
                    }}
                  >
                    <div className="font-semibold tabular-nums text-foreground">
                      {formatValue(hovered.value)}
                    </div>
                    <div className="text-zinc-400">
                      {formatDate(hovered.date)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="w-10 shrink-0" aria-hidden="true" />
            <div className="relative h-3 flex-1 text-[10px] text-zinc-400">
              {labelIndices.map((i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${xAt(i)}%`,
                    transform:
                      i === 0
                        ? "translateX(0%)"
                        : i === points.length - 1
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                  }}
                >
                  {formatDate(points[i].date)}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
