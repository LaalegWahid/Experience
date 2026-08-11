import { randomBytes } from "node:crypto";

// Matches Unicode combining diacritical marks (U+0300–U+036F) left behind after
// NFKD normalization, e.g. the accent in "é" -> "e" + combining mark.
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Turn an arbitrary title into a URL-safe slug fragment. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "listing";
}

/**
 * A slug that is safe to use as a unique column value. Appends a short random
 * suffix so two listings with the same title don't collide.
 */
export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${randomBytes(3).toString("hex")}`;
}
