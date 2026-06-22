"use client";

/**
 * Global error boundary. Next renders this client component whenever a
 * route throws during render or in a Server Component, instead of the
 * stark default "Application error" screen. `reset()` re-renders the
 * segment, giving the user a way to retry without a full reload.
 *
 * Must be a Client Component (Next requirement) and must accept the
 * { error, reset } props.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted">
        An unexpected error occurred. You can try again, or head back to the
        inventory.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <a
          href="/inventory"
          className="rounded-lg border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          Back to inventory
        </a>
      </div>
    </main>
  );
}
