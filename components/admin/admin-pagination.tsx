"use client";

/** Shared Previous / Next pager for the admin list pages. */
export function AdminPagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  const btn =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900";

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className={btn}
      >
        Previous
      </button>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className={btn}
      >
        Next
      </button>
    </div>
  );
}

/** Shared input/select styling for the admin filter bars. */
export const adminFilterInput =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700";
