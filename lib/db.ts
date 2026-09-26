// lib/db.ts
// This file creates one shared database connection for the whole app.
// Every API route imports `sql` from here instead of creating its own connection.
//
// "neon()" takes your connection string and returns a function called `sql`.
// You use it like: const rows = await sql`SELECT * FROM restaurants`
// The backtick syntax (template literals) is how Neon safely passes values to
// the database, preventing a security problem called "SQL injection".

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

export const sql = neon(process.env.DATABASE_URL);
