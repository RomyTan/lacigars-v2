import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getConfiguredAdminCredentials,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const configured = getConfiguredAdminCredentials();
    if (!configured.email || !configured.password) {
      return NextResponse.json(
        { error: "Admin credentials are not configured on the server." },
        { status: 500 }
      );
    }

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !verifyAdminPassword(email, password)
    ) {
      return NextResponse.json(
        { error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(email);
    const response = NextResponse.json({ authenticated: true });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("POST /api/cms/auth/login error:", error);
    return NextResponse.json(
      { error: "Failed to sign in." },
      { status: 500 }
    );
  }
}