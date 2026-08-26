import { NavbarSkeleton } from "@/components/skeleton";

// Shown instantly while the server renders the service detail page, so clicking
// a card navigates immediately instead of appearing to hang on the old page.
// Uses a static navbar placeholder (not the async <Navbar>) so this Suspense
// fallback never blocks on data fetching.
export default function Loading() {
  return (
    <>
      <NavbarSkeleton />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:py-10">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />

        <div className="mt-5 animate-pulse">
          {/* Cover */}
          <div className="h-56 w-full rounded-3xl bg-zinc-100 sm:h-80 dark:bg-zinc-900" />

          {/* Title block */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="h-6 w-28 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-9 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-4 w-40 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>

          {/* Host card */}
          <div className="mt-4 flex items-start gap-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="h-14 w-14 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-1/3 rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>
          </div>

          {/* Body + sidebar */}
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              <div className="h-5 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-3 w-4/6 rounded bg-zinc-100 dark:bg-zinc-900" />
              <div className="mt-4 h-40 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
            </div>
            <div className="h-72 rounded-2xl border border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
        </div>
      </main>
    </>
  );
}
