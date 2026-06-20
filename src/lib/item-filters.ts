import { and, or, ilike, gte, lte, type SQL } from "drizzle-orm";
import { items } from "@/db/schema";

export type ItemFilters = { q?: string; minPence?: number; maxPence?: number; from?: Date; to?: Date; };

/** Items shown per page. */
export const PAGE_SIZE = 8;

export function parseItemFilters(sp: { q?: string; minPrice?: string; maxPrice?: string; from?: string; to?: string; }): ItemFilters {
  const filters: ItemFilters = {};
  const q = sp.q?.trim();
  if (q) filters.q = q;
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
 * Invalid values fall back to page 1 rather than erroring.
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
  if (filters.minPence !== undefined) conditions.push(gte(items.pricePence, filters.minPence));
  if (filters.maxPence !== undefined) conditions.push(lte(items.pricePence, filters.maxPence));
  if (filters.from) conditions.push(gte(items.createdAt, filters.from));
  if (filters.to) conditions.push(lte(items.createdAt, filters.to));
  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

/**
 * Build a query string preserving the current filters but setting a
 * specific page — used by the pagination links so "next page" keeps the
 * active filters. Omits empty values to keep URLs tidy.
 */
export function pageHref(
  sp: { q?: string; minPrice?: string; maxPrice?: string; from?: string; to?: string },
  page: number
): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.minPrice) params.set("minPrice", sp.minPrice);
  if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
  if (sp.from) params.set("from", sp.from);
  if (sp.to) params.set("to", sp.to);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/inventory?${qs}` : "/inventory";
}
