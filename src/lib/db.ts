import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getDatabase() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured.");
    }

    pool = mysql.createPool(databaseUrl);
  }

  return pool;
}