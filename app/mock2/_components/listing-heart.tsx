"use client";

import { useState } from "react";
import styles from "../mock2.module.css";

export function ListingHeart({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      className={styles["listing-heart"]}
      aria-label={label}
      aria-pressed={saved}
      onClick={() => setSaved((s) => !s)}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
