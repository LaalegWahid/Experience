"use client";

import { useRef, useState } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";

/** Most photos a host can mark as cover images. */
const MAX_COVERS = 5;

/**
 * Multi-photo manager for the listing editor: add images, delete any, and mark
 * up to {@link MAX_COVERS} as covers. Serialises to hidden inputs the offering
 * action reads — `photos` (all, ordered) and `coverPhotos` (the marked subset),
 * plus `coverImageUrl` (the primary cover) for backward compatibility.
 */
export function PhotoGallery({
  defaultPhotos = [],
  defaultCovers = [],
}: {
  defaultPhotos?: string[];
  defaultCovers?: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(defaultPhotos);
  const [covers, setCovers] = useState<string[]>(defaultCovers);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Covers, pruned to existing photos and defaulted to the first photo so a
  // listing with photos always has at least one cover.
  const effectiveCovers = (() => {
    const valid = covers.filter((u) => photos.includes(u));
    if (valid.length === 0 && photos.length > 0) return [photos[0]];
    return valid;
  })();
  const atMax = effectiveCovers.length >= MAX_COVERS;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same file
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const uploaded: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await tryCatch(
        fetch("/api/host/upload", { method: "POST", body: form }),
      );
      if (!res.ok) {
        setError("Network error. Please try again.");
        continue;
      }
      const parsed = await tryCatch(
        res.data.json() as Promise<{ url?: string; error?: string }>,
      );
      const data = parsed.ok ? parsed.data : {};
      if (!res.data.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        continue;
      }
      uploaded.push(data.url);
    }

    setUploading(false);
    if (uploaded.length > 0) setPhotos((prev) => [...prev, ...uploaded]);
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url));
    setCovers((prev) => prev.filter((u) => u !== url));
  }

  function toggleCover(url: string) {
    setCovers((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (effectiveCovers.length >= MAX_COVERS) return prev;
      return [...prev, url];
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden inputs the offering action reads. */}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <input
        type="hidden"
        name="coverPhotos"
        value={JSON.stringify(effectiveCovers)}
      />
      <input type="hidden" name="coverImageUrl" value={effectiveCovers[0] ?? ""} />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url) => {
            const isCover = effectiveCovers.includes(url);
            return (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => toggleCover(url)}
                  disabled={!isCover && atMax}
                  aria-pressed={isCover}
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium shadow transition-colors ${
                    isCover
                      ? "bg-foreground text-background"
                      : "bg-white/90 text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  }`}
                >
                  {isCover ? "Cover" : "+ Cover"}
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {uploading ? "Uploading…" : photos.length ? "Add photos" : "Upload photos"}
        </button>
        <p className="text-xs text-zinc-400">
          JPG or PNG, up to 5 MB. Tap up to {MAX_COVERS} to feature as covers.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
