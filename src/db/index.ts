import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "mysql://root@localhost:3306/travelair";
// Aiven (et la plupart des MySQL gérés) exigent TLS ; mysql2 ne lit pas le paramètre `ssl-mode`,
// on active donc explicitement SSL. rejectUnauthorized peut être forcé via DATABASE_SSL_REJECT_UNAUTHORIZED.
const needsSsl = /\bssl-mode=required\b/i.test(url) || /aivencloud\.com/i.test(url);
const u = new URL(url);

const globalForDb = globalThis as unknown as { __mysqlPool?: mysql.Pool };
const pool =
  globalForDb.__mysqlPool ??
  mysql.createPool({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    ssl: needsSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" } : undefined,
    connectionLimit: 5,
  });
if (process.env.NODE_ENV !== "production") globalForDb.__mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export * from "./schema";
