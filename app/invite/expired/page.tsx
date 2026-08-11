import Link from "next/link";
import { Navbar } from "@/components/navbar";

// Shown when a referral link is invalid, already used, or past its 24h window.
export default function InviteExpiredPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          This invite link is no longer valid
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Referral links can only be used once and expire 24 hours after they
          are created. Ask the host who invited you to send a fresh link.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
        >
          Go to homepage
        </Link>
      </main>
    </>
  );
}
