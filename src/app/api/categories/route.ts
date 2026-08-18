import { NextResponse } from "next/server";
import {
  createShopCategory,
  deleteShopCategory,
  fetchCategories,
  updateShopCategory,
} from "@/lib/db/queries";
import { categoryPatchSchema, categoryWriteSchema } from "@/lib/db/validators";
import { requirePermission } from "@/lib/auth/require";

export async function GET() {
  try {
    const categories = await fetchCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requirePermission("catalog.create");
    if (error) return error;
    const parsed = categoryWriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }
    const result = await createShopCategory(parsed.data, user.id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ category: result.category }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requirePermission("catalog.edit");
    if (error) return error;
    const parsed = categoryPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category update." }, { status: 400 });
    }
    const result = await updateShopCategory(parsed.data.slug, parsed.data.patch, user.id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ category: result.category });
  } catch (error) {
    console.error("[PATCH /api/categories]", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requirePermission("catalog.delete");
    if (error) return error;
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Category slug is required." }, { status: 400 });
    }
    const result = await deleteShopCategory(slug, user.id);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, slug: result.slug });
  } catch (error) {
    console.error("[DELETE /api/categories]", error);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
