import type { ZodError } from "zod";

/** Standard return shape for form Server Actions used with `useActionState`. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

export const emptyFormState: FormState = {};

/**
 * Map a ZodError to a `{ field: messages[] }` object. Written against
 * `error.issues` directly so it is stable across Zod's flatten/treeify API
 * churn.
 */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Read a FormData value as a trimmed string ("" when missing/non-string). */
export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Split a textarea value into a trimmed, non-empty list (one item per line). */
export function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
