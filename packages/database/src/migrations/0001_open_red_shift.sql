ALTER TABLE "markets" ADD COLUMN "ai_resolvability" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "ai_clarity" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "ai_manipulability_risk" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "ai_explanation" text;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "ai_evaluated_at" timestamp;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "needs_ai_evaluation" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN "chain_data_updated_at";--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN "needs_chain_update";