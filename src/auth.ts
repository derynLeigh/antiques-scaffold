import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

/**
 * Minimal single-user session — replaces NextAuth entirely.
 *
 * The whole auth need here is: prove you know the one password, then carry
 * a tamper-proof "you're signed in" marker across requests. That's a
 * signed cookie, nothing more. NextAuth's providers/adapters/OAuth
 * machinery was all unused weight, so this is ~40 lines doing exactly the
 * job and no more.
 *
 * Security model:
 *  - The password is never stored; we bcrypt-compare against
 *    AUTH_PASSWORD_HASH (same as before).
 *  - On success we issue a JWT signed with AUTH_SECRET (HS256) and store
 *    it in an httpOnly, secure, sameSite cookie. The signature means the
 *    cookie can't be forged or altered without the secret.
 *  - Verifying the cookie = verifying the signature + expiry. No database,
 *    no session table — stateless, which suits serverless.
 */

const COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Verify a password against the stored hash. Returns true on match.
 * Kept separate so the login action stays readable.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Issue a signed session cookie. Call only after verifyPassword passes.
 */
export async function createSession(): Promise<void> {
  const token = await new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // JS can't read it — mitigates XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    sameSite: "lax", // sent on top-level navigations, not cross-site POSTs
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clear the session cookie (sign out).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Read and verify the current session. Returns a minimal session object
 * if the cookie is present and its signature + expiry are valid, else
 * null. Used by pages/actions that need to know "is someone signed in".
 *
 * This is the replacement for NextAuth's auth(). Note it reads cookies
 * via next/headers, so it works in Server Components and server actions —
 * but NOT in middleware/proxy, which gets the token differently (see
 * proxy.ts).
 */
export async function getSession(): Promise<{ user: { name: string } } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    await jwtVerify(token, secretKey());
    return { user: { name: "Owner" } };
  } catch {
    // Invalid signature, expired, or malformed — treat as signed out.
    return null;
  }
}

export { COOKIE_NAME };
