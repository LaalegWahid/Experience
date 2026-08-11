import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account settings · Local Experiences",
};

type Setting = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5 text-accent",
  "aria-hidden": true,
};

const settings: Setting[] = [
  {
    href: "/profile",
    title: "Profile",
    description: "View your name, email, and account details.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/account/payment-methods",
    title: "Payment methods",
    description: "Manage the cards saved for faster checkout.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/account/invoices",
    title: "Invoices",
    description: "Review and download receipts for your bookings.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Catch up on booking updates and messages.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/account/settings");

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Account settings
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your profile, payments, and preferences.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {settings.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:hover:border-accent/40 dark:hover:shadow-none"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 dark:bg-accent/15">
                {s.icon}
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{s.title}</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {s.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
