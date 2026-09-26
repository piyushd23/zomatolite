// app/api/reviews/route.ts
// Handles POST /api/reviews
// Validates the incoming review and inserts it into the database.
// There is no UI code here — this is pure backend logic.

import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Step 1: Parse the incoming JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId: unknown;
    rating: unknown;
    comment: unknown;
  };

  // --- Validation: in order, stop at the first failure ---

  // Validation 1: rating must be an integer between 1 and 5
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Validation 2: comment must be a non-empty string after trimming whitespace
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment must be a non-empty string." },
      { status: 400 }
    );
  }

  // Validation 3: restaurantId must refer to a restaurant that actually exists
  // This requires a database lookup — the UI cannot do this check reliably.
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "restaurantId must be a whole number." },
      { status: 400 }
    );
  }

  const restaurantRows = await sql`
    SELECT id FROM restaurants WHERE id = ${restaurantId}
  `;

  if (restaurantRows.length === 0) {
    return NextResponse.json(
      { error: `No restaurant found with id ${restaurantId}.` },
      { status: 400 }
    );
  }

  // --- All validations passed: insert the review ---
  // We use the trimmed comment so leading/trailing spaces don't get stored.
  const result = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${comment.trim()})
    RETURNING id
  `;

  const reviewId = result[0].id;

  // Return HTTP 201 (Created) with the new review's id
  return NextResponse.json({ success: true, reviewId }, { status: 201 });
}
