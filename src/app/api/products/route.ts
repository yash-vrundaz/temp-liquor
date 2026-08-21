import { NextResponse } from "next/server";
import { fetchAllProducts, createCustomProduct, updateCatalogProduct } from "@/lib/db/queries";
import { newBottleSchema, patchBottleSchema } from "@/lib/db/validators";
import { requirePermission } from "@/lib/auth/require";

export async function GET() {
  try {
    const products = await fetchAllProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requirePermission("catalog.create");
    if (error) return error;
    const parsed = newBottleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product payload." }, { status: 400 });
    }
    const { actorUserId: _actor, ...input } = parsed.data;
    const existing = await fetchAllProducts();
    const result = await createCustomProduct(
      input,
      existing.map((p) => p.slug),
      user.id,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requirePermission("catalog.edit");
    if (error) return error;
    const parsed = patchBottleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid bottle update." }, { status: 400 });
    }
    const result = await updateCatalogProduct(parsed.data.productId, parsed.data.patch, user.id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ product: result.product });
  } catch (error) {
    console.error("[PATCH /api/products]", error);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
