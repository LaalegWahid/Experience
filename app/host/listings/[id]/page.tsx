import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  locations,
  offeringMedia,
  serviceAreas,
} from "@/db/schema";
import { requireOwnedOffering } from "@/lib/host";
import { getMenuItems } from "@/lib/menu";
import { centsToInput } from "@/shared/utils/money";
import { type ListingDefaults } from "../_components/listing-form";
import {
  WeeklyScheduleManager,
  type RuleView,
} from "./_components/weekly-schedule";
import { MenuManager } from "./_components/menu-manager";
import { ListingEditSteps } from "./_components/listing-edit-steps";
import { DiscountsManager } from "./_components/discounts-manager";
import {
  archiveOffering,
  deleteOffering,
  publishOffering,
  unpublishOffering,
  updateOffering,
} from "../actions";

const STATUS_BADGE: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  draft: "bg-accent/10 text-accent dark:bg-accent/15",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

export default async function ManageListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { offering } = await requireOwnedOffering(id);

  const location = offering.locationId
    ? ((
        await db
          .select()
          .from(locations)
          .where(eq(locations.id, offering.locationId))
          .limit(1)
      )[0] ?? null)
    : null;

  const [serviceArea] = await db
    .select()
    .from(serviceAreas)
    .where(eq(serviceAreas.offeringId, offering.id))
    .limit(1);

  const ruleRows = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.offeringId, offering.id))
    .orderBy(asc(availabilityRules.dayOfWeek));

  const rules: RuleView[] = ruleRows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
  }));

  const menu = await getMenuItems(offering.id);

  // Photos for the gallery editor. Fall back to the single cover for listings
  // created before multi-photo support (so their image still shows + stays a cover).
  const mediaRows = await db
    .select()
    .from(offeringMedia)
    .where(eq(offeringMedia.offeringId, offering.id))
    .orderBy(asc(offeringMedia.position));
  const photos = mediaRows.length
    ? mediaRows.map((m) => m.url)
    : offering.coverImageUrl
      ? [offering.coverImageUrl]
      : [];
  const coverPhotos = mediaRows.length
    ? mediaRows.filter((m) => m.isCover).map((m) => m.url)
    : offering.coverImageUrl
      ? [offering.coverImageUrl]
      : [];

  const defaults: ListingDefaults = {
    type: offering.type,
    title: offering.title,
    coverImageUrl: offering.coverImageUrl ?? "",
    photos,
    coverPhotos,
    description: offering.description ?? "",
    category: offering.category ?? "",
    subcategory: offering.subcategory ?? "",
    format: offering.format,
    locationType: offering.locationType,
    price: centsToInput(offering.priceCents),
    currency: offering.currency,
    pricingType: offering.pricingType,
    durationMinutes: String(offering.durationMinutes),
    capacity: String(offering.capacity),
    bookingCutoffHours: String(Math.round(offering.bookingCutoffMinutes / 60)),
    qualifications: offering.qualifications ?? "",
    cancellationPolicy: offering.cancellationPolicy,
    includedItems: offering.includedItems.join("\n"),
    requirements: offering.requirements.join("\n"),
    addressLine1: location?.addressLine1 ?? "",
    addressLine2: location?.addressLine2 ?? "",
    city: location?.city ?? "",
    region: location?.region ?? "",
    postalCode: location?.postalCode ?? "",
    country: location?.country ?? "",
    serviceAreaLabel: serviceArea?.label ?? "",
    serviceAreaRadiusKm:
      serviceArea?.radiusKm != null ? String(serviceArea.radiusKm) : "",
    serviceAreaLat:
      serviceArea?.centerLat != null ? String(serviceArea.centerLat) : "",
    serviceAreaLng:
      serviceArea?.centerLng != null ? String(serviceArea.centerLng) : "",
    serviceAreaMaxTravelMinutes: String(serviceArea?.maxTravelMinutes ?? 120),
  };

  const updateAction = updateOffering.bind(null, offering.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/host"
          className="w-fit text-sm text-zinc-500 transition-colors duration-200 ease-out hover:text-accent dark:text-zinc-400"
        >
          ← Back to dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {offering.title}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              STATUS_BADGE[offering.status] ?? STATUS_BADGE.archived
            }`}
          >
            {offering.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column — one guided flow: the detail groups, the menu, and the
            weekly schedule are each a step (jump to any via the select). */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <ListingEditSteps
            action={updateAction}
            defaults={defaults}
            submitLabel="Save changes"
            menu={
              <MenuManager
                offeringId={offering.id}
                currency={offering.currency}
                items={menu.map((m) => ({
                  id: m.id,
                  name: m.name,
                  description: m.description,
                  priceCents: m.priceCents,
                  imageUrl: m.imageUrl,
                }))}
              />
            }
            availability={
              <WeeklyScheduleManager offeringId={offering.id} rules={rules} />
            }
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Activity — appointments, guest messages & reviews */}
          <Link
            href={`/host/listings/${offering.id}/activity`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 dark:border-white/10 dark:bg-[#1e1a15] dark:hover:border-accent/40"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                Activity
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Appointments, messages &amp; reviews
              </span>
            </div>
            <span className="text-sm font-medium text-accent">View →</span>
          </Link>

          {/* Status & visibility */}
          <div className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-[#fff7f1] p-5 dark:border-white/10 dark:bg-[#1e1a15]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Status &amp; visibility
            </h2>
            <div className="flex flex-col gap-2">
              {offering.status === "published" ? (
                <form action={unpublishOffering.bind(null, offering.id)}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    Unpublish
                  </button>
                </form>
              ) : offering.metadata?.moderationStatus === "pending" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  Under review. An admin will approve it before it goes live.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {offering.metadata?.moderationStatus === "rejected" && (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                      Your last submission needs changes. Update the details,
                      then request to publish again.
                    </p>
                  )}
                  <form action={publishOffering.bind(null, offering.id)}>
                    <button
                      type="submit"
                      className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90"
                    >
                      Request to publish
                    </button>
                  </form>
                </div>
              )}
              {offering.status === "published" && (
                <Link
                  href={`/services/${offering.id}`}
                  className="flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  View public page
                </Link>
              )}
              {offering.status !== "archived" && (
                <form action={archiveOffering.bind(null, offering.id)}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    Archive
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Discounts — hosts set a percentage deal, editable any time
              (including after publishing). */}
          <DiscountsManager
            offeringId={offering.id}
            initial={{
              limitedTime: offering.metadata?.discounts?.limitedTime ?? false,
              earlyBird: offering.metadata?.discounts?.earlyBird ?? false,
              limitedTimePercent: offering.metadata?.discounts?.limitedTimePercent,
              earlyBirdPercent: offering.metadata?.discounts?.earlyBirdPercent,
            }}
          />

          {/* Danger zone */}
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-[#fff7f1] p-5 dark:border-red-900/50 dark:bg-[#1e1a15]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600/80 dark:text-red-400/80">
              Danger zone
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Permanently removes the listing and its availability.
            </p>
            <form action={deleteOffering.bind(null, offering.id)}>
              <button
                type="submit"
                className="w-full rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Delete listing
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
