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

    // Free-text condition description (e.g. "chip to rim, light foxing").
    // Nullable: condition notes are often added after the item is logged.
    condition: text("condition"),

    // Free-text dimensions (e.g. "H 42cm × W 30cm"). Free text because
    // antique measurements are irregular and don't fit a fixed structure.
    dimensions: text("dimensions"),

    // Price stored as an INTEGER number of pennies, never a float.
    // £42.50 is stored as 4250. This avoids floating-point rounding
    // errors entirely — you format to pounds only at display time.
    pricePence: integer("price_pence").notNull(),

    // What you paid for the item, in integer pennies — mirrors pricePence
    // so margin (price − cost) is clean integer arithmetic. NOT NULL since
    // cost is always known; defaults to 0 so the migration can apply to any
    // existing rows. COMMERCIALLY SENSITIVE: this is your margin — it must
    // never be exposed in the public-facing SPA (Phase 6).
    costPence: integer("cost_pence").notNull().default(0),

    status: itemStatus("status").notNull().default("for_sale"),

    location: itemLocation("location").notNull(),

    // The full image lives in R2; we store only its object key here.
    // Nullable so an item can exist without a photo.
    imageKey: text("image_key"),

    // The ~400px thumbnail's R2 key. Generated once on upload (sharp) and
    // stored separately so list views can serve the small image directly
    // rather than resizing the full one on every render.
    thumbKey: text("thumb_key"),

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

    // Same invariant for cost.
    check("cost_non_negative", sql`${table.costPence} >= 0`),
  ]
);

// Inferred types — use these throughout the app so your TypeScript stays
// in lockstep with the actual table definition.
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
