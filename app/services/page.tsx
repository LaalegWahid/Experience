import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { MarketplaceSearchMorph } from "@/components/marketplace-search-morph";
import { MarketplaceBrowse } from "@/components/marketplace-browse";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { auth } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { getT } from "@/lib/i18n";
import { tryCatch } from "@/shared/utils/TryCatch";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

const TITLE = `${SITE_NAME} · Book local services & experiences near you`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { title: TITLE, description: SITE_DESCRIPTION },
};

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function ServicesPage(props: PageProps<"/services">) {
  const sp = await props.searchParams;
  const where = str(sp.where).trim();
  const when = str(sp.when).trim();
  const category = str(sp.category).trim();

  // Auth + favorites are session-bound (not filter-bound), so they stay
  // server-rendered and pass down as props. The offerings grid itself is loaded
  // client-side via TanStack Query (see OfferingsResults) for caching + skeletons.
  const t = await getT();
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = Boolean(session?.user);
  let favoriteIds = new Set<string>();
  if (session?.user) {
    const favResult = await tryCatch(getFavoriteIds(session.user.id));
    if (favResult.ok) favoriteIds = favResult.data;
  }

  const hasFilters = Boolean(where || when || category);

  return (
    <>
      <Navbar />

      {/* Hero: full-bleed photo backdrop, flush against the navbar, with the
          headline on the left (a light scrim keeps it readable) and the
          search bar embedded at the bottom. Content inside stays aligned to
          the same width/padding as the rest of the page. The photo (and its
          scrim) is desktop-only — on phones there's no room for it to breathe,
          so the hero is just the text on the plain page background. */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#fff7f1] via-[#fff9f4] to-[#fff2e9] dark:from-[#14120f] dark:via-[#1a1511] dark:to-[#201509]">
        <Image
          src="/images/community.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover sm:block"
        />
        {/* Fades from a warm cream (matching the homepage's palette, where the
            headline sits) to transparent, so the photo stays visible on the
            right. */}
        <div className="absolute inset-0 hidden bg-linear-to-r from-[#fff7f1] via-[#fff7f1]/85 to-transparent sm:block dark:from-[#14120f] dark:via-[#14120f]/85" />

        <div className="relative z-10 mx-auto flex max-w-[1920px] flex-col justify-between gap-8 px-6 py-10 sm:min-h-125 sm:px-10 sm:py-12 lg:px-10 xl:px-20">
          <div className="flex max-w-xl flex-col gap-4">
            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("home.heroTitle")}{" "}
              <span className="text-accent">{t("home.heroTitleAccent")}</span>
            </h1>
            <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
              {t("home.heroSubtitle")}
            </p>
          </div>

          <div className="mx-auto w-full max-w-4xl">
            <MarketplaceSearchMorph defaults={{ where, when, category }} />
            {hasFilters && (
              <Link
                href="/services"
                className="mt-3 inline-block text-sm font-medium text-zinc-500 transition-colors hover:text-foreground"
              >
                {t("home.clearFilters")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Toggle + results load client-side via TanStack Query (cached +
          skeletons). */}
      <main className="relative mx-auto w-full max-w-[1920px] flex-1 px-6 py-8 sm:py-10 lg:px-10 xl:px-20">
        <BrandGraphicAccent />

        <MarketplaceBrowse
          filters={{ where, when, category }}
          favoriteIds={[...favoriteIds]}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </>
  );
}
