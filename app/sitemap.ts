import type { MetadataRoute } from "next";
import { getOfferingsForSitemap } from "@/lib/offerings";
import { absoluteUrl } from "@/lib/seo";
import { tryCatch } from "@/shared/utils/TryCatch";

// Re-generate at most hourly; the offering list changes slowly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/become-a-host"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/developer"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Public service detail pages. Stay resilient if the DB is unreachable —
  // a sitemap that 500s is worse than one with only the static routes.
  const result = await tryCatch(getOfferingsForSitemap());
  const offeringRoutes: MetadataRoute.Sitemap = result.ok
    ? result.data.map((o) => ({
        url: absoluteUrl(`/services/${o.id}`),
        lastModified: o.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
    : [];

  return [...staticRoutes, ...offeringRoutes];
}
