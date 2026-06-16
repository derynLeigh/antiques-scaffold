import { redirect } from "next/navigation";
import { verifyPassword, createSession } from "@/auth";

/**
 * Login page — single password field.
 *
 * The server action verifies the password against the stored hash and, on
 * success, issues the signed session cookie then redirects to /inventory.
 * On failure it redirects back with ?error=1 to show the message.
 *
 * Cleaner than the NextAuth version: no AuthError dance, no distinguishing
 * a thrown redirect from a thrown auth error. We control the whole flow —
 * verify, set cookie, redirect — so it reads top to bottom.
 *
 * Note redirect() must be called OUTSIDE the try/catch: it works by
 * throwing a special signal Next catches, so wrapping it would swallow
 * that signal. We verify inside the guard, then redirect after.
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
    const password = formData.get("password") as string;
    const ok = await verifyPassword(password);
    if (!ok) {
      redirect("/login?error=1");
    }
    await createSession();
    redirect("/inventory");
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
