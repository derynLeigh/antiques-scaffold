import { handlers } from "@/auth";

/**
 * Exposes Auth.js's GET and POST handlers at /api/auth/*. The magic-link
 * flow (request link, verify token, create session) all runs through
 * these. You don't call them directly — the signIn() helper and the
 * login form do.
 */
export const { GET, POST } = handlers;
