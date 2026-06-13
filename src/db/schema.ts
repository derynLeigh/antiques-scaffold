import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Enums are enforced at the database level, so an invalid status or
 * location can never be written — even by a buggy query that bypasses
 * the app. This is the "tighten the schema with constraints" principle:
 * push correctness down into the data layer where it can't be skipped.
 */
export const itemStatus = pgEnum("item_status", ["for_sale", "sold"]);

// Your two antique centres. Modelled as an enum for now because the list
// is small and stable. If it ever needs to grow or carry its own data
// (address, opening hours), promote it to a `locations` lookup table.
export const itemLocation = pgEnum("item_location", [
  "centre_a",
  "centre_b",
]);

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),

    description: text("description").notNull(),

    // Price stored as an INTEGER number of pennies, never a float.
    // £42.50 is stored as 4250. This avoids floating-point rounding
    // errors entirely — you format to pounds only at display time.
    pricePence: integer("price_pence").notNull(),

    status: itemStatus("status").notNull().default("for_sale"),

    location: itemLocation("location").notNull(),

    // The image lives in R2; we store only its object key here.
    // Nullable so you can create an item before the upload finishes.
    imageKey: text("image_key"),

    // The external page where this item is listed online. A separate
    // concern from the image — this is just a URL, distinct from the
    // picture of the item.
    listingUrl: text("listing_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Nullable — only set when status flips to 'sold'. Useful later
    // for any sales reporting without needing a separate history table.
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (table) => [
    // Indexes targeting your three search axes: keyword (status filter
    // usually accompanies it), price range, and date added.
    index("idx_items_created_at").on(table.createdAt),
    index("idx_items_price").on(table.pricePence),
    index("idx_items_status").on(table.status),

    // A non-negative price is a data-integrity invariant, so it belongs
    // in the schema rather than being trusted to app code.
    check("price_non_negative", sql`${table.pricePence} >= 0`),
  ]
);

// Inferred types — use these throughout the app so your TypeScript stays
// in lockstep with the actual table definition.
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
