/**
 * Seeds the Tier 1 scoring config from database/seed/tier1-scoring-config.json
 * and makes it the active version. Re-running with an unchanged version is a
 * no-op; a new `version` deactivates the previous row and inserts a new one.
 *
 * Usage: npm run seed:scoring   (reads DATABASE_URL from .env.local / .env)
 */
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

process.loadEnvFile?.(".env.local");
if (!process.env.DATABASE_URL) process.loadEnvFile?.(".env");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const config = JSON.parse(
  readFileSync(new URL("../database/seed/tier1-scoring-config.json", import.meta.url), "utf8"),
);

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await db.beginTransaction();
  const [existing] = await db.query(
    "SELECT id FROM fra_scoring_config WHERE tier = 1 AND version = ?",
    [config.version],
  );
  if (existing.length) {
    await db.query("UPDATE fra_scoring_config SET config = ? WHERE id = ?", [
      JSON.stringify(config),
      existing[0].id,
    ]);
    await db.query("UPDATE fra_scoring_config SET active = (id = ?) WHERE tier = 1", [existing[0].id]);
    console.log(`Updated and activated Tier 1 config ${config.version}.`);
  } else {
    await db.query("UPDATE fra_scoring_config SET active = 0 WHERE tier = 1");
    await db.query(
      "INSERT INTO fra_scoring_config (tier, version, config, active) VALUES (1, ?, ?, 1)",
      [config.version, JSON.stringify(config)],
    );
    console.log(`Inserted and activated Tier 1 config ${config.version}.`);
  }
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
