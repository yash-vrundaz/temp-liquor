import { NextResponse } from "next/server";
import { cancelOrder, fetchInventoryState, placeOrder, StockConflictError } from "@/lib/db/queries";
import { cancelOrderSchema, placeOrderSchema } from "@/lib/db/validators";
import { getRequestUser } from "@/lib/auth/require";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`order:ip:${clientIp(request)}`, { limit: 15, windowMs: 60_000 });
    if (!limit.ok) {
      return tooManyRequests(limit.retryAfter);
    }
    const parsed = placeOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
    }
    const actor = await getRequestUser();
    // Never trust a userId from the request body — a logged-in customer is
    // identified by their session, a guest by their email. Otherwise anyone
    // could attribute orders (and loyalty points) to an arbitrary account.
    const result = await placeOrder({
      ...parsed.data,
      userId: actor?.id,
    });
    const inventory = await fetchInventoryState();
    return NextResponse.json({ ...result, inventory }, { status: 201 });
  } catch (error) {
    if (error instanceof StockConflictError) {
      return NextResponse.json(
        { error: error.message, shortfalls: error.shortfalls },
        { status: 409 },
      );
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = cancelOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cancel payload." }, { status: 400 });
    }
    // Cancelling an order changes stock and order state — require a session and
    // only ever act on the signed-in user's own orders. cancelOrder already
    // scopes by userId, so a body-supplied userId could target anyone's order.
    const actor = await getRequestUser();
    if (!actor) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const order = await cancelOrder(parsed.data.orderId, actor.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found or already cancelled." }, { status: 404 });
    }
    const inventory = await fetchInventoryState();
    return NextResponse.json({ order, inventory });
  } catch (error) {
    console.error("[PATCH /api/orders]", error);
    return NextResponse.json({ error: "Failed to cancel order." }, { status: 500 });
  }
}
