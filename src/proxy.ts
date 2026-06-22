import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * The gate (Next 16 proxy convention). Every request passes through here;
 * unauthenticated requests to protected paths get bounced to /login.
 *
 * Why this verifies the cookie directly rather than calling getSession():
 * middleware runs in the Edge runtime, which can't use next/headers'
 * cookies() the same way and can't run bcryptjs. But jose IS
 * Edge-compatible, so we read the cookie off the request and verify the
 * JWT signature here. No bcrypt needed at this layer — the password was
 * already checked at login; the proxy only checks "is there a valid
 * signed session".
 *
 * Deny by default: protect everything, allow-list only /login. (The old
 * /api/auth allow-list is gone — there's no NextAuth route handler now.)
 */

const PUBLIC_PREFIXES = ["/login"];

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("session")?.value;

  if (token) {
    try {
      await jwtVerify(token, secretKey());
      return NextResponse.next(); // valid session — allow
    } catch {
      // fall through to redirect on invalid/expired token
    }
  }

  const loginUrl = new URL("/login", req.nextUrl.origin);
  return NextResponse.redirect(loginUrl);
}

// Matcher excludes static assets and image optimisation so the gate only
// runs on real page/API requests — keeps the proxy cheap.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
};
