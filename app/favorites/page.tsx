import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { FavoriteButton } from "@/components/favorite-button";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { getFavoriteOfferings } from "@/lib/favorites";
import { formatDuration, formatPrice } from "@/lib/offerings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("fav.metaTitle") };
}

export default async function FavoritesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/favorites");

  const t = await getT();
  const result = await tryCatch(getFavoriteOfferings(session.user.id));
  const favorites = result.ok ? result.data : [];

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("fav.title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("fav.subtitle")}</p>
        </header>

        {favorites.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Heart}
              message={t("fav.empty")}
              action={
                <Link
                  href="/services"
                  className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
                >
                  {t("fav.browse")}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((o, i) => (
              <article
                key={o.id}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                className="flex animate-rise flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:hover:border-accent/40 dark:hover:shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent dark:bg-accent/15">
                    {o.category ??
                      o.type.charAt(0).toUpperCase() + o.type.slice(1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400">
                      {formatDuration(o.durationMinutes)}
                    </span>
                    <FavoriteButton
                      offeringId={o.id}
                      isAuthenticated
                      initialFavorited
                      plain
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="font-medium text-foreground">
                    <Link
                      href={`/services/${o.id}`}
                      className="transition-colors hover:text-accent"
                    >
                      {o.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("service.hostedBy")} {o.hostName}
                  </p>
                  {o.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {o.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-end justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/70">
                  <span className="text-lg font-semibold text-foreground">
                    {formatPrice(o.priceCents, o.currency)}
                  </span>
                  <Link
                    href={`/services/${o.id}`}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
                  >
                    {t("fav.view")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
