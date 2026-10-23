// One-off : crée la base indiquée dans DATABASE_URL si elle n'existe pas (ne log jamais les identifiants).
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL manquant."); process.exit(1); }
const u = new URL(url);
const database = decodeURIComponent(u.pathname.replace(/^\//, ""));
const needsSsl = /\bssl-mode=required\b/i.test(url) || /aivencloud\.com/i.test(url);

const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  ssl: needsSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" } : undefined,
});
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
console.log(`Base « ${database} » prête.`);
await conn.end();
