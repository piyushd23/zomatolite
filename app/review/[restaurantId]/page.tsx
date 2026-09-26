// app/review/[restaurantId]/page.tsx
// Screen 1: Write a review
//
// This is a Server Component — it fetches the restaurant name on the server
// so we can show "Reviewing: Ludhiana Burrito" at the top before the form loads.
// The interactive form itself (ReviewForm.tsx) is a Client Component.

import { notFound } from "next/navigation";
import Link from "next/link";
import ReviewForm from "./ReviewForm";

async function getRestaurantName(id: string): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3002";
  const res = await fetch(`${baseUrl}/api/restaurants/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch restaurant.");
  const data = await res.json();
  return data.name as string;
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const restaurantName = await getRestaurantName(restaurantId);

  if (restaurantName === null) notFound();

  const idAsNumber = parseInt(restaurantId, 10);

  return (
    <div className="container">
      {/* Back link */}
      <Link href={`/restaurant/${restaurantId}`} className="link" style={{ fontSize: "0.875rem" }}>
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
