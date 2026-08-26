"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  /** Match only the exact path (used for the dashboard root). */
  exact?: boolean;
  /** Extra path prefixes that should also light up this item. */
  match?: string[];
  icon: React.ReactNode;
};

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-[18px] w-[18px] shrink-0",
  "aria-hidden": true,
};

const NAV: NavItem[] = [
  {
    href: "/host",
    label: "Dashboard",
    exact: true,
    match: ["/host/listings"],
    icon: (
      <svg {...ICON}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/host/today",
    label: "Today",
    icon: (
      <svg {...ICON}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01" />
      </svg>
    ),
  },
  {
    href: "/host/calendar",
    label: "Calendar",
    icon: (
      <svg {...ICON}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/host/bookings",
    label: "Bookings",
    icon: (
      <svg {...ICON}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/host/messages",
    label: "Messages",
    icon: (
      <svg {...ICON}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/host/reviews",
    label: "Reviews",
    icon: (
      <svg {...ICON}>
        <path d="M12 17.3 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5z" />
      </svg>
    ),
  },
  {
    href: "/host/payouts",
    label: "Payouts",
    icon: (
      <svg {...ICON}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </svg>
    ),
  },
];

/**
 * Left navigation rail for the host studio. Sticks below the header while the
 * content scrolls, and highlights the active section. Hidden on small screens,
 * where the header's account menu still covers navigation.
 */
export function HostSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-52 shrink-0 py-8 sm:py-10 lg:block">
      <nav className="sticky top-24 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (!item.exact && pathname.startsWith(`${item.href}/`)) ||
            (item.match?.some((m) => pathname.startsWith(m)) ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-600 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
