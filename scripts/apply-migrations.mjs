/**
 * Apply Jala Ride Supabase migrations via direct Postgres connection.
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-migrations.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../supabase/migrations");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL (Supabase → Settings → Database → Connection string URI)");
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Connected. Applying migrations…");
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    await client.query(sql);
  }
  const seed = readFileSync(join(__dirname, "../supabase/seed.sql"), "utf8");
  console.log("→ seed.sql");
  await client.query(seed);
  console.log("Done. All migrations applied.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await client.end();
}
