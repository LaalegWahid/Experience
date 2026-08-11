import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ApiKeysSection } from "@/components/api-keys/api-keys-section";
import {
  ApiPlayground,
  type PlaygroundSamples,
} from "@/components/api-keys/api-playground";
import { X402BookingDemo } from "@/components/api-keys/x402-booking-demo";
import { DeveloperTabs } from "@/components/api-keys/developer-tabs";
import { auth } from "@/lib/auth";
import {
  getAvailabilityRules,
  getOfferingById,
  getPublishedOfferings,
  type AvailabilityWindow,
} from "@/lib/offerings";
import { env } from "@/shared/utils/env";

export const metadata: Metadata = {
  title: "Developer API · Local Experiences",
  description: "Generate API keys and call the marketplace from your own apps.",
};

/** ISO weekday (1=Mon … 7=Sun) of a date. */
function isoWeekday(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * A bookable date/time to prefill the examples: the next date matching the
 * offering's earliest weekly window (or a week out at 14:00 if it has none).
 */
function nextAvailableSlot(rules: AvailabilityWindow[]): {
  date: string;
  time: string;
} {
  if (rules.length === 0) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return { date: ymd(d), time: "14:00" };
  }
  const rule = [...rules].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (isoWeekday(d) === rule.dayOfWeek) return { date: ymd(d), time: rule.startTime };
  }
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return { date: ymd(d), time: rule.startTime };
}

/** Pull one real published offering + provider + a valid slot for the examples. */
async function loadSamples(): Promise<PlaygroundSamples> {
  const [offering] = await getPublishedOfferings(1);
  if (!offering) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return { offeringId: "", providerId: "", date: ymd(d), time: "14:00" };
  }
  const [full, rules] = await Promise.all([
    getOfferingById(offering.id),
    getAvailabilityRules(offering.id),
  ]);
  const slot = nextAvailableSlot(rules);
  return {
    offeringId: offering.id,
    providerId: full?.provider?.id ?? "",
    date: slot.date,
    time: slot.time,
  };
}

export default async function DeveloperPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/developer");

  const samples = await loadSamples();

  return (
    <>
      <Navbar />

      <main className="flex-1">
        <DeveloperTabs
          keysPanel={
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start xl:gap-8">
              <ApiKeysSection />
              <X402BookingDemo
                offeringId={samples.offeringId}
                date={samples.date}
                time={samples.time}
                x402Enabled={Boolean(env.X402_PAY_TO)}
              />
            </div>
          }
          referencePanel={
            <ApiPlayground baseUrl={env.BETTER_AUTH_URL} samples={samples} />
          }
        />
      </main>
    </>
  );
}
