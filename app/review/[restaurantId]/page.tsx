// app/review/[restaurantId]/page.tsx
// Screen 1: Write a review
//
// This is a Server Component — it fetches the restaurant name DIRECTLY from
// the database (not via HTTP) so we can show it at the top of the form.
// The interactive form itself (ReviewForm.tsx) is a Client Component.

import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import ReviewForm from "./ReviewForm";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const idAsNumber = parseInt(restaurantId, 10);

  if (isNaN(idAsNumber)) notFound();

  // Query the restaurant name directly — no HTTP, no localhost
  const rows = await sql`
    SELECT name FROM restaurants WHERE id = ${idAsNumber}
  `;

  if (rows.length === 0) notFound();

  const restaurantName = rows[0].name as string;

  return (
    <div className="container">
      {/* Back link */}
      <Link
        href={`/restaurant/${restaurantId}`}
        className="link"
        style={{ fontSize: "0.875rem" }}
      >
        ← Back to {restaurantName}
      </Link>

      {/* Restaurant name at the top */}
      <div className="gap-lg">
        <h1>Write a review</h1>
        <p className="muted gap-sm">{restaurantName}</p>
      </div>

      {/* The interactive form — runs in the browser */}
      <div className="gap-xl">
        <ReviewForm restaurantId={idAsNumber} />
      </div>
    </div>
  );
}
