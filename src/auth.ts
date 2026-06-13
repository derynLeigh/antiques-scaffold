import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Magic-link strategy: the single user receives a sign-in link by email,
 * so there's no password to store or hash anywhere. This is the cleanest
 * fit for a single-user app on serverless — no password reset flow, no
 * credential table.
 *
 * Session strategy is JWT (the default when there's no database adapter),
 * which means sessions live in a signed cookie rather than a DB table.
 * On Vercel's serverless model that avoids a per-request session lookup.
 *
 * ALLOWED_EMAIL gates sign-in to you alone: even though magic-link would
 * technically email a link to anyone who enters an address, the signIn
 * callback rejects every address except yours. That's what makes a
 * public-internet login page safe for a single-user system.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Hard allow-list: only the owner's email may sign in.
    async signIn({ user }) {
      const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
      return user.email?.toLowerCase() === allowed;
    },
  },
});
