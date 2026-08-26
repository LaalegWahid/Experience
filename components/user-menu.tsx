"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useLanguage } from "@/components/language-provider";
import { LOCALES, type Locale } from "@/shared/i18n/config";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

const LOCALE_NATIVE: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

type Props = {
  name: string;
  role: string;
  email?: string;
  /** Average review score for this account, and how many reviews it's from. */
  rating?: number | null;
  ratingCount?: number;
  /** Styling for placement on a dark (accent) header. */
  onDark?: boolean;
  /** Trigger size; "lg" matches the taller public navbar. */
  size?: "md" | "lg";
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-4 w-4 text-zinc-500",
  "aria-hidden": true,
};

type NavItem = { href: string; labelKey: TranslationKey; icon: React.ReactNode };

const STUDIO_ICON = (
  <svg {...ICON_PROPS}>
    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
    <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
  </svg>
);

// The studio-focused menu shown to hosts (and to anyone in "host view").
const HOST_NAV_ITEMS: NavItem[] = [
  {
    href: "/host/today",
    labelKey: "menu.today",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    href: "/host/bookings",
    labelKey: "menu.bookings",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/host/calendar",
    labelKey: "menu.calendar",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/host/messages",
    labelKey: "menu.messages",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  { href: "/host", labelKey: "menu.listings", icon: STUDIO_ICON },
  {
    href: "/host/listings/new",
    labelKey: "menu.newListing",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/host/payouts",
    labelKey: "menu.payouts",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/profile",
    labelKey: "menu.profile",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/",
    labelKey: "menu.viewSite",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6M10 14 21 3" />
      </svg>
    ),
  },
];

// The personal account menu shown to guests (and to a host in "guest view").
const GUEST_NAV_ITEMS: NavItem[] = [
  {
    href: "/favorites",
    labelKey: "menu.wishlist",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
  },
  {
    href: "/appointments",
    labelKey: "menu.appointments",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/profile",
    labelKey: "menu.profile",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    labelKey: "menu.notifications",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/account/settings",
    labelKey: "menu.accountSettings",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    href: "/refer",
    labelKey: "menu.referHost",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
        <path d="M12 8H7.5a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8z" />
      </svg>
    ),
  },
];

/** The role-based navigation links shown inside the profile dropdown. */
function buildNavItems(role: string): NavItem[] {
  if (role === "host") return HOST_NAV_ITEMS;

  return [
    ...GUEST_NAV_ITEMS,
    role === "admin"
      ? { href: "/host", labelKey: "menu.hostStudio", icon: STUDIO_ICON }
      : {
          href: "/become-a-host",
          labelKey: "menu.becomeHost",
          icon: STUDIO_ICON,
        },
  ];
}

export function UserMenu({
  name,
  role,
  email,
  rating = null,
  ratingCount = 0,
  onDark = false,
  size = "md",
}: Props) {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const avatarSize =
    size === "lg" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm";
  const nameSize = size === "lg" ? "text-base" : "text-sm";
  const [open, setOpen] = useState(false);
  const [langExpanded, setLangExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  // Hosts can flip the dropdown between their studio menu and the guest menu.
  // The choice is remembered (localStorage) so it survives navigation. Safe to
  // read lazily: the dropdown only renders after the user opens it post-mount,
  // so there's no SSR/hydration mismatch.
  const [hostView, setHostView] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem("gathra:hostView") !== "false";
    } catch {
      return true;
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isHost = role === "host";

  function toggleHostView() {
    setHostView((v) => {
      const next = !v;
      try {
        localStorage.setItem("gathra:hostView", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const roleLabel =
    role === "host" || role === "guest" || role === "admin"
      ? t(`role.${role}` as TranslationKey)
      : role;
  const navItems = isHost
    ? hostView
      ? HOST_NAV_ITEMS
      : GUEST_NAV_ITEMS
    : buildNavItems(role);

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors ${
          onDark ? "hover:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <span
          className={`flex ${avatarSize} items-center justify-center rounded-full font-medium ${
            onDark ? "bg-white/15 text-white" : "bg-accent/15 text-accent"
          }`}
        >
          {initial}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span
            className={`text-left ${nameSize} font-medium ${
              onDark ? "text-white" : "text-foreground"
            }`}
          >
            {name}
          </span>
          <span
            className={`text-left text-xs capitalize ${
              onDark ? "text-white/60" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {roleLabel}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""} ${
            onDark ? "text-white/70" : "text-zinc-400"
          }`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-[80vh] w-60 origin-top-right overflow-y-auto rounded-2xl border border-zinc-200 bg-background p-1.5 shadow-xl shadow-zinc-900/10 dark:border-zinc-800"
        >
          <div className="flex flex-col px-3 py-2">
            <span className="truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {email ?? `${roleLabel} ${t("menu.account")}`}
            </span>
            <span className="mt-1 flex items-center gap-1 text-xs">
              {ratingCount > 0 && rating !== null ? (
                <>
                  <span className="text-accent">★</span>
                  <span className="font-medium text-foreground">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    · {ratingCount}{" "}
                    {ratingCount === 1 ? t("menu.review") : t("menu.reviews")}
                  </span>
                </>
              ) : (
                <span className="text-zinc-400">{t("menu.noReviews")}</span>
              )}
            </span>
          </div>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          {isHost && (
            <>
              <button
                type="button"
                onClick={toggleHostView}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                {hostView ? t("menu.switchToGuest") : t("menu.switchToHosting")}
              </button>
              <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            </>
          )}

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          ))}

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          <Link
            href="/account/invoices"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-zinc-500"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
            </svg>
            {t("menu.invoices")}
          </Link>

          <Link
            href="/account/payment-methods"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-zinc-500"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            {t("menu.paymentMethods")}
          </Link>

          <Link
            href="/developer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-zinc-500"
              aria-hidden="true"
            >
              <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            {t("menu.developer")}
          </Link>

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          <button
            type="button"
            onClick={() => setLangExpanded((v) => !v)}
            aria-expanded={langExpanded}
            className={`${itemClass} justify-between`}
          >
            <span className="flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-zinc-500"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {t("menu.language")}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 text-zinc-400 transition-transform ${
                langExpanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {langExpanded &&
            LOCALES.map((code) => {
              const isActive = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (!isActive) setLocale(code);
                    setOpen(false);
                  }}
                  aria-pressed={isActive}
                  className={`${itemClass} justify-between pl-9 ${
                    isActive ? "font-medium text-accent" : ""
                  }`}
                >
                  {LOCALE_NATIVE[code]}
                  {isActive && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={pending}
            className={`${itemClass} disabled:opacity-60`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-zinc-500"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {pending ? t("menu.signingOut") : t("menu.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
