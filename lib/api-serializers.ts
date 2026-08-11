import type { Booking } from "@/db/schema";
import type {
  AvailabilityWindow,
  OfferingDetail,
  OfferingListItem,
} from "@/lib/offerings";
import type { BookingView } from "@/lib/bookings";

// Map internal DB rows to stable, public-facing API objects. Internal columns
// (e.g. provider.userId, raw provider ids) are intentionally not exposed.

export function serializeOfferingListItem(o: OfferingListItem) {
  return {
    id: o.id,
    type: o.type,
    title: o.title,
    description: o.description,
    category: o.category,
    priceCents: o.priceCents,
    currency: o.currency,
    durationMinutes: o.durationMinutes,
    host: { name: o.hostName },
  };
}

export function serializeOfferingDetail(o: OfferingDetail) {
  return {
    id: o.id,
    type: o.type,
    status: o.status,
    title: o.title,
    slug: o.slug,
    description: o.description,
    category: o.category,
    subcategory: o.subcategory,
    format: o.format,
    locationType: o.locationType,
    priceCents: o.priceCents,
    currency: o.currency,
    pricingType: o.pricingType,
    durationMinutes: o.durationMinutes,
    capacity: o.capacity,
    bookingCutoffMinutes: o.bookingCutoffMinutes,
    includedItems: o.includedItems,
    requirements: o.requirements,
    qualifications: o.qualifications,
    cancellationPolicy: o.cancellationPolicy,
    provider: {
      name: o.provider.displayName,
      isVerified: o.provider.isVerified,
    },
    createdAt: o.createdAt,
    publishedAt: o.publishedAt,
  };
}

export function serializeAvailability(rules: AvailabilityWindow[]) {
  return rules.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
  }));
}

export function serializeBookingView(b: BookingView) {
  return {
    id: b.id,
    offeringId: b.offeringId,
    title: b.title,
    hostName: b.hostName,
    appointmentAt: b.appointmentAt,
    status: b.status,
    priceCents: b.priceCents,
    currency: b.currency,
  };
}

export function serializeBookingRow(b: Booking) {
  return {
    id: b.id,
    offeringId: b.offeringId,
    appointmentAt: b.appointmentAt,
    status: b.status,
    priceCents: b.priceCents,
    currency: b.currency,
    createdAt: b.createdAt,
  };
}
