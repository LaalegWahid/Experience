import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, type ApiKey } from "@/db/schema";

export async function getApiKeysForUser(userId: string): Promise<ApiKey[]> {
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}
