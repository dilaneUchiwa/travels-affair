import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL ?? "mysql://root@localhost:3306/travelair";
  const needsSsl = /\bssl-mode=required\b/i.test(url) || /aivencloud\.com/i.test(url);
  const u = new URL(url);
  const connection = await mysql.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    ssl: needsSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" } : undefined,
    multipleStatements: true,
  });
  await migrate(drizzle(connection), { migrationsFolder: "./drizzle" });
  console.log("Migrations appliquées.");
  await connection.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
