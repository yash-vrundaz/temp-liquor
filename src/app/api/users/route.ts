import { NextResponse } from "next/server";
import { requireAnyPermission, requirePermission, requireUser } from "@/lib/auth/require";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { createUserSchema, patchUserSchema } from "@/lib/db/validators";
import { createManagedUser, listManagedUsers, patchManagedUser } from "@/lib/db/users";
import { validatePassword } from "@/lib/auth/password";

export async function GET(request: Request) {
  try {
    const { error } = await requirePermission("users.view");
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const result = await listManagedUsers({
      q: searchParams.get("q") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 10),
      offset: Number(searchParams.get("offset") ?? 0),
      sortKey: searchParams.get("sortKey") ?? undefined,
      sortDir:
        searchParams.get("sortDir") === "asc"
          ? "asc"
          : searchParams.get("sortDir") === "desc"
            ? "desc"
            : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requirePermission("users.create");
    if (error) return error;
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 },
      );
    }
    const passwordError = validatePassword(parsed.data.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    const result = await createManagedUser(user, parsed.data);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = patchUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user update." }, { status: 400 });
    }
    const data = parsed.data;
    const passwordOnly =
      Boolean(data.password) &&
      data.name === undefined &&
      data.email === undefined &&
      data.role === undefined &&
      data.active === undefined &&
      data.avatarUrl === undefined &&
      data.permissionGrants === undefined &&
      data.permissionRevokes === undefined &&
      data.allowedLocationIds === undefined;

    const roleOnly =
      data.role !== undefined &&
      data.name === undefined &&
      data.email === undefined &&
      data.password === undefined &&
      data.active === undefined &&
      data.avatarUrl === undefined &&
      data.permissionGrants === undefined &&
      data.permissionRevokes === undefined &&
      data.allowedLocationIds === undefined;

    const activeOnly =
      typeof data.active === "boolean" &&
      data.name === undefined &&
      data.email === undefined &&
      data.password === undefined &&
      data.role === undefined &&
      data.avatarUrl === undefined &&
      data.permissionGrants === undefined &&
      data.permissionRevokes === undefined &&
      data.allowedLocationIds === undefined;

    const auth = passwordOnly
      ? await requireUser()
      : roleOnly
        ? await requireAnyPermission(["users.assign_roles", "users.edit"])
        : activeOnly
          ? await requireAnyPermission(["users.deactivate", "users.edit"])
          : await requirePermission("users.edit");
    if (auth.error) return auth.error;
    if (
      passwordOnly &&
      !hasAnyPermission(auth.user, ["users.reset_password", "users.edit"])
    ) {
      return NextResponse.json(
        { error: "Reset password is not allowed for this account." },
        { status: 403 },
      );
    }

    const result = await patchManagedUser(auth.user, data);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[PATCH /api/users]", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
