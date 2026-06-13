import { signIn } from "@/auth";

/**
 * Login page. A single email field that triggers the magic-link flow.
 * The server action calls signIn("resend", ...) which emails the link;
 * clicking it completes sign-in and the middleware then lets you through.
 *
 * Note: no <form> validation theatre here — Auth.js + the ALLOWED_EMAIL
 * allow-list do the real work. Anyone can type an address, but only the
 * owner's address actually receives a working link.
 */
export default function LoginPage() {
  return (
    <main style={{ maxWidth: 360, margin: "8rem auto", padding: "0 1rem" }}>
      <h1>Sign in</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Enter your email and we&apos;ll send you a sign-in link.
      </p>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", {
            email: formData.get("email") as string,
            redirectTo: "/inventory",
          });
        }}
      >
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
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
          Send sign-in link
        </button>
      </form>
    </main>
  );
}
