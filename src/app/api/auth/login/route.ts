import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db/users";
import { recordActivity } from "@/lib/db/activity";
import { loginSchema } from "@/lib/db/validators";
import { writeSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const result = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const user = result.user;
    await recordActivity({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      summary: `${user.name} signed in as ${user.role}`,
    });
    const res = NextResponse.json({ user });
    return writeSessionCookie(res, { sub: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
