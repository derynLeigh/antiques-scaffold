import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

/**
 * Login page — single password field.
 *
 * Error handling, the important part:
 *
 * signIn() throws in BOTH outcomes. On success it throws a Next redirect
 * (that's how server actions redirect); on a bad password it throws an
 * AuthError (CredentialsSignin, because authorize() returned null).
 *
 * So the catch must distinguish them: an AuthError means "wrong password"
 * → redirect back to /login?error=1 to show the message. ANY other thrown
 * value (notably the success redirect) must be re-thrown untouched, or
 * we'd accidentally swallow the redirect and login would appear to do
 * nothing. This is the canonical Auth.js v5 + server-action pattern.
 *
 * In Next 16, searchParams is async (a Promise) — same change as route
 * params — so we await it before reading ?error.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const hasError = Boolean(error);

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        password: formData.get("password") as string,
        redirectTo: "/inventory",
      });
    } catch (err) {
      // Wrong password: show the inline error.
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      // Anything else (including the success redirect) must propagate.
      throw err;
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "8rem auto", padding: "0 1rem" }}>
      <h1>Sign in</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Enter your password to access the inventory.
      </p>
      {hasError && (
        <p style={{ color: "#c00", fontSize: 14 }}>
          Incorrect password. Please try again.
        </p>
      )}
      <form action={authenticate}>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{
            width: "100%",
            padding: "0.6rem",
            marginTop: "1rem",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.6rem",
            marginTop: "0.75rem",
            border: "none",
            borderRadius: 6,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
