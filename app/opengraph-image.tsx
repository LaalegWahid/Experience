import { ImageResponse } from "next/og";
import { getOgAssets } from "@/lib/og-assets";
import { loadBrandFonts } from "@/lib/og-fonts";

// Flagship social share image for the home (host) landing page. 1200×630.
// Also the platform-wide default wherever a route doesn't define its own.
export const alt = "Host an experience on Gathra. Get paid for what you love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [{ logo, photo }, fonts] = await Promise.all([
    getOgAssets(),
    loadBrandFonts(),
  ]);
  const heading = fonts.some((f) => f.name === "League Spartan")
    ? "League Spartan"
    : "sans-serif";
  const body = fonts.some((f) => f.name === "Montserrat") ? "Montserrat" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: body,
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Scrim overlay. Satori/Yoga doesn't support the `inset` shorthand —
            an absolutely-positioned element sized only with `inset: 0`
            silently collapses to 0×0, so explicit top/left/width/height are
            required here. Heavy darkening also keeps the output PNG small:
            ImageResponse can't emit JPEG, so a busy photo rendered
            losslessly balloons past what link-preview crawlers (e.g.
            Telegram) will fetch, and they silently drop the whole card. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.9) 45%, rgba(0,0,0,0.86) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: 80,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={48} height={48} style={{ objectFit: "contain" }} />
            <span
              style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", fontFamily: heading }}
            >
              Gathra
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 840 }}>
            <span
              style={{
                fontSize: 74,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.05,
                letterSpacing: -1.5,
                fontFamily: heading,
              }}
            >
              Offer what you do, book what you need!
            </span>
            <span style={{ fontSize: 32, color: "rgba(255,255,255,0.85)", fontFamily: body }}>
              Create a one-of-a-kind experience for guests across your city.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              height: 64,
              padding: "0 32px",
              borderRadius: 999,
              background: "#ff4a00",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 600,
              fontFamily: heading,
            }}
          >
            Get started
          </div>
        </div>
      </div>
    ),
    // Only pass `fonts` when the Google Fonts fetch actually succeeded —
    // ImageResponse requires at least one entry once the option is set at
    // all, and won't fall back to its built-in default on an empty array.
    fonts.length > 0 ? { ...size, fonts } : size,
  );
}
