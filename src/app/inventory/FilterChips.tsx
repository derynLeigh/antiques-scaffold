import Link from "next/link";
import type { SearchParams } from "@/lib/item-filters";
import { removeFilterHref } from "@/lib/item-filters";
import { statusLabel, locationLabel } from "@/lib/format";

/**
 * Removable chips showing the active filters when the modal is closed.
 * Each chip's ✕ links to the current URL minus that one filter (server-
 * rendered Links — no client JS needed). Human labels via the shared
 * label helpers so chips read "For sale" / "Donkey's Years Antiques", not raw enums.
 */
export function FilterChips({ current }: { current: SearchParams }) {
  const chips: { key: Parameters<typeof removeFilterHref>[1]; label: string }[] = [];

  if (current.q) chips.push({ key: "q", label: `“${current.q}”` });
  if (current.status) chips.push({ key: "status", label: statusLabel(current.status) });
  if (current.location) chips.push({ key: "location", label: locationLabel(current.location) });
  if (current.minPrice) chips.push({ key: "minPrice", label: `Min £${current.minPrice}` });
  if (current.maxPrice) chips.push({ key: "maxPrice", label: `Max £${current.maxPrice}` });
  if (current.from) chips.push({ key: "from", label: `From ${current.from}` });
  if (current.to) chips.push({ key: "to", label: `To ${current.to}` });

  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={removeFilterHref(current, chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface py-1 pl-3 pr-2 text-sm text-ink transition-colors hover:bg-paper"
        >
          <span>{chip.label}</span>
          <span aria-hidden className="text-muted">✕</span>
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      <Link href="/inventory" className="ml-1 text-sm text-muted underline underline-offset-2 hover:text-ink">
        Clear all
      </Link>
    </div>
  );
}
