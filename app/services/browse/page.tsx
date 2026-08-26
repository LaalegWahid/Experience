import { headers } from "next/headers";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { BrowseSplitView } from "@/components/browse-split-view";
import { auth } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SITE_NAME } from "@/lib/seo";

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export const metadata: Metadata = {
  title: `Browse listings · ${SITE_NAME}`,
  robots: { index: false, follow: true }, // a filtered/derived view, not a canonical page
};

/**
 * "See all" destination for a category row on /services — a two-pane view
 * (list + map) instead of the homepage's grouped carousels. Shares the same
 * where/when/category filters and the same /api/offerings data.
 */
export default async function BrowseServicesPage(
  props: PageProps<"/services/browse">,
) {
  const sp = await props.searchParams;
  const where = str(sp.where).trim();
  const when = str(sp.when).trim();
  const category = str(sp.category).trim();

  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = Boolean(session?.user);
  let favoriteIds: string[] = [];
  if (session?.user) {
    const result = await tryCatch(getFavoriteIds(session.user.id));
    if (result.ok) favoriteIds = [...result.data];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <BrowseSplitView
        filters={{ where, when, category }}
        favoriteIds={favoriteIds}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
