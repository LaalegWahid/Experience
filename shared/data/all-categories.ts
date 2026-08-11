import { SERVICE_CATEGORIES } from "./service-categories";
import { EXPERIENCE_CATEGORIES } from "./experience-categories";

// Every category across both services and experiences, for the marketplace
// search's "What are you looking for?" filter. De-duplicated so the shared
// "Other" catch-all only appears once.
export const ALL_CATEGORIES: string[] = [
  ...new Set([
    ...SERVICE_CATEGORIES.map((c) => c.value),
    ...EXPERIENCE_CATEGORIES.map((c) => c.value),
  ]),
];
