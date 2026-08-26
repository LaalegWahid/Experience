import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, type MenuItem } from "@/db/schema";

/** A service's menu items, ordered. */
export async function getMenuItems(offeringId: string): Promise<MenuItem[]> {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.offeringId, offeringId))
    .orderBy(asc(menuItems.position), asc(menuItems.createdAt));
}

/** A single menu item, scoped to its offering (or null). */
export async function getMenuItem(
  offeringId: string,
  menuItemId: string,
): Promise<MenuItem | null> {
  const [item] = await db
    .select()
    .from(menuItems)
    .where(
      and(eq(menuItems.id, menuItemId), eq(menuItems.offeringId, offeringId)),
    )
    .limit(1);
  return item ?? null;
}
