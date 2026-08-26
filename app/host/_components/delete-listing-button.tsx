"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

/**
 * A confirmation-guarded delete control for a listing card. The icon lives on
 * the card image; clicking it opens a dialog that submits the (already bound)
 * `deleteOffering` server action, which cascades to the listing's related data.
 */
export function DeleteListingButton({
  title,
  deleteAction,
}: {
  title: string;
  deleteAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${title}`}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-zinc-600 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-background hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-zinc-300 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Delete ${title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-black/5 bg-[#fff7f1] p-6 shadow-lg dark:border-white/10 dark:bg-[#1e1a15]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">
              Delete this listing?
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              This permanently removes{" "}
              <span className="font-medium text-foreground">{title}</span> and
              all of its data — availability, bookings, and reviews. This can&apos;t
              be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-orange-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <form action={deleteAction}>
                <ConfirmButton />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete listing"}
    </button>
  );
}
