import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const markets = pgTable("markets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  // Market identification
  marketId: integer("market_id").notNull().unique(),

  // Data from indexer events
  creator: varchar("creator", { length: 42 }).notNull(),
  startsAt: numeric("starts_at", { precision: 20, scale: 0 }).notNull(), // Using numeric type
  expiresAt: numeric("expires_at", { precision: 20, scale: 0 }).notNull(), // Using numeric type
  collateralToken: varchar("collateral_token", { length: 42 }).notNull(),
  outcomeCount: integer("outcome_count").notNull(),
  initialCollateral: numeric("initial_collateral", {
    precision: 20,
    scale: 0,
  }).notNull(), // Using numeric type
  creatorFeeBps: integer("creator_fee_bps").notNull(),
  metaDataURI: text("meta_data_uri"),
  alpha: numeric("alpha", { precision: 20, scale: 0 }).notNull(), // Using numeric type

  // Chain data (populated by background job)
  title: text("title"),
  resolutionCriteria: text("resolution_criteria"),
  endDate: numeric("end_date", { precision: 20, scale: 0 }), // Using numeric type
  outcomes: json("outcomes").$type<string[]>(),

  // Volume data (calculated from indexed events)
  totalVolume: numeric("total_volume", { precision: 20, scale: 0 }) // Using numeric type
    .default("0")
    .notNull(),
  tradeCount: integer("trade_count").default(0).notNull(),

  // Resolution status
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),

  // AI Evaluation scores (0-10)
  aiResolvability: numeric("ai_resolvability", { precision: 3, scale: 1 }),
  aiClarity: numeric("ai_clarity", { precision: 3, scale: 1 }),
  aiManipulabilityRisk: numeric("ai_manipulability_risk", {
    precision: 3,
    scale: 1,
  }),

  aiExplanation: text("ai_explanation"),
  aiEvaluatedAt: timestamp("ai_evaluated_at"),

  // Tracking fields
  needsAiEvaluation: boolean("needs_ai_evaluation").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
