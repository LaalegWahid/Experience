import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { auth } from "@/lib/auth";
import { getT, getLocale } from "@/lib/i18n";
import type { TranslationKey } from "@/shared/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("profile.metaTitle") };
}

function formatDate(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/profile");

  const t = await getT();
  const locale = await getLocale();

  const user = session.user as {
    name: string;
    email: string;
    role?: string;
    dateOfBirth?: string | null;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: string | Date;
  };

  const role = user.role ?? "guest";
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  const rows: { label: string; value: string }[] = [
    { label: t("profile.fullName"), value: user.name },
    { label: t("onb.email"), value: user.email },
    { label: t("profile.accountType"), value: t(`role.${role}` as TranslationKey) },
    { label: t("onb.dob"), value: formatDate(user.dateOfBirth, locale) },
    { label: t("profile.memberSince"), value: formatDate(user.createdAt, locale) },
  ];

  return (
    <>
      <Navbar />

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <BrandGraphicAccent />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("profile.title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("profile.subtitle")}
          </p>
        </header>

        <section className="mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
              {initial}
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-medium text-foreground">
                {user.name}
              </span>
              <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="capitalize">
                  {t(`role.${role}` as TranslationKey)}
                </span>
                {user.emailVerified && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {t("profile.verified")}
                  </span>
                )}
              </span>
            </div>
          </div>

          <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3"
              >
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium capitalize text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/account/settings"
            className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
          >
            {t("menu.accountSettings")}
          </Link>
          <Link
            href="/favorites"
            className="flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            {t("menu.wishlist")}
          </Link>
        </div>
      </main>
    </>
  );
}
