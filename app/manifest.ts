import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/seo";
import { gathraLogo } from "@/shared/brand";

// Web app manifest — enables installability and richer mobile/search results.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff4a00",
    icons: [
      {
        src: gathraLogo.src,
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
