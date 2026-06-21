import { and, or, eq, ilike, gte, lte, type SQL } from "drizzle-orm";
import { items } from "@/db/schema";

/**
 * The raw search-param shape shared by the page, filter modal, and chips —
 * one source of truth for what filters exist in the URL.
 */
export type SearchParams = {
  q?: string;
  status?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  from?: string;
  to?: string;
  page?: string;
};

export type ItemFilters = {
  q?: string;
  status?: "for_sale" | "sold";
  location?: "centre_a" | "centre_b";
  minPence?: number;
  maxPence?: number;
  from?: Date;
  to?: Date;
};

/** Items shown per page. */
export const PAGE_SIZE = 8;

// Valid enum values — used to validate the status/location params so a
// junk URL value is ignored rather than producing a broken query.
const STATUSES = ["for_sale", "sold"] as const;
const LOCATIONS = ["centre_a", "centre_b"] as const;

export function parseItemFilters(sp: SearchParams): ItemFilters {
  const filters: ItemFilters = {};
  const q = sp.q?.trim();
  if (q) filters.q = q;

  if (sp.status && (STATUSES as readonly string[]).includes(sp.status)) {
    filters.status = sp.status as ItemFilters["status"];
  }
  if (sp.location && (LOCATIONS as readonly string[]).includes(sp.location)) {
    filters.location = sp.location as ItemFilters["location"];
  }

  const min = Number(sp.minPrice);
  if (sp.minPrice && Number.isFinite(min) && min >= 0) filters.minPence = Math.round(min * 100);
  const max = Number(sp.maxPrice);
  if (sp.maxPrice && Number.isFinite(max) && max >= 0) filters.maxPence = Math.round(max * 100);
  if (sp.from) { const d = new Date(sp.from); if (!Number.isNaN(d.getTime())) filters.from = d; }
  if (sp.to) { const d = new Date(sp.to); if (!Number.isNaN(d.getTime())) { d.setHours(23,59,59,999); filters.to = d; } }
  return filters;
}

/**
 * Parse the page number from the URL. Defaults to 1; clamps to >= 1.
 */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function buildItemWhere(filters: ItemFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.q) {
    const pattern = `%${filters.q}%`;
    const keyword = or(ilike(items.description, pattern), ilike(items.condition, pattern));
    if (keyword) conditions.push(keyword);
  }
  if (filters.status) conditions.push(eq(items.status, filters.status));
  if (filters.location) conditions.push(eq(items.location, filters.location));
  if (filters.minPence !== undefined) conditions.push(gte(items.pricePence, filters.minPence));
  if (filters.maxPence !== undefined) conditions.push(lte(items.pricePence, filters.maxPence));
  if (filters.from) conditions.push(gte(items.createdAt, filters.from));
  if (filters.to) conditions.push(lte(items.createdAt, filters.to));
  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

// The filter keys that participate in URLs (everything except page).
const FILTER_KEYS = ["q", "status", "location", "minPrice", "maxPrice", "from", "to"] as const;

/** Build a URLSearchParams from the current filters, omitting empties and page. */
function filterParams(sp: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = sp[key];
    if (value) params.set(key, value);
  }
  return params;
}

/**
 * Build a query string preserving current filters but setting a specific
 * page — pagination links use this so the active filters survive paging.
 */
export function pageHref(sp: SearchParams, page: number): string {
  const params = filterParams(sp);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/inventory?${qs}` : "/inventory";
}

/**
 * Build the inventory URL with one filter removed — used by the removable
 * chips. Dropping a filter also resets to page 1 (the old page may no
 * longer exist once the result set grows).
 */
export function removeFilterHref(sp: SearchParams, key: (typeof FILTER_KEYS)[number]): string {
  const params = filterParams(sp);
  params.delete(key);
  const qs = params.toString();
  return qs ? `/inventory?${qs}` : "/inventory";
}
