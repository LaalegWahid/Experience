"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useLanguage } from "@/components/language-provider";

// Routes that have their own chrome (host studio, admin, the listing wizard,
// auth pages) — the guest bottom bar shouldn't appear there.
const HIDDEN_PREFIXES = [
  "/host",
  "/admin",
  "/become-a-host",
  "/developer",
  "/login",
  "/register",
];

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
  "aria-hidden": true,
};

/**
 * Airbnb-style bottom navigation for phones: Explore / Wishlists / Profile.
 * Fixed to the bottom, hidden on `sm+` and on routes with their own navigation.
 */
export function MobileBottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();

  if (
    HIDDEN_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return null;
  }

  const item =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors";
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const tone = (active: boolean) =>
    active ? "text-accent" : "text-zinc-500 dark:text-zinc-400";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden dark:border-zinc-800"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <Link href="/services" className={`${item} ${tone(isActive("/services"))}`}>
          <svg {...iconProps}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {t("nav.explore")}
        </Link>

        <Link href="/favorites" className={`${item} ${tone(isActive("/favorites"))}`}>
          <svg {...iconProps}>
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {t("menu.wishlist")}
        </Link>

        {isAuthenticated ? (
          <Link href="/profile" className={`${item} ${tone(isActive("/profile"))}`}>
            <svg {...iconProps}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            {t("menu.profile")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuth()}
            className={`${item} ${tone(false)}`}
          >
            <svg {...iconProps}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            {t("nav.signIn")}
          </button>
        )}
      </div>
    </nav>
  );
}
