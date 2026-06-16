"use server";
import { redirect } from "next/navigation";
import { destroySession } from "@/auth";

/**
 * Sign-out server action: clears the session cookie and returns to login.
 * Replaces NextAuth's signOut(). Trivial now that the session is just a
 * cookie we own.
 */
export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}
