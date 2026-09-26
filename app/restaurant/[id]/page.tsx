// app/restaurant/[id]/page.tsx
// Screen 2: Restaurant detail page
//
// This is a Server Component — it runs on the server, fetches data,
// and sends finished HTML to the browser. No JavaScript runs in the browser
// for this page.
//
// IMPORTANT: This page does ZERO maths.
// It receives averageRating as a number from the API and prints it.
// There is no addition, division, or sorting anywhere in this file.

import { notFound } from "next/navigation";
import Link from "next/link";

// The shape of data our API returns
interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RestaurantData {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
}

// Fetches data from our own API endpoint
async function getRestaurant(id: string): Promise<RestaurantData | null> {
  // We build the URL using the environment variable so it works in production too
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3002";
  const res = await fetch(`${baseUrl}/api/restaurants/${id}`, {
    cache: "no-store", // Always get fresh data, never show a cached version
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch restaurant data.");

  return res.json();
}

// Renders a row of stars for display (not clickable — this is read-only)
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

// Formats a date string into something human-readable like "Sep 24, 2026"
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
  const data = await getRestaurant(id);

  // If the restaurant doesn't exist, show Next.js built-in 404 page
  if (!data) notFound();

  return (
    <div className="container">
      {/* Restaurant name, cuisine, area */}
      <h1>{data.name}</h1>
      <p className="muted gap-sm">
        {data.cuisine} · {data.area}
      </p>

      {/* Average rating — the biggest thing on the page */}
      {/* THIS IS WHERE THE AVERAGE IS PRINTED. There is no maths here. */}
      {/* We received 4.3 from the API and we print 4.3. That is all. */}
      <div className="gap-xl">
        {data.averageRating !== null ? (
          <div className="row" style={{ alignItems: "baseline" }}>
            <span className="rating-number">{data.averageRating}</span>
            <span className="muted">/ 5 &nbsp;·&nbsp; {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}</span>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: "1rem" }}>No ratings yet.</p>
        )}
      </div>

      {/* Latest review — visually highlighted */}
      {data.latestReview !== null ? (
        <div className="gap-xl">
          <p className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.5rem" }}>
            Most Recent
          </p>
          <div className="latest-review-card">
            <div className="row" style={{ marginBottom: "0.5rem" }}>
              <StarDisplay rating={data.latestReview.rating} />
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {formatDate(data.latestReview.createdAt)}
              </span>
            </div>
            <p style={{ fontSize: "0.9375rem" }}>{data.latestReview.comment}</p>
          </div>
        </div>
      ) : (
        /* Empty state — no reviews yet */
        <div className="gap-xl card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No reviews yet</p>
          <p className="muted" style={{ marginBottom: "1.25rem", fontSize: "0.9rem" }}>
            Be the first to share your experience.
          </p>
          <Link href={`/review/${id}`} className="link">
            Write a review →
          </Link>
        </div>
      )}

      {/* Older reviews list */}
      {data.reviews.length > 0 && (
        <div className="gap-xl">
          <h2>All reviews</h2>
          <div className="gap-md" style={{ borderTop: "1px solid var(--border)" }}>
            {data.reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="row" style={{ marginBottom: "0.25rem" }}>
                  <StarDisplay rating={review.rating} />
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to write a review — always shown */}
      {data.latestReview !== null && (
        <div className="gap-xl">
          <Link href={`/review/${id}`} className="link">
            + Write a review
          </Link>
        </div>
      )}
    </div>
  );
}
