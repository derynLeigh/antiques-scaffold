import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Auth.js (NextAuth v5) — single-user credentials configuration.
 *
 * Why credentials over magic-link: for exactly one user, a single hashed
 * password is the leanest secure option. It needs no database adapter and
 * no extra tables — sessions stay as stateless signed JWT cookies, which
 * suits Vercel's serverless model (no per-request session lookup).
 *
 * The password is never stored in plaintext anywhere. We store a bcrypt
 * HASH in the AUTH_PASSWORD_HASH env var and compare against it. The hash
 * is useless to an attacker who reads the env — they still can't derive
 * the password from it.
 *
 * The "user" here is a single fixed identity. There's no users table to
 * look anything up in; identity is defined entirely by knowing the one
 * password. authorize() returns null on any failure so Auth.js shows the
 * login page's error state rather than throwing.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password as string | undefined;
        const hash = process.env.AUTH_PASSWORD_HASH;

        if (!password || !hash) return null;

        const ok = await bcrypt.compare(password, hash);
        if (!ok) return null;

        // Any object returned becomes the signed-in user. Single fixed
        // identity — no database row, just a stable id/name.
        return { id: "owner", name: "Owner" };
      },
    }),
  ],
  callbacks: {
    // Credentials sessions need identity carried explicitly into the JWT,
    // then out to the session object — otherwise session.user is empty.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
