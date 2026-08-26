import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, authenticated or non-indexable areas. Keeps crawl budget on
      // the public marketplace and detail pages.
      disallow: [
        "/admin",
        "/account",
        "/host",
        "/api",
        "/appointments",
        "/favorites",
        "/notifications",
        "/profile",
        "/refer",
        "/invite",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
