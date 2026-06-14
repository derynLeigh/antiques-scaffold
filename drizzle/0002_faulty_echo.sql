ALTER TABLE "items" ADD COLUMN "condition" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "cost_pence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "cost_non_negative" CHECK ("items"."cost_pence" >= 0);