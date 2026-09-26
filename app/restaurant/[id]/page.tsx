// app/restaurant/[id]/page.tsx
// Screen 2: Restaurant detail page
//
// This is a Server Component — it runs on Vercel's server, queries the database
// DIRECTLY using sql from lib/db.ts, and sends finished HTML to the browser.
//
// Before, this page was fetching from http://localhost:3002/api/restaurants/[id].
// That worked locally but crashed on Vercel because Vercel's server has no
// "localhost:3002" — there is no dev server running there.
//
// The fix: server components don't need to go through HTTP to reach their own
// database. They can call the database directly. Simpler and faster.
//
// IMPORTANT: This page does ZERO maths.
// averageRating is computed by AVG() in the SQL query below.
// This file receives a number and prints it. That is all.

import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
}

// Renders a row of stars for display (read-only, not clickable)
function StarDisplay({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= rating ? "var(--accent)" : "var(--border)", fontSize: "1rem" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurantId = parseInt(id, 10);

  if (isNaN(restaurantId)) notFound();

  // --- Query 1: Does this restaurant exist? ---
  const restaurantRows = await sql`
    SELECT id, name, cuisine, area
    FROM restaurants
    WHERE id = ${restaurantId}
  `;

  if (restaurantRows.length === 0) notFound();

  const restaurant = restaurantRows[0];

  // --- Query 2: Aggregate stats ---
  // AVG(rating) computes the average. The database does the maths.
  // ROUND(..., 1) rounds to one decimal place. Also in the database.
  // COUNT(*) counts all reviews. Also in the database.
  // THIS PAGE DOES ZERO MATHS. It receives these numbers and prints them.
  const statsRows = await sql`
    SELECT
      ROUND(AVG(rating)::numeric, 1) AS "averageRating",
      COUNT(*)::integer              AS "totalReviews"
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `;

  const averageRating =
    statsRows[0]["averageRating"] !== null
      ? parseFloat(statsRows[0]["averageRating"])
      : null;
  const totalReviews = statsRows[0]["totalReviews"] as number;

  // --- Query 3: Get all reviews, newest first ---
  const allReviews = await sql`
    SELECT id, rating, comment, created_at AS "createdAt"
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC
  `;

  const latestReview = allReviews.length > 0 ? (allReviews[0] as Review) : null;
  const olderReviews = allReviews.slice(1) as Review[];

  return (
    <div className="container">
      {/* Restaurant name, cuisine, area */}
      <h1>{restaurant.name}</h1>
      <p className="muted gap-sm">
        {restaurant.cuisine} · {restaurant.area}
      </p>

      {/* Average rating — the biggest thing on the page */}
      {/* THIS IS WHERE THE AVERAGE IS PRINTED. No maths here. */}
      {/* We received averageRating from AVG() in SQL and we print it. That is all. */}
      <div className="gap-xl">
        {averageRating !== null ? (
          <div className="row" style={{ alignItems: "baseline" }}>
            <span className="rating-number">{averageRating}</span>
            <span className="muted">
              / 5 &nbsp;·&nbsp; {totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: "1rem" }}>
            No ratings yet.
          </p>
        )}
      </div>

      {/* Latest review — visually highlighted */}
      {latestReview !== null ? (
        <div className="gap-xl">
          <p
            className="muted"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Most Recent
          </p>
          <div className="latest-review-card">
            <div className="row" style={{ marginBottom: "0.5rem" }}>
              <StarDisplay rating={latestReview.rating} />
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {formatDate(latestReview.createdAt)}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem" }}>{latestReview.comment}</p>
          </div>
        </div>
      ) : (
        /* Empty state — no reviews yet */
        <div
          className="gap-xl card"
          style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}
        >
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            No reviews yet
          </p>
          <p
            className="muted"
            style={{ marginBottom: "1.25rem", fontSize: "0.9rem" }}
          >
            Be the first to share your experience.
          </p>
          <Link href={`/review/${id}`} className="link">
            Write a review →
          </Link>
        </div>
      )}

      {/* Older reviews list */}
      {olderReviews.length > 0 && (
        <div className="gap-xl">
          <h2>All reviews</h2>
          <div
            className="gap-md"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {olderReviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="row" style={{ marginBottom: "0.25rem" }}>
                  <StarDisplay rating={review.rating} />
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to write a review — always shown when reviews exist */}
      {latestReview !== null && (
        <div className="gap-xl">
          <Link href={`/review/${id}`} className="link">
            + Write a review
          </Link>
        </div>
      )}
    </div>
  );
}
