// Client-side photo quality check for the listing wizards. We gate on actual
// pixel dimensions (naturalWidth/naturalHeight) rather than file size, so a
// genuinely low-res photo is caught even if it's a heavy file.

/** Minimum width AND height (px) for a listing photo to be publishable. */
export const MIN_PHOTO_PX = 800;

/**
 * Read an image file's natural pixel dimensions. Browser-only (uses `Image` +
 * object URLs); only call this from client components.
 */
export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

/** Whether the given dimensions fall below the quality floor. */
export function isLowResolution(width: number, height: number): boolean {
  return width < MIN_PHOTO_PX || height < MIN_PHOTO_PX;
}

/** An uploaded photo plus the natural dimensions used for the quality gate. */
export type StagedPhoto = { url: string; width: number; height: number };

/**
 * Read dimensions, but never block on a read failure: if the browser can't
 * decode the file, assume it passes rather than trapping the host.
 */
export async function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  try {
    return await getImageDimensions(file);
  } catch {
    return { width: MIN_PHOTO_PX, height: MIN_PHOTO_PX };
  }
}
