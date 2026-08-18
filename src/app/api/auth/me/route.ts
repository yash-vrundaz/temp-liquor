import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require";
import { mePatchSchema } from "@/lib/db/validators";
import { redeemLoyaltyPoints, updateUserProfile, fetchUserById } from "@/lib/db/queries";
import { updateOwnPassword, updateOwnProfileFields } from "@/lib/db/users";
import { writeSessionCookie } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth/password";

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const parsed = mePatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
    }
    if ("redeemPoints" in parsed.data) {
      const ok = await redeemLoyaltyPoints(user.id, parsed.data.redeemPoints);
      if (!ok) {
        return NextResponse.json({ error: "Not enough loyalty points." }, { status: 409 });
      }
      const next = await fetchUserById(user.id);
      return NextResponse.json({ user: next ?? user });
    }

    const { patch } = parsed.data;
    if (patch.password) {
      const passwordError = validatePassword(patch.password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }
      await updateOwnPassword(user.id, patch.password);
    }
    const { password: _unusedPassword, ...profilePatch } = patch;
    void _unusedPassword;
    const extrasPatch = {
      ...(profilePatch.name ? { name: profilePatch.name } : {}),
      ...(profilePatch.email ? { email: profilePatch.email } : {}),
      ...(profilePatch.avatarUrl !== undefined ? { avatarUrl: profilePatch.avatarUrl } : {}),
    };
    if (Object.keys(extrasPatch).length > 0) {
      const extraResult = await updateOwnProfileFields(user.id, extrasPatch);
      if (extraResult.error) {
        return NextResponse.json({ error: extraResult.error }, { status: extraResult.status ?? 400 });
      }
    }
    const restPatch = {
      ...(profilePatch.preferredBranchId
        ? { preferredBranchId: profilePatch.preferredBranchId }
        : {}),
      ...(profilePatch.recentlyViewed ? { recentlyViewed: profilePatch.recentlyViewed } : {}),
      ...(profilePatch.addresses ? { addresses: profilePatch.addresses } : {}),
    };
    if (Object.keys(restPatch).length > 0) {
      await updateUserProfile(user.id, restPatch);
    }
    const next = await fetchUserById(user.id);
    const payload = next ?? user;
    const res = NextResponse.json({ user: payload });
    return writeSessionCookie(res, {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
    });
  } catch (error) {
    console.error("[PATCH /api/auth/me]", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
