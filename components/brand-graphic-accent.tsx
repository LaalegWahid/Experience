type Corner = "top-right" | "top-left";

/**
 * A subtle brand texture — a soft accent glow plus a faint dot grid fading
 * out toward the bottom (per the brand deck's Graphic Elements page: soft
 * gradients + dot patterns as quiet background texture, never competing with
 * content). Purely decorative: non-interactive, sits behind everything.
 * Render inside a `relative` ancestor.
 */
export function BrandGraphicAccent({
  corner = "top-right",
  className = "",
}: {
  corner?: Corner;
  className?: string;
}) {
  const cornerClass = corner === "top-right" ? "-top-16 right-0" : "-top-16 left-0";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div className={`absolute h-72 w-72 rounded-full bg-accent/10 blur-3xl ${cornerClass}`} />
      <div
        className="absolute inset-x-0 top-0 h-96 opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />
    </div>
  );
}
