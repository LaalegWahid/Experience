import { readFile } from "fs/promises";
import path from "path";

// `next/og`'s ImageResponse (Satori) fetches <img src> over HTTP, which is
// unreliable for the app's own static assets during image generation (no
// guaranteed base URL, extra network round-trip). Reading straight off disk
// and inlining as a data URI sidesteps that entirely.
async function toDataUri(relativePublicPath: string, mime: string): Promise<string> {
  const filePath = path.join(process.cwd(), "public", relativePublicPath);
  const buf = await readFile(filePath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Shared assets for the OG/Twitter image generators: the logo and a warm,
 *  candid group-of-friends photo (kept separate from the /services page's
 *  own hero photo so each can be art-directed independently). */
export async function getOgAssets(): Promise<{ logo: string; photo: string }> {
  const [logo, photo] = await Promise.all([
    toDataUri("gathra_logo_4.png", "image/png"),
    toDataUri("images/og-hero.jpg", "image/jpeg"),
  ]);
  return { logo, photo };
}
