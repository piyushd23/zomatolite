// This script runs once to set up the database.
// It reads db/schema.sql and executes each statement against your Neon database.
// Run it with: npm run db:setup

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set. Did you create .env.local?");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Read the schema file from disk
  const schemaPath = join(process.cwd(), "db", "schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");

  console.log("🔄 Applying schema and seed data...");

  // Split on semicolons and run each statement individually.
  // This is how a SQL file is executed: one statement at a time.
  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log("✅ Schema applied!\n");

  // Show what was created so we can see the rows with our own eyes
  const restaurants = await sql`SELECT * FROM restaurants`;
  console.log("--- restaurants table ---");
  console.table(restaurants);

  const reviews = await sql`SELECT * FROM reviews ORDER BY created_at`;
  console.log("\n--- reviews table ---");
  console.table(reviews);
}

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
