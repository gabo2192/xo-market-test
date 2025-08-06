import { and, eq, isNull, not, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../schema";
import { markets } from "../schema";

export interface CreateMarketData {
  marketId: number;
  creator: string;
  startsAt: string;
  expiresAt: string;
  collateralToken: string;
  outcomeCount: number;
  initialCollateral: string;
  creatorFeeBps: number;
  metaDataURI?: string;
  alpha: string;
  title?: string;
  resolutionCriteria?: string;
  resolved?: boolean;
  totalVolume?: string;
  tradeCount?: number;
}

export interface UpdateChainData {
  marketId: number;
  title: string;
  resolutionCriteria: string;
  endDate: string;
  outcomes: string[];
}

export class MarketsRepository {
  constructor(private db: NodePgDatabase<typeof schema>) {}

  /**
   * Create or update a market from indexer events
   */
  async upsertMarket(data: CreateMarketData) {
    return this.db
      .insert(markets)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: markets.marketId,
        set: {
          creator: data.creator,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          collateralToken: data.collateralToken,
          outcomeCount: data.outcomeCount,
          initialCollateral: data.initialCollateral,
          creatorFeeBps: data.creatorFeeBps,
          metaDataURI: data.metaDataURI,
          alpha: data.alpha,
          title: data.title,
          resolutionCriteria: data.resolutionCriteria,
          updatedAt: new Date(),
          resolved: data.resolved,
        },
      })
      .returning();
  }

  /**
   * Update market with AI evaluation
   */
  async updateAIEvaluation(evaluation: {
    marketId: number;
    resolvability: number;
    clarity: number;
    manipulabilityRisk: number;
    explanation: string;
    evaluatedAt: Date;
  }) {
    return this.db
      .update(markets)
      .set({
        aiResolvability: evaluation.resolvability.toString(),
        aiClarity: evaluation.clarity.toString(),
        aiManipulabilityRisk: evaluation.manipulabilityRisk.toString(),
        aiExplanation: evaluation.explanation,
        aiEvaluatedAt: evaluation.evaluatedAt,
        needsAiEvaluation: false,
        updatedAt: new Date(),
      })
      .where(eq(markets.marketId, evaluation.marketId))
      .returning();
  }

  /**
   * Get all markets
   */
  async getAllMarkets() {
    return this.db.select().from(markets).orderBy(markets.marketId);
  }

  /**
   * Get markets that need chain data updates
   */
  async getMarketsNeedingUpdate(limit = 1) {
    return this.db
      .select()
      .from(markets)
      .where(or(eq(markets.needsAiEvaluation, true), isNull(markets.title)))
      .limit(limit)
      .orderBy(markets.marketId);
  }

  /**
   * Get market by ID
   */
  async getMarketById(marketId: number) {
    const result = await this.db
      .select()
      .from(markets)
      .where(eq(markets.marketId, marketId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Update market volume and trade count
   */
  async updateVolume(
    marketId: number,
    totalVolume: string,
    tradeCount: number
  ) {
    return this.db
      .update(markets)
      .set({
        totalVolume,
        tradeCount,
        updatedAt: new Date(),
      })
      .where(eq(markets.marketId, marketId))
      .returning();
  }

  /**
   * Mark market as resolved
   */
  async markResolved(marketId: number) {
    return this.db
      .update(markets)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(markets.marketId, marketId))
      .returning();
  }

  /**
   * Get available markets
   */
  async getAvailableMarkets() {
    return this.db
      .select()
      .from(markets)
      .where(
        and(eq(markets.resolved, false), not(isNull(markets.aiEvaluatedAt)))
      );
  }
}
