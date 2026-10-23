import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const globalForDb = globalThis as unknown as { __libsql?: ReturnType<typeof createClient> };

const client = globalForDb.__libsql ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.__libsql = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export * from "./schema";
