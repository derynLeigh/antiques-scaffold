import { and, or, ilike, gte, lte, type SQL } from "drizzle-orm";
import { items } from "@/db/schema";

/**
 * Parsed, validated filter values derived from URL search params.
 * Everything is optional — absent filters simply don't constrain the query.
 */
export type ItemFilters = {
  q?: string;
  minPence?: number;
  maxPence?: number;
  from?: Date;
  to?: Date;
};

/**
 * Turn raw URL search params into a clean ItemFilters object.
 *
 * Parsing lives here (not in the page) so the rules are in one place and
 * testable. Prices arrive as pounds in the URL and convert to pennies to
 * match how they're stored. Invalid/empty values are dropped rather than
 * throwing — a malformed filter should yield "no constraint", not a crash.
 */
export function parseItemFilters(sp: {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  from?: string;
  to?: string;
}): ItemFilters {
  const filters: ItemFilters = {};

  const q = sp.q?.trim();
  if (q) filters.q = q;

  const min = Number(sp.minPrice);
  if (sp.minPrice && Number.isFinite(min) && min >= 0) {
    filters.minPence = Math.round(min * 100);
  }

  const max = Number(sp.maxPrice);
  if (sp.maxPrice && Number.isFinite(max) && max >= 0) {
    filters.maxPence = Math.round(max * 100);
  }

  if (sp.from) {
    const d = new Date(sp.from);
    if (!Number.isNaN(d.getTime())) filters.from = d;
  }

  if (sp.to) {
    const d = new Date(sp.to);
    if (!Number.isNaN(d.getTime())) {
      // Include the whole "to" day by pushing to its end.
      d.setHours(23, 59, 59, 999);
      filters.to = d;
    }
  }

  return filters;
}

/**
 * Build a Drizzle WHERE condition from filters, or undefined if there are
 * none (so the caller can omit .where() entirely).
 *
 * Keyword search uses ILIKE across description AND condition, combined
 * with OR so a match in either field counts. The price and date bounds
 * are simple indexed comparisons — these hit the idx_items_price and
 * idx_items_created_at indexes from the schema.
 */
export function buildItemWhere(filters: ItemFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    const keyword = or(
      ilike(items.description, pattern),
      ilike(items.condition, pattern)
    );
    if (keyword) conditions.push(keyword);
  }

  if (filters.minPence !== undefined) {
    conditions.push(gte(items.pricePence, filters.minPence));
  }
  if (filters.maxPence !== undefined) {
    conditions.push(lte(items.pricePence, filters.maxPence));
  }

  if (filters.from) {
    conditions.push(gte(items.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(items.createdAt, filters.to));
  }

  if (conditions.length === 0) return undefined;
  return and(...conditions);
}
