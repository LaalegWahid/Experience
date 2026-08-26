import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/host";
import { countFavorites } from "@/lib/favorites";
import { getGuestRating, getHostRating, type Rating } from "@/lib/reviews";
import { tryCatch } from "@/shared/utils/TryCatch";
import { getT } from "@/lib/i18n";
import { gathraLogoLight, gathraLogoDark } from "@/shared/brand";
import { cx } from "@/shared/utils/cx";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { AuthButtons } from "./auth-buttons";
import { MobileMenu } from "./mobile-menu";

const navLink =
  "whitespace-nowrap rounded-full px-4 py-2 text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800";

export async function Navbar({
  showMarketplace = false,
  narrow = false,
}: {
  // Surfaces a "Marketplace" link to /services. Off by default; the home
  // (host) landing opts in to route visitors into the marketplace.
  showMarketplace?: boolean;
  // Constrains the nav to the same 1180px container width used by pages
  // like the mock landing pages, instead of the default sitewide width.
  narrow?: boolean;
} = {}) {
  const user = await getSessionUser();
  const t = await getT();

  // Resilient to the favorites table not existing yet — defaults to 0.
  let favoriteCount = 0;
  let rating: Rating = { average: 0, count: 0 };
  if (user) {
    const result = await tryCatch(countFavorites(user.id));
    if (result.ok) favoriteCount = result.data;

    // Hosts are rated on their services; everyone else on their guest reviews.
    const ratingResult = await tryCatch(
      user.role === "host" ? getHostRating(user.id) : getGuestRating(user.id),
    );
    if (ratingResult.ok) rating = ratingResult.data;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-nav-border/70 bg-nav-surface/80 backdrop-blur-md">
      <nav
        className={cx(
          "mx-auto flex h-16 items-center justify-between sm:h-24",
          narrow
            ? "w-[min(1180px,calc(100%-40px))]"
            : "w-full max-w-[1920px] px-6 lg:px-10 xl:px-20",
        )}
      >
        <Link
          href="/"
          className="flex items-center"
          aria-label="Local Experiences"
        >
          <Image
            src={gathraLogoLight}
            alt="Local Experiences"
            priority
            className="h-8 w-auto sm:h-10 dark:hidden"
          />
          <Image
            src={gathraLogoDark}
            alt="Local Experiences"
            priority
            className="hidden h-8 w-auto sm:h-10 dark:block"
          />
        </Link>

        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle size="lg" />
            {user.role === "admin" && (
              <Link href="/admin" className={navLink}>
                {t("nav.admin")}
              </Link>
            )}
            {showMarketplace && (
              <Link href="/services" className={navLink}>
                {t("nav.marketplace")}
              </Link>
            )}

            <Link
              href="/favorites"
              aria-label={t("nav.favorites")}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              {favoriteCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                  {favoriteCount}
                </span>
              )}
            </Link>
            <UserMenu
              name={user.name}
              role={user.role}
              email={user.email}
              rating={rating.count > 0 ? rating.average : null}
              ratingCount={rating.count}
              size="lg"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle size="lg" />
            <div className="hidden items-center gap-1.5 sm:flex sm:gap-3">
              {showMarketplace && (
                <Link href="/services" className={navLink}>
                  {t("nav.marketplace")}
                </Link>
              )}
              <AuthButtons />
            </div>
            <MobileMenu />
          </div>
        )}
      </nav>
    </header>
  );
}
