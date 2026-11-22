import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "lac_admin_session";

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }
  return secret;
}

export function getConfiguredAdminCredentials(): {
  email: string;
  password: string;
} {
  return {
    email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "",
  };
}

export function verifyAdminPassword(
  inputEmail: string,
  inputPassword: string
): boolean {
  const configured = getConfiguredAdminCredentials();
  if (!configured.email || !configured.password) {
    return false;
  }

  const normalizedEmail = inputEmail.trim().toLowerCase();
  const emailMatch = normalizedEmail === configured.email;

  const inputBuf = Buffer.from(inputPassword, "utf8");
  const expectedBuf = Buffer.from(configured.password, "utf8");
  const passwordMatch =
    inputBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(inputBuf, expectedBuf);

  return emailMatch && passwordMatch;
}

function signPayload(payloadBase64: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export function createAdminSessionToken(email: string): string {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const payloadBase64 = Buffer.from(payload, "utf8").toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined
): { email: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signPayload(payloadBase64);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expectedSignature, "utf8");
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as { email?: string; exp?: number };
    if (!parsed.email || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return { email: parsed.email };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(): Promise<
  { ok: true; email: string } | { ok: false }
> {
  const session = await getAdminSession();
  if (!session) return { ok: false };
  return { ok: true, email: session.email };
}