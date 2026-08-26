import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require";
import { rolePatchSchema, roleWriteSchema } from "@/lib/db/validators";
import {
  createRoleDefinition,
  deleteRoleDefinition,
  listRoleDefinitions,
  updateRoleDefinition,
  warmRoleCatalog,
} from "@/lib/db/roles-admin";
import { isDbConfigured } from "@/lib/db/prisma";
import { setCustomRoleCatalog } from "@/lib/auth/role-catalog";

export async function GET() {
  const { error } = await requirePermission("users.view");
  if (error) return error;
  try {
    if (!isDbConfigured()) {
      setCustomRoleCatalog([]);
      return NextResponse.json({ roles: [] });
    }
    const roles = await listRoleDefinitions();
    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[GET /api/roles]", err);
    return NextResponse.json({ error: "Failed to load roles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, error } = await requirePermission("users.assign_roles");
  if (error) return error;
  try {
    const parsed = roleWriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid role details." },
        { status: 400 },
      );
    }
    const result = await createRoleDefinition(user, parsed.data);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    await warmRoleCatalog();
    return NextResponse.json({ role: result.role });
  } catch (err) {
    console.error("[POST /api/roles]", err);
    return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, error } = await requirePermission("users.assign_roles");
  if (error) return error;
  try {
    const parsed = rolePatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid role update." },
        { status: 400 },
      );
    }
    const result = await updateRoleDefinition(user, parsed.data.roleId, parsed.data.patch);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    await warmRoleCatalog();
    return NextResponse.json({ role: result.role });
  } catch (err) {
    console.error("[PATCH /api/roles]", err);
    return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requirePermission("users.assign_roles");
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("id");
    if (!roleId) {
      return NextResponse.json({ error: "Role id is required." }, { status: 400 });
    }
    const result = await deleteRoleDefinition(user, roleId);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    await warmRoleCatalog();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/roles]", err);
    return NextResponse.json({ error: "Failed to delete role." }, { status: 500 });
  }
}
