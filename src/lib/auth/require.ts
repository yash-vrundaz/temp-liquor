import { NextResponse } from "next/server";
import { fetchUserById } from "@/lib/db/queries";
import { isStaffRole } from "@/lib/auth/roles";
import { PERMISSION_META, hasPermission, type Permission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import type { UserProfile } from "@/types";

type AuthOk = { user: UserProfile; error: null };
type AuthErr = { user: null; error: NextResponse };

export async function getRequestUser(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await fetchUserById(session.sub);
  if (!user || user.active === false) return null;
  return user;
}

export async function requireUser(): Promise<AuthOk | AuthErr> {
  const user = await getRequestUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  return { user, error: null };
}

export async function requireStaff(): Promise<AuthOk | AuthErr> {
  const result = await requireUser();
  if (result.error) return result;
  if (!isStaffRole(result.user)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Staff access required." }, { status: 403 }),
    };
  }
  return result;
}

export async function requireManager(): Promise<AuthOk | AuthErr> {
  return requirePermission("users.view");
}

export async function requirePermission(permission: Permission): Promise<AuthOk | AuthErr> {
  const result = await requireUser();
  if (result.error) return result;
  if (!hasPermission(result.user, permission)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: `${PERMISSION_META[permission].label} is not allowed for this account.` },
        { status: 403 },
      ),
    };
  }
  return result;
}
