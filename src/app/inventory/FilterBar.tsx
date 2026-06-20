import Link from "next/link";

/**
 * Filter bar — a GET form (filters live in the URL, shareable, no client
 * JS). Now Tailwind-styled with larger, higher-contrast inputs: the
 * search/keyword field is the prominent one, using the dedicated
 * --color-search-* tokens and a bigger size so it reads as the primary
 * way to find stock.
 */
export function FilterBar({
  current,
}: {
  current: { q?: string; minPrice?: string; maxPrice?: string; from?: string; to?: string };
}) {
  const inputBase =
    "rounded-lg border bg-search-bg border-search-border text-ink placeholder:text-faint " +
    "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors";
  const labelBase = "flex flex-col gap-1 text-xs font-medium text-muted";

  const hasFilters =
    current.q || current.minPrice || current.maxPrice || current.from || current.to;

  return (
    <form
      method="get"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-5"
    >
      <label className={`${labelBase} flex-1 min-w-[260px]`}>
        Search
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="Search by description or condition…"
          className={`${inputBase} px-4 py-3 text-base`}
        />
      </label>

      <label className={labelBase}>
        Min £
        <input
          type="number"
          name="minPrice"
          step="0.01"
          min="0"
          defaultValue={current.minPrice ?? ""}
          className={`${inputBase} w-24 px-3 py-2.5 text-sm`}
        />
      </label>

      <label className={labelBase}>
        Max £
        <input
          type="number"
          name="maxPrice"
          step="0.01"
          min="0"
          defaultValue={current.maxPrice ?? ""}
          className={`${inputBase} w-24 px-3 py-2.5 text-sm`}
        />
      </label>

      <label className={labelBase}>
        Added from
        <input
          type="date"
          name="from"
          defaultValue={current.from ?? ""}
          className={`${inputBase} px-3 py-2.5 text-sm`}
        />
      </label>

      <label className={labelBase}>
        Added to
        <input
          type="date"
          name="to"
          defaultValue={current.to ?? ""}
          className={`${inputBase} px-3 py-2.5 text-sm`}
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Filter
      </button>

      {hasFilters && (
        <Link href="/inventory" className="self-center text-sm text-muted underline underline-offset-2 hover:text-ink">
          Clear
        </Link>
      )}
    </form>
  );
}
