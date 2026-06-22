import Link from "next/link";

/**
 * Styled 404. Renders for unmatched URLs and for any notFound() call
 * (e.g. an item id that doesn't exist), replacing Next's default
 * unstyled not-found page.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-medium text-faint">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        Not found
      </h1>
      <p className="mt-2 text-sm text-muted">
        The page or item you’re looking for doesn’t exist.
      </p>
      <Link
        href="/inventory"
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Back to inventory
      </Link>
    </main>
  );
}
