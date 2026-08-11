"use client";

import { useActionState } from "react";
import { addMenuItem, removeMenuItem } from "../../actions";
import { emptyFormState } from "@/shared/utils/form";
import { ImageUpload } from "@/components/image-upload";
import { formatMoney } from "@/shared/utils/money";

export type MenuItemView = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700";

export function MenuManager({
  offeringId,
  items,
  currency,
}: {
  offeringId: string;
  items: MenuItemView[];
  currency: string;
}) {
  const save = addMenuItem.bind(null, offeringId);
  const [state, action, pending] = useActionState(save, emptyFormState);
  const removeAction = removeMenuItem.bind(null, offeringId);
  const errs = state.fieldErrors;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Offer specific choices guests can pick from, each with its own price and
        photo (e.g. different haircuts).
      </p>

      {/* Existing items */}
      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>
                {item.description && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatMoney(item.priceCents, currency)}
              </span>
              <form action={removeAction}>
                <input type="hidden" name="menuItemId" value={item.id} />
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Add item — remounts (clears) after each successful add. */}
      <form
        key={items.length}
        action={action}
        className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800/70"
      >
        <ImageUpload name="imageUrl" shape="square" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Choice name
            <input
              name="name"
              required
              maxLength={120}
              placeholder="e.g. Skin fade"
              className={inputClass}
            />
            {errs?.name && (
              <span className="text-red-600 dark:text-red-400">
                {errs.name[0]}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Price
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue="0"
              className={inputClass}
            />
            {errs?.price && (
              <span className="text-red-600 dark:text-red-400">
                {errs.price[0]}
              </span>
            )}
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Description
          <input
            name="description"
            maxLength={500}
            placeholder="A short note about this choice"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add menu item"}
        </button>
      </form>
    </div>
  );
}
