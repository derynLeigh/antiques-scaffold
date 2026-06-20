import { redirect } from "next/navigation";
import { verifyPassword, createSession } from "@/auth";

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
    <main className="mx-auto mt-32 max-w-sm px-5">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your password to access the inventory.
      </p>
      {hasError && (
        <p className="mt-3 text-sm text-sold-text">Incorrect password. Please try again.</p>
      )}
      <form action={authenticate} className="mt-5">
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border border-search-border bg-search-bg px-4 py-3 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
