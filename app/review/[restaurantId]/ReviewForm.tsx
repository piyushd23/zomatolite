"use client";

// app/review/[restaurantId]/ReviewForm.tsx
// This is the interactive part of the review form.
// "use client" means this code runs in the browser — it can respond to clicks.
//
// The star picker, comment box, and submit button all live here.
// On submit: calls POST /api/reviews, then redirects to /restaurant/[id].
// If the API returns an error, we display exactly what the API said.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  restaurantId: number;
}

export default function ReviewForm({ restaurantId }: Props) {
  // "state" in React means values that can change and cause the page to update.
  // When rating changes, React re-draws the stars. When comment changes, the
  // button enabled/disabled state updates. This is not stored anywhere — it
  // lives only in the browser's memory for this session.
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  // The button is disabled until a rating is selected AND the comment is non-empty.
  // This is a UI convenience, not a security check — the backend validates too.
  const canSubmit =
    rating !== null && comment.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || rating === null) return;

    setSubmitting(true);
    setError(null);

    // Call the backend. Note: the frontend does not validate rating here.
    // It sends what the user picked. The backend is the source of truth.
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, rating, comment }),
    });

    if (!res.ok) {
      // The API returned an error. We display exactly what the backend said.
      // We do NOT invent our own message — that would hide real information.
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    // Success: go to the restaurant page
    router.push(`/restaurant/${restaurantId}`);
  }

  // Which star to display as filled: the hovered star takes priority,
  // then the selected star, then nothing.
  const displayRating = hoveredRating ?? rating ?? 0;

  return (
    <form onSubmit={handleSubmit}>
      {/* Star picker */}
      <div className="gap-lg">
        <label className="field-label">Your rating</label>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`star ${n <= displayRating ? "filled" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoveredRating(n)}
              onMouseLeave={() => setHoveredRating(null)}
              aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        {rating && (
          <p className="muted gap-sm" style={{ fontSize: "0.85rem" }}>
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]} —{" "}
            {rating} / 5
          </p>
        )}
      </div>

      {/* Comment box */}
      <div className="gap-lg">
        <label htmlFor="comment" className="field-label">
          Your comment
        </label>
        <textarea
          id="comment"
          placeholder="What did you think?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      {/* Error from the backend */}
      {error && (
        <div className="error-box gap-md" role="alert">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="gap-lg">
        <button
          type="submit"
          className="submit-btn"
          disabled={!canSubmit}
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
