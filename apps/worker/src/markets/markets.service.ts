import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IndexerService } from '@workspace/blockchain';
import { createDrizzleClient, MarketsRepository } from '@workspace/database';
import { Queue } from 'bull';
import { AIEvaluationService } from './services/ai-evaluation.service';

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);
  private readonly indexerService: IndexerService;
  private readonly marketsRepository: MarketsRepository;
  private readonly aiEvaluationService: AIEvaluationService;

  constructor(
    @InjectQueue('create-markets') private createMarketsQueue: Queue,
  ) {
    this.indexerService = new IndexerService();

    const db = createDrizzleClient(process.env.DATABASE_URL!);
    this.marketsRepository = new MarketsRepository(db);
    this.aiEvaluationService = new AIEvaluationService();
  }

  /**
   * Cron job: Sync markets from indexer every 5 minutes
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledMarketSync() {
    this.logger.log('⏰ Running scheduled market sync...');

    try {
      await this.addCreateMarketsJob();
      this.logger.log('✅ Scheduled market sync job added to queue');
    } catch (error) {
      this.logger.error('❌ Failed to schedule market sync:', error);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async cronAiEvaluation() {
    this.logger.log('⏰ Running cron market sync...');
    try {
      const [market] = await this.marketsRepository.getMarketsNeedingUpdate();

      if (!market) {
        this.logger.log('✅ No markets needing AI evaluation found');
        return;
      }

      const evaluation = await this.aiEvaluationService.evaluateMarket(market);
      this.logger.log(
        `✅ AI evaluation for market ${market.marketId}: ${JSON.stringify(evaluation, null, 2)}`,
      );

      await this.marketsRepository.updateAIEvaluation(evaluation);
    } catch (error) {
      this.logger.error('❌ Failed to schedule market sync:', error);
    }
  }

  /**
   * Sync all markets from indexer and add to database
   */
  async syncMarketsFromIndexer() {
    this.logger.log('🔄 Starting market sync from indexer...');

    try {
      // Get all MarketCreated events from indexer
      const marketEvents = await this.indexerService.getMarketCreatedEvents();
      const resolvedMarkets = await this.indexerService.getResolvedMarkets();

      this.logger.log(`Found ${marketEvents.length} markets from indexer`);
      this.logger.log(`Found ${resolvedMarkets.length} resolved markets`);

      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const event of marketEvents) {
        try {
          const marketId = parseInt(event.marketId);
          const trades = await this.indexerService.getTradingActivity(marketId);
          const boughtVolume = trades.bought.reduce((sum, trade) => {
            return sum + parseFloat(trade.cost);
          }, 0);
          const soldVolume = trades.sold.reduce((sum, trade) => {
            return sum + parseFloat(trade.amount);
          }, 0);

          const tradeCount = trades.bought.length + trades.sold.length;

          const volume = boughtVolume + soldVolume;

          // Check if market already exists in database
          const existingMarket =
            await this.marketsRepository.getMarketById(marketId);

          if (existingMarket) {
            skippedCount++;
            this.logger.debug(`⏭️ Market ${marketId} already exists, skipping`);
            continue;
          }

          const resolvedMarket = resolvedMarkets.find(
            (market) => market.marketId === event.marketId,
          );

          if (resolvedMarket) {
            this.logger.log(
              `✅ Resolved market: ${JSON.stringify(resolvedMarket, null, 2)}`,
            );
          }

          let metadata = null;
          let title: string | null = null;
          let resolutionCriteria: string | null = null;

          if (event.metaDataURI?.startsWith('http')) {
            try {
              const res = await fetch(event.metaDataURI);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              metadata = await res.json();

              // Extract required fields
              title = metadata?.title ?? null;
              resolutionCriteria = metadata?.rules?.description ?? null;
            } catch (err) {
              this.logger.warn(
                `⚠️ Failed to fetch metadata for market ${marketId}: ${err}`,
              );
            }
          }

          // Market doesn't exist, create it
          await this.marketsRepository.upsertMarket({
            marketId,
            creator: event.creator.toLowerCase(),
            startsAt: event.startsAt.toString(),
            expiresAt: event.expiresAt.toString(),
            collateralToken: event.collateralToken.toLowerCase(),
            outcomeCount: parseInt(event.outcomeCount),
            initialCollateral: event.initialCollateral.toString(),
            creatorFeeBps: parseInt(event.creatorFeeBps),
            metaDataURI: event.metaDataURI,
            alpha: event.alpha.toString(),
            title: metadata?.title ?? undefined,
            resolutionCriteria: metadata?.rules?.description ?? undefined,
            resolved: !!resolvedMarket,
            totalVolume: volume.toString(),
            tradeCount: tradeCount,
          });

          syncedCount++;
          this.logger.log(`✅ Created new market ${marketId}`);
        } catch (error) {
          errorCount++;
          this.logger.error(
            `❌ Failed to sync market ${event.marketId}:`,
            error,
          );
        }
      }

      this.logger.log(
        `✅ Market sync completed: ${syncedCount} new markets, ${skippedCount} skipped, ${errorCount} errors`,
      );

      return {
        success: true,
        totalMarkets: marketEvents.length,
        syncedCount,
        skippedCount,
        errorCount,
      };
    } catch (error) {
      this.logger.error('❌ Failed to sync markets from indexer:', error);
      throw error;
    }
  }

  /**
   * Add job to create-markets queue
   */
  async addCreateMarketsJob() {
    await this.createMarketsQueue.add(
      'sync-from-indexer',
      {},
      {
        removeOnComplete: 5,
        removeOnFail: 10,
      },
    );

    this.logger.log('📋 Added create-markets job to queue');
  }
}
