type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

// Satori (which `next/og` is built on) needs TTF/OTF, not WOFF2. Google's
// CSS2 endpoint only serves those legacy formats to old user agents — this
// spoofed UA is the standard workaround.
const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";

async function fetchFont(family: string, weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      { headers: { "User-Agent": LEGACY_UA } },
    ).then((r) => r.text());
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** League Spartan (headings) + Montserrat (body), for the OG image
 *  generators. Best-effort — network hiccups just fall back to the
 *  system font rather than failing the whole image. */
export async function loadBrandFonts(): Promise<OgFont[]> {
  const [heading, body] = await Promise.all([
    fetchFont("League Spartan", 700),
    fetchFont("Montserrat", 400),
  ]);
  const fonts: OgFont[] = [];
  if (heading) fonts.push({ name: "League Spartan", data: heading, weight: 700, style: "normal" });
  if (body) fonts.push({ name: "Montserrat", data: body, weight: 400, style: "normal" });
  return fonts;
}
