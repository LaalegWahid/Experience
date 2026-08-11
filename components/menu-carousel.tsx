"use client";

import { formatMoney } from "@/shared/utils/money";
import { DetailCardList } from "./detail-card-list";

type Item = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
};

/**
 * The service menu, rendered with the same clickable card + detail popup as the
 * experience itinerary. The price is shown as the card's meta label.
 */
export function MenuCarousel({
  items,
  currency,
}: {
  items: Item[];
  currency: string;
}) {
  return (
    <DetailCardList
      items={items.map((item) => ({
        title: item.name,
        description: item.description ?? undefined,
        meta: formatMoney(item.priceCents, currency),
        imageUrl: item.imageUrl ?? undefined,
      }))}
    />
  );
}
