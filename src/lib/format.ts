/**
 * Display helpers — the single place where stored values become
 * human-facing strings. Keeping these together means the list view, the
 * detail view, and the future public SPA all format identically.
 */

// Price is stored as integer pennies; render as GBP.
export function formatPrice(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

// Enum values are machine-friendly ("for_sale"); these map to labels.
// Defined as records so adding an enum member is a one-line change and
// TypeScript flags any value we forget to label.
const STATUS_LABELS: Record<string, string> = {
  for_sale: "For sale",
  sold: "Sold",
};

const LOCATION_LABELS: Record<string, string> = {
  centre_a: "Centre A",
  centre_b: "Centre B",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function locationLabel(location: string): string {
  return LOCATION_LABELS[location] ?? location;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
