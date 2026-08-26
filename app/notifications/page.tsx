import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("notif.metaTitle") };
}

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/notifications");

  const t = await getT();

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("notif.title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("notif.subtitle")}
          </p>
        </header>

        <div className="mt-8">
          <EmptyState icon={Bell} title={t("notif.caughtUp")} message={t("notif.empty")} />
        </div>
      </main>
    </>
  );
}
