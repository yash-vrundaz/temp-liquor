import { NextResponse } from "next/server";
import { fetchReviewsForProduct } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }
    const reviews = await fetchReviewsForProduct(productId);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("[GET /api/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}
