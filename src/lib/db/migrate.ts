import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

export function runMigrations() {
  const url = process.env.DATABASE_URL ?? "file:./data/siteproof.db";
  const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;
  const abs = path.isAbsolute(filePath) ? filePath : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const sqlite = new Database(abs);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
  sqlite.close();
}
