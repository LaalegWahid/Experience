/** A single pulsing placeholder block. Compose these to mock any layout. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-zinc-100 dark:bg-zinc-900 ${className}`}
    />
  );
}

/**
 * Static stand-in for the real `<Navbar>`. The real navbar is an async server
 * component (it queries session/favorites/ratings), so it can't be used inside
 * a `loading.tsx` Suspense fallback without making the fallback itself block.
 * This mirrors its chrome (height, border, max width) so there's no layout jump.
 */
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-nav-border/70 bg-nav-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-24 w-full max-w-[1920px] items-center justify-between px-6 lg:px-10 xl:px-20">
        <Skeleton className="h-10 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </nav>
    </header>
  );
}

export type SkeletonVariant = "cards" | "list" | "form";

function Body({ variant, rows }: { variant: SkeletonVariant; rows: number }) {
  if (variant === "cards") {
    return (
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-4/3 w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // list
  return (
    <div className="mt-8 flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Header (title + subtitle) shared by every page skeleton. */
function Header() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/**
 * Full-page loading skeleton for top-level routes that render their own
 * `<Navbar />` + `<main>` (e.g. favorites, appointments, account).
 */
export function PageSkeleton({
  width = "max-w-3xl",
  variant = "list",
  rows = 4,
}: {
  width?: string;
  variant?: SkeletonVariant;
  rows?: number;
}) {
  return (
    <>
      <NavbarSkeleton />
      <main className={`mx-auto w-full ${width} flex-1 px-6 py-10 sm:py-14`}>
        <Header />
        <Body variant={variant} rows={rows} />
      </main>
    </>
  );
}

/**
 * Content-only loading skeleton for routes nested inside a shared layout that
 * already renders the chrome and `<main>` (e.g. /host/*, /admin/*).
 */
export function ContentSkeleton({
  variant = "list",
  rows = 4,
}: {
  variant?: SkeletonVariant;
  rows?: number;
}) {
  return (
    <>
      <Header />
      <Body variant={variant} rows={rows} />
    </>
  );
}
