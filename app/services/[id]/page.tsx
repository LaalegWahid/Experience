import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronLeft,
  Star,
  Clock,
  Users,
  Layers,
  Home,
  MapPin,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ReserveButton } from "@/components/reserve-button";
import { ServiceChatDrawer } from "@/components/service-chat-drawer";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { BrandGraphicAccent } from "@/components/brand-graphic-accent";
import { EmptyState } from "@/components/empty-state";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { LocationSection } from "@/components/location-map";
import { BookingProvider } from "@/components/booking-provider";
import { MenuCarousel } from "@/components/menu-carousel";
import { CoverCarousel } from "@/components/cover-carousel";
import { DetailCardList } from "@/components/detail-card-list";
import { ListingGallery } from "@/components/listing-gallery";
import { ReferThisService } from "@/components/referrals/refer-this-service";
import { auth } from "@/lib/auth";
import { hasReferrerPayoutMethod } from "@/lib/referrals";
import { getFavoriteIds } from "@/lib/favorites";
import { getMenuItems } from "@/lib/menu";
import { getOfferingReviews } from "@/lib/reviews";
import { tryCatch } from "@/shared/utils/TryCatch";
import {
  applyDiscount,
  effectiveDiscountPercent,
} from "@/shared/utils/discount";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { getT } from "@/lib/i18n";
import type { TranslationKey } from "@/shared/i18n/dictionaries";
import {
  formatDuration,
  formatPrice,
  getAvailabilityRules,
  getOfferingById,
} from "@/lib/offerings";

const FORMAT_KEYS: Record<string, TranslationKey> = {
  public_group: "service.format.publicGroup",
  private_group: "service.format.privateGroup",
  one_on_one: "service.format.oneOnOne",
  class_workshop: "service.format.classWorkshop",
};

const LOCATION_KEYS: Record<string, TranslationKey> = {
  at_host: "service.locationType.atHost",
  at_guest: "service.locationType.atGuest",
  online: "service.locationType.online",
};

const PRICING_KEYS: Record<string, TranslationKey> = {
  per_person: "service.pricing.perPerson",
  per_booking: "service.pricing.perBooking",
};

// Icon per location type, for the mobile info-chip row.
const LOCATION_ICONS: Record<string, LucideIcon> = {
  at_host: Home,
  at_guest: MapPin,
  online: Globe,
};

/** A small square info card (icon + label) — the mobile detail page's
 *  duration/format/capacity/location row. */
function InfoChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-background shadow-sm dark:border-zinc-800">
        <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      </span>
      <span className="text-[11px] font-medium leading-tight text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export async function generateMetadata(
  props: PageProps<"/services/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const offering = await getOfferingById(id);
  // Only published offerings are indexable; everything else gets noindex.
  if (!offering || offering.status !== "published") {
    return { title: "Service not found", robots: { index: false, follow: false } };
  }

  const url = `/services/${offering.id}`;
  const description =
    offering.description ??
    `Book ${offering.title} with ${
      offering.provider?.displayName ?? "a local host"
    } on ${SITE_NAME}.`;
  const images = offering.coverImageUrl
    ? [{ url: offering.coverImageUrl, alt: offering.title }]
    : undefined;

  return {
    title: offering.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: offering.title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: offering.title,
      description,
      ...(offering.coverImageUrl ? { images: [offering.coverImageUrl] } : {}),
    },
  };
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-accent" aria-label={`${rating} out of 5`}>
      {"★".repeat(rounded)}
      <span className="text-zinc-300 dark:text-zinc-600">
        {"★".repeat(5 - rounded)}
      </span>
    </span>
  );
}

export default async function ServiceDetailPage(
  props: PageProps<"/services/[id]">,
) {
  const { id } = await props.params;

  // These don't depend on each other, so fire them concurrently instead of
  // waterfalling six sequential round-trips to the DB. The id is the route
  // param, so availability/menu/reviews don't need to wait for the offering.
  const [offering, session, availability, menu, reviewsResult] =
    await Promise.all([
      getOfferingById(id),
      auth.api.getSession({ headers: await headers() }),
      getAvailabilityRules(id),
      getMenuItems(id),
      tryCatch(getOfferingReviews(id)),
    ]);

  const isAdmin = session?.user?.role === "admin";

  // Only published offerings are publicly viewable. Admins (to moderate) and the
  // owning host (to preview) can also open one that isn't live yet.
  if (
    !offering ||
    (offering.status !== "published" &&
      !isAdmin &&
      offering.provider?.userId !== session?.user?.id)
  ) {
    notFound();
  }

  const isAuthenticated = Boolean(session?.user);
  const isHost = offering.provider?.userId === session?.user?.id;
  const t = await getT();

  let isFavorited = false;
  let hasPayout = false;
  if (session?.user) {
    const [favResult, payoutResult] = await Promise.all([
      tryCatch(getFavoriteIds(session.user.id)),
      tryCatch(hasReferrerPayoutMethod(session.user.id)),
    ]);
    if (favResult.ok) isFavorited = favResult.data.has(offering.id);
    if (payoutResult.ok) hasPayout = payoutResult.data;
  }

  const reviews = reviewsResult.ok ? reviewsResult.data : [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  // A host-set discount reduces the price guests see (the larger of any active
  // deals). The full price is kept for the strikethrough.
  const discountPercent = effectiveDiscountPercent(offering.metadata?.discounts);
  const discountedCents = applyDiscount(offering.priceCents, discountPercent);
  const priceLabel = formatPrice(discountedCents, offering.currency);
  const originalPriceLabel =
    discountPercent > 0
      ? formatPrice(offering.priceCents, offering.currency)
      : null;
  const pricingKey = PRICING_KEYS[offering.pricingType];
  const pricingSuffix = pricingKey ? t(pricingKey) : "";
  const categoryLabel =
    offering.category ??
    offering.type.charAt(0).toUpperCase() + offering.type.slice(1);
  const host = offering.provider;
  const hostInitial = host?.displayName?.trim().charAt(0).toUpperCase() ?? "?";

  // "City, Region, Country" for at-host listings with a fixed location —
  // shown under the title on the mobile layout (mirrors LocationSection's
  // own area line further down the page).
  const areaLine =
    offering.locationType === "at_host" && offering.location
      ? [offering.location.city, offering.location.region, offering.location.country]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ")
      : "";

  // Experiences show their itinerary (stored in metadata) in place of the menu.
  const itinerary =
    offering.type === "experience" ? (offering.metadata?.itinerary ?? []) : [];

  // Cover photos: the marked covers (ordered), falling back to any photo, then
  // the legacy single cover. Shown as a sideways-scrolling carousel.
  const coverImages = (() => {
    const media = offering.media ?? [];
    const covers = media.filter((m) => m.isCover).map((m) => m.url);
    if (covers.length > 0) return covers;
    if (media.length > 0) return media.map((m) => m.url);
    return offering.coverImageUrl ? [offering.coverImageUrl] : [];
  })();

  // Every photo on the listing, ordered, for the full gallery grid. Falls back
  // to the covers (which themselves fall back to the legacy single cover).
  const galleryImages =
    offering.media && offering.media.length > 0
      ? offering.media.map((m) => m.url)
      : coverImages;

  const coverImage =
    coverImages.length > 0 ? (
      <CoverCarousel images={coverImages} alt={offering.title} />
    ) : (
      <div className="flex h-40 w-full items-center justify-center bg-accent/10 text-sm font-medium text-accent sm:h-56">
        {categoryLabel}
      </div>
    );

  // Cover with the host's avatar overlapping its bottom edge (centred).
  const coverWithHost = (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl">{coverImage}</div>
      {host && (
        <span className="absolute -bottom-7 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-accent text-lg font-semibold text-accent-foreground shadow-md">
          {host.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={host.avatarUrl}
              alt={host.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            hostInitial
          )}
        </span>
      )}
    </div>
  );

  // The menu (services only). Rendered beside the cover on desktop and in the
  // normal content flow on mobile, so it's the same section in both places.
  const menuSection =
    offering.type === "service" && menu.length > 0 ? (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("service.menu")}
        </h2>
        <MenuCarousel
          currency={offering.currency}
          items={menu.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            priceCents: m.priceCents,
            imageUrl: m.imageUrl,
          }))}
        />
      </div>
    ) : null;

  // Structured data so the listing is eligible for rich results (price,
  // rating, breadcrumb). Only fields we actually have are included.
  const serviceUrl = absoluteUrl(`/services/${offering.id}`);
  const serviceJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: offering.title,
    description: offering.description ?? undefined,
    url: serviceUrl,
    serviceType: offering.category ?? offering.type,
    ...(offering.coverImageUrl ? { image: offering.coverImageUrl } : {}),
    ...(host ? { provider: { "@type": "Organization", name: host.displayName } } : {}),
    ...(offering.location?.city ? { areaServed: offering.location.city } : {}),
    offers: {
      "@type": "Offer",
      price: (offering.priceCents / 100).toFixed(2),
      priceCurrency: offering.currency,
      availability: "https://schema.org/InStock",
      url: serviceUrl,
    },
    ...(avgRating !== null && reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.guestName },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            ...(r.comment ? { reviewBody: r.comment } : {}),
            datePublished: new Date(r.createdAt).toISOString(),
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Services", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: offering.title, item: serviceUrl },
    ],
  };

  return (
    <>
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Navbar />

      {offering.status !== "published" && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Preview. This listing is not live yet and is not visible to guests.
        </div>
      )}

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-6 pb-24 pt-8 sm:py-10">
        <BrandGraphicAccent corner="top-right" className="hidden sm:block" />
        {/* Mobile hero — full-bleed photo with an overlaid back button,
            favorite/share, and a numeric page counter, then a rounded sheet
            (title, rating, location, description, quick facts) overlapping
            its bottom edge. Desktop keeps its own cover + header below. */}
        <div className="-mx-6 -mt-8 sm:hidden">
          <CoverCarousel
            images={coverImages}
            alt={offering.title}
            className="h-105"
            mobileCounter
            topLeft={
              <Link
                href="/services"
                aria-label={t("service.allServices")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            }
            topRight={
              <>
                <FavoriteButton
                  offeringId={offering.id}
                  isAuthenticated={isAuthenticated}
                  initialFavorited={isFavorited}
                  size="md"
                  overlay
                />
                <ShareButton url={serviceUrl} title={offering.title} />
              </>
            }
          />

          <div className="relative -mt-6 rounded-t-3xl bg-background px-6 pb-6 pt-6">
            <span className="w-fit rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent dark:bg-accent/15">
              {categoryLabel}
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {offering.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {avgRating !== null && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                  {avgRating.toFixed(1)}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    (
                    {reviews.length}{" "}
                    {reviews.length === 1
                      ? t("service.review")
                      : t("service.reviewsCount")}
                    )
                  </span>
                </span>
              )}
            </div>
            {areaLine && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {areaLine}
              </div>
            )}
            {offering.description && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {offering.description}
              </p>
            )}

            <div className="mt-5 grid grid-cols-4 gap-2">
              <InfoChip
                icon={Clock}
                label={formatDuration(offering.durationMinutes)}
              />
              <InfoChip
                icon={Layers}
                label={
                  FORMAT_KEYS[offering.format]
                    ? t(FORMAT_KEYS[offering.format])
                    : offering.format
                }
              />
              <InfoChip
                icon={Users}
                label={`${offering.capacity} ${
                  offering.capacity > 1 ? t("service.people") : t("service.person")
                }`}
              />
              <InfoChip
                icon={LOCATION_ICONS[offering.locationType] ?? MapPin}
                label={
                  LOCATION_KEYS[offering.locationType]
                    ? t(LOCATION_KEYS[offering.locationType])
                    : offering.locationType
                }
              />
            </div>
          </div>
        </div>

        <Link
          href="/services"
          className="hidden items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-foreground sm:inline-flex dark:text-zinc-400"
        >
          ← {t("service.allServices")}
        </Link>

        {/* Cover — for a service with a menu, the menu sits in the same row on
            desktop; otherwise the cover spans the full width. Desktop only —
            phones get the hero above instead. */}
        {menuSection ? (
          <div className="mt-5 hidden items-start gap-6 sm:grid lg:grid-cols-2">
            {coverWithHost}
            <div className="hidden lg:block">{menuSection}</div>
          </div>
        ) : (
          <div className="mt-5 hidden sm:block">{coverWithHost}</div>
        )}

        {/* Title + host (avatar lives on the cover above). The title/rating
            block is desktop-only — phones show it in the hero sheet above. */}
        <header className="mt-6 flex flex-col gap-4 sm:mt-12">
          <div className="hidden items-start justify-between gap-4 sm:flex">
            <div className="flex flex-col gap-2">
              <span className="w-fit rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent dark:bg-accent/15">
                {categoryLabel}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {offering.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {avgRating !== null && (
                  <span className="flex items-center gap-1 text-foreground">
                    <span className="text-accent">★</span>
                    {avgRating.toFixed(1)}
                    <span className="font-normal text-zinc-500 dark:text-zinc-400">
                      ({reviews.length})
                    </span>
                  </span>
                )}
                <span>{formatDuration(offering.durationMinutes)}</span>
                {host && (
                  <span className="flex items-center gap-1.5 text-foreground">
                    · {t("service.hostedBy")} {host.displayName}
                    {host.isVerified && (
                      <span className="text-accent" title={t("service.verifiedHost")}>
                        ✓
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <FavoriteButton
              offeringId={offering.id}
              isAuthenticated={isAuthenticated}
              initialFavorited={isFavorited}
              size="md"
            />
          </div>

          {host && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              {host.bio ? (
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {host.bio}
                </p>
              ) : (
                <span className="flex-1" />
              )}
              <div className="flex shrink-0 items-center gap-3">
                <ReferThisService
                  offeringId={offering.id}
                  isAuthenticated={isAuthenticated}
                  hasPayout={hasPayout}
                />
                <ServiceChatDrawer
                  offeringId={offering.id}
                  isAuthenticated={isAuthenticated}
                  isHost={isHost}
                  hostName={host.displayName}
                />
              </div>
            </div>
          )}
        </header>

        <BookingProvider
          serviceId={offering.id}
          isAuthenticated={isAuthenticated}
          bookable={offering.status === "published"}
          availability={availability}
          durationMinutes={offering.durationMinutes}
          currency={offering.currency}
          locationType={offering.locationType}
          menu={menu.map((m) => ({
            id: m.id,
            name: m.name,
            priceCents: m.priceCents,
            imageUrl: m.imageUrl,
          }))}
        >
          {/* Mobile sticky price + book bar — sits just above the site's
              global bottom nav (which reserves 64px via body padding). */}
          <div className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between border-t border-zinc-200 bg-background/95 px-6 py-3 backdrop-blur-md sm:hidden dark:border-zinc-800">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-foreground">
                {priceLabel}
              </span>
              {pricingSuffix && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pricingSuffix}
                </span>
              )}
            </div>
            <ReserveButton />
          </div>

          {/* Same 2-col template + gap as the cover row above, so About/Details
              line up exactly under the cover (and the booking under the menu). */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-8">
              {offering.description && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-medium text-foreground">
                    {t("service.about")}
                  </h2>
                  <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {offering.description}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-medium text-foreground">
                  {t("service.details")}
                </h2>
                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
                  <Detail label={t("service.duration")}>
                    {formatDuration(offering.durationMinutes)}
                  </Detail>
                  <Detail label={t("service.capacity")}>
                    {offering.capacity}{" "}
                    {offering.capacity > 1
                      ? t("service.people")
                      : t("service.person")}
                  </Detail>
                  <Detail label={t("service.format")}>
                    {FORMAT_KEYS[offering.format]
                      ? t(FORMAT_KEYS[offering.format])
                      : offering.format}
                  </Detail>
                  <Detail label={t("service.location")}>
                    {LOCATION_KEYS[offering.locationType]
                      ? t(LOCATION_KEYS[offering.locationType])
                      : offering.locationType}
                  </Detail>
                </dl>
              </div>

              {/* Experiences: the itinerary sits directly beneath the details. */}
              {offering.type === "experience" && itinerary.length > 0 && (
                <DetailCardList
                  heading={t("service.itinerary")}
                  items={itinerary.map((step) => ({
                    title: step.title,
                    description: step.description,
                    meta: formatDuration(step.durationMinutes),
                    imageUrl: step.imageUrl,
                  }))}
                />
              )}

              {/* Photo gallery — shares the column with the itinerary so the
                  cards line up. */}
              {galleryImages.length > 0 && (
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-5 sm:p-6 dark:border-zinc-800">
                  <h2 className="text-lg font-medium text-foreground">
                    {t("service.gallery")}
                  </h2>
                  <ListingGallery images={galleryImages} alt={offering.title} />
                </div>
              )}
            </section>

            {/* Booking sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight text-foreground">
                      {priceLabel}
                    </span>
                    {originalPriceLabel && (
                      <span className="text-base text-zinc-400 line-through dark:text-zinc-500">
                        {originalPriceLabel}
                      </span>
                    )}
                    {pricingSuffix && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {pricingSuffix}
                      </span>
                    )}
                  </div>
                  {discountPercent > 0 && (
                    <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {discountPercent}% off
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {t("service.duration")}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatDuration(offering.durationMinutes)}
                  </span>
                </div>

                <div className="flex flex-col gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800/70">
                  <span className="text-sm font-medium text-foreground">
                    {t("service.availability")}
                  </span>
                  <AvailabilityCalendar availability={availability} embedded />
                </div>

                <ReserveButton />

                <p className="text-center text-xs text-zinc-400">
                  {t("service.noChargeUntilConfirm")}
                </p>
              </div>
            </aside>
          </div>

          {/* Full-width below the two-column split: offerings, what's included,
              good to know, location, and reviews. */}
          <div className="mt-10 flex flex-col gap-8">
            {/* A service's menu shows beside the cover on desktop, and here on
                mobile. (Experiences show the itinerary under the details above.) */}
            {menuSection && <div className="lg:hidden">{menuSection}</div>}

            {offering.includedItems.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-foreground">
                  {t("service.included")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {offering.includedItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="mt-0.5 text-accent">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {offering.requirements.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-foreground">
                  {t("service.goodToKnow")}
                </h2>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-zinc-600 dark:text-zinc-400">
                  {offering.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location map */}
            <LocationSection
              locationType={offering.locationType}
              location={offering.location}
            />

            {/* Reviews (comments) */}
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
                {t("service.reviews")}
                {avgRating !== null && (
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    <span className="text-accent">★</span>{" "}
                    {avgRating.toFixed(1)} · {reviews.length}
                  </span>
                )}
              </h2>
              {reviews.length === 0 ? (
                <EmptyState icon={Star} message={t("service.noReviews")} />
              ) : (
                <ul className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="flex gap-3 rounded-2xl border border-zinc-200 bg-background p-4 dark:border-zinc-800"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent">
                        {r.guestName.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {r.guestName}
                          </span>
                          <Stars rating={r.rating} />
                        </div>
                        {r.comment && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {r.comment}
                          </p>
                        )}
                        <span className="text-xs text-zinc-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </BookingProvider>
      </main>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 bg-background p-5">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="capitalize text-foreground">{children}</dd>
    </div>
  );
}
