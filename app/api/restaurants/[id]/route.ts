// app/api/restaurants/[id]/route.ts
// Handles GET /api/restaurants/[id]
// Returns all restaurant data including averageRating computed by the database.
//
// KEY RULE: averageRating and totalReviews come from SQL (AVG, COUNT).
// The frontend receives a number and prints it. Zero maths in the UI.

import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = parseInt(id, 10);

  if (isNaN(restaurantId)) {
    return NextResponse.json(
      { error: "Restaurant id must be a number." },
      { status: 400 }
    );
  }

  // --- Query 1: Get the restaurant row ---
  const restaurantRows = await sql`
    SELECT id, name, cuisine, area
    FROM restaurants
    WHERE id = ${restaurantId}
  `;

  if (restaurantRows.length === 0) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 404 }
    );
  }

  const restaurant = restaurantRows[0];

  // --- Query 2: Aggregate stats ---
  // AVG(rating) computes the average. The database does the maths.
  // ROUND(..., 1) rounds to one decimal place. Also in the database.
  // COUNT(*) counts all reviews. Also in the database.
  // The frontend will receive a single number like 4.3 and just print it.
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

  // What happens when there are no reviews yet?
  // Decision: averageRating → null (not 0, because "no data" ≠ "zero rating")
  //           totalReviews → 0
  //           latestReview → null (nothing to show)
  //           reviews → [] (empty array, the UI can show an invite)
  // This is a decision you will face on every product you build:
  // "what does this page look like before any data exists?"
  if (allReviews.length === 0) {
    return NextResponse.json({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      area: restaurant.area,
      averageRating: null,
      totalReviews: 0,
      latestReview: null,
      reviews: [],
    });
  }

  // The first row (index 0) is the latest review because we ordered by created_at DESC.
  const latestReview = allReviews[0];

  // The remaining reviews are everything except the latest.
  // The spec says: show latestReview separately, don't duplicate it in the list.
  const olderReviews = allReviews.slice(1);

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews: olderReviews,
  });
}
