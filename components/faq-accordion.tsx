"use client";

import { useState } from "react";
import { cx } from "@/shared/utils/cx";

type FaqEntry = { q: string; a: string };

/**
 * Single-open FAQ accordion shared by the ported marketing-page CSS Modules
 * (mock1, mock3), which both define matching .accordion/.accordion-item/
 * .accordion-trigger/.accordion-panel/.plus/.active class names — so the
 * caller's own `styles` module is passed in rather than imported here.
 */
export function FaqAccordion({
  items,
  styles,
}: {
  items: FaqEntry[];
  styles: Record<string, string>;
}) {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => {
        const active = activeFaq === i;
        return (
          <div
            key={item.q}
            className={cx(styles["accordion-item"], active && styles.active)}
          >
            <button
              type="button"
              className={styles["accordion-trigger"]}
              aria-expanded={active}
              onClick={() => setActiveFaq(active ? -1 : i)}
            >
              <span>{item.q}</span>
              <span className={styles.plus}>+</span>
            </button>
            <div className={styles["accordion-panel"]}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
