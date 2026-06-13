import { signIn } from "@/auth";

/**
 * Login page — single password field.
 *
 * The server action calls signIn("credentials", ...) which runs the
 * authorize() function in auth.ts. On success the user is redirected to
 * /inventory; on failure Auth.js redirects back to /login (the error
 * page we configured), so a wrong password simply returns here.
 *
 * redirectTo is handled by signIn. We don't surface a detailed error
 * message on purpose — "wrong password" with no username to enumerate
 * gives an attacker nothing useful.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = Boolean(searchParams?.error);

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
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            password: formData.get("password") as string,
            redirectTo: "/inventory",
          });
        }}
      >
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
