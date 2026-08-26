"use client";

import { useRef, useState } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";

type Props = {
  /** Name of the hidden input that carries the uploaded URL into the form. */
  name: string;
  defaultValue?: string;
  /** Aspect ratio of the preview box. */
  shape?: "square" | "wide";
};

export function ImageUpload({ name, defaultValue = "", shape = "wide" }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    const res = await tryCatch(
      fetch("/api/host/upload", { method: "POST", body: form }),
    );
    setUploading(false);
    if (!res.ok) {
      setError("Network error. Please try again.");
      return;
    }
    const parsed = await tryCatch(
      res.data.json() as Promise<{ url?: string; error?: string }>,
    );
    const data = parsed.ok ? parsed.data : {};
    if (!res.data.ok || !data.url) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    setUrl(data.url);
  }

  const box =
    shape === "square" ? "h-20 w-20" : "h-28 w-44 sm:h-32 sm:w-52";

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={url} />
      <div
        className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-zinc-400">No image</span>
        )}
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {uploading ? "Uploading…" : url ? "Change" : "Upload image"}
          </button>
          {url && !uploading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-xs text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-zinc-400">JPG or PNG, up to 5 MB.</p>
        )}
      </div>
    </div>
  );
}
