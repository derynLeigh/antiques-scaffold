import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * The gate. Every request passes through here; unauthenticated requests
 * to protected paths get bounced to /login.
 *
 * The principle: deny by default. Rather than listing what to protect
 * (easy to forget a new route), we protect everything and explicitly
 * allow-list the handful of public paths. When you add the public SPA
 * in Phase 6, you'll extend PUBLIC_PREFIXES — until then, the whole app
 * is private behind this one check.
 */

// Paths reachable without a session. Auth.js's own routes live under
// /api/auth and must stay open so the magic-link flow can complete.
const PUBLIC_PREFIXES = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  // req.auth is populated by the auth() wrapper. No session -> redirect.
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Matcher excludes static assets and image optimisation so the gate only
// runs on real page/API requests — keeps the middleware cheap.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
