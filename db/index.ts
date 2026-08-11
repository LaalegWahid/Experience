import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/utils/env";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

const schema = { ...appSchema, ...authSchema };

// Dev-mode Fast Refresh re-evaluates this module on nearly every save, which
// would otherwise open a brand new connection pool each time (postgres.js
// defaults to 10 connections) without ever closing the old one — a handful of
// edits is enough to exhaust Supabase's pooler and make every later query
// hang waiting for a free connection. Stash the client on `globalThis` so HMR
// reuses the same pool instead of leaking a new one. Production doesn't need
// this since each server instance only evaluates the module once.
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

// `prepare: false` is required for Supabase's transaction-mode pooler (port 6543),
// which does not support prepared statements. `max`/`idle_timeout` are kept
// low in dev so a killed process's connections age out of Supabase's pooler
// quickly instead of sitting as zombies for minutes.
const client =
  globalForDb.postgresClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });
