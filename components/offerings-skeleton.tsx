// Loading placeholder for the marketplace grid. Mirrors the grouped-carousel
// layout (section heading + a row of square cards) so the page doesn't jump
// when the real data arrives.

function CardSkeleton() {
  return (
    <div className="w-44 shrink-0 sm:w-52 lg:w-60">
      <div className="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="mt-2.5 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-2/5 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

export function OfferingsSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div
      className="mt-4 flex animate-pulse flex-col gap-12"
      aria-hidden="true"
    >
      {Array.from({ length: sections }).map((_, s) => (
        <section key={s} className="flex flex-col gap-4">
          <div className="h-6 w-40 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="flex gap-5 overflow-hidden pb-2">
            {Array.from({ length: 6 }).map((_, c) => (
              <CardSkeleton key={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
