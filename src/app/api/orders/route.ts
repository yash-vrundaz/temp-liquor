import { NextResponse } from "next/server";
import { cancelOrder, fetchInventoryState, placeOrder, StockConflictError } from "@/lib/db/queries";
import { cancelOrderSchema, placeOrderSchema } from "@/lib/db/validators";
import { getRequestUser, requireUser } from "@/lib/auth/require";

export async function POST(request: Request) {
  try {
    const parsed = placeOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return NextResponse.json(
        { error: first || "Invalid order payload." },
        { status: 400 },
      );
    }
    const actor = await getRequestUser();
    // Never trust body userId — guests cannot attribute orders to arbitrary accounts.
    const { userId: _ignored, ...orderInput } = parsed.data;
    void _ignored;
    const result = await placeOrder({
      ...orderInput,
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
    if (error instanceof Error) {
      const known = [
        "An account with this email already exists",
        "Delivery address is required",
        "Signed-in account is not available",
        "Location not found",
        "Unknown product",
      ];
      if (known.some((msg) => error.message.includes(msg))) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const parsed = cancelOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cancel payload." }, { status: 400 });
    }
    const order = await cancelOrder(parsed.data.orderId, user.id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or cannot be cancelled." },
        { status: 404 },
      );
    }
    const inventory = await fetchInventoryState();
    return NextResponse.json({ order, inventory });
  } catch (error) {
    console.error("[PATCH /api/orders]", error);
    return NextResponse.json({ error: "Failed to cancel order." }, { status: 500 });
  }
}
