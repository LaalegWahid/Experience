import { getT } from "@/lib/i18n";

type LocationData = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
} | null;

/**
 * "Where you'll be" — a keyless Google Maps embed (no API key required). Centers
 * on coordinates when available, otherwise geocodes the address string. Shown
 * only for at-host offerings that have a location; at-guest/online get a note.
 */
export async function LocationSection({
  locationType,
  location,
}: {
  locationType: string;
  location: LocationData;
}) {
  const t = await getT();

  if (locationType === "online") {
    return (
      <Wrapper title={t("locationMap.title")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("locationMap.online")}
        </p>
      </Wrapper>
    );
  }

  if (locationType === "at_guest") {
    return (
      <Wrapper title={t("locationMap.title")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("locationMap.atGuest")}
        </p>
      </Wrapper>
    );
  }

  // at_host
  const hasCoords = location?.lat != null && location?.lng != null;
  const addressParts = location
    ? [
        location.addressLine1,
        location.city,
        location.region,
        location.postalCode,
        location.country,
      ].filter(Boolean)
    : [];

  if (!hasCoords && addressParts.length === 0) return null;

  const query = hasCoords
    ? `${location!.lat},${location!.lng}`
    : addressParts.join(", ");
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    query,
  )}&z=14&hl=en&output=embed`;

  const areaLine = location
    ? [location.city, location.region, location.country]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ")
    : "";

  return (
    <Wrapper title={t("locationMap.title")}>
      {areaLine && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{areaLine}</p>
      )}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <iframe
          title={t("locationMap.mapTitle")}
          src={src}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="text-xs text-zinc-400">{t("locationMap.approx")}</p>
    </Wrapper>
  );
}

function Wrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {children}
    </div>
  );
}
