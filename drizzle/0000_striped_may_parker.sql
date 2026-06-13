CREATE TYPE "public"."item_location" AS ENUM('centre_a', 'centre_b');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('for_sale', 'sold');--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"price_pence" integer NOT NULL,
	"status" "item_status" DEFAULT 'for_sale' NOT NULL,
	"location" "item_location" NOT NULL,
	"image_key" text,
	"listing_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sold_at" timestamp with time zone,
	CONSTRAINT "price_non_negative" CHECK ("items"."price_pence" >= 0)
);
--> statement-breakpoint
CREATE INDEX "idx_items_created_at" ON "items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_items_price" ON "items" USING btree ("price_pence");--> statement-breakpoint
CREATE INDEX "idx_items_status" ON "items" USING btree ("status");