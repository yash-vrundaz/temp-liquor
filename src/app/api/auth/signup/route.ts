import { NextResponse } from "next/server";
import { signupCustomer } from "@/lib/db/users";
import { signupSchema } from "@/lib/db/validators";
import { writeSessionCookie } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    const passwordError = validatePassword(parsed.data.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    const result = await signupCustomer(parsed.data);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const user = result.user;
    const res = NextResponse.json({ user });
    return writeSessionCookie(res, { sub: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json({ error: "Sign up failed." }, { status: 500 });
  }
}
