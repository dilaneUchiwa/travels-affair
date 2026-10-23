import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations appliquées.");
  client.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
